/**
 * Utilitaires pour le SDK Wouaka
 */

import crypto from 'crypto';

/**
 * Vérifie la signature d'un webhook Wouaka
 * 
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@wouaka/sdk';
 * 
 * const isValid = verifyWebhookSignature(
 *   requestBody,
 *   signatureHeader,
 *   webhookSecret
 * );
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Comparaison sécurisée pour éviter les timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse le header de signature Wouaka
 * Format: "t=timestamp,v1=signature"
 */
export function parseSignatureHeader(header: string): {
  timestamp: number;
  signature: string;
} | null {
  try {
    const parts = header.split(',');
    let timestamp = 0;
    let signature = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signature = value;
      }
    }

    if (!timestamp || !signature) {
      return null;
    }

    return { timestamp, signature };
  } catch {
    return null;
  }
}

/**
 * Vérifie un webhook avec protection contre les replay attacks
 */
export function verifyWebhook(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): { valid: boolean; error?: string } {
  const parsed = parseSignatureHeader(signatureHeader);
  
  if (!parsed) {
    return { valid: false, error: 'Format de signature invalide' };
  }

  const { timestamp, signature } = parsed;

  // Vérifier la fraîcheur du timestamp
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'Timestamp expiré (replay attack potentiel)' };
  }

  // Construire le payload signé (timestamp.payload)
  const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
  const signedPayload = `${timestamp}.${payloadString}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid: isValid, error: isValid ? undefined : 'Signature invalide' };
  } catch {
    return { valid: false, error: 'Erreur de vérification de signature' };
  }
}

/**
 * Formater un numéro de téléphone au format international
 */
export function formatPhoneNumber(phone: string, defaultCountry: string = 'CI'): string {
  // Retirer tous les caractères non numériques sauf +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Si déjà au format international
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Préfixes par pays
  const prefixes: Record<string, string> = {
    CI: '+225',
    SN: '+221',
    ML: '+223',
    BF: '+226',
    BJ: '+229',
    TG: '+228',
    NE: '+227',
    GW: '+245',
  };

  // Retirer le 0 initial si présent
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  const prefix = prefixes[defaultCountry] || '+225';
  return `${prefix}${cleaned}`;
}

/**
 * Valider un numéro de téléphone UEMOA
 */
export function isValidUEMOAPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Patterns valides pour UEMOA
  const patterns = [
    /^\+225[0-9]{10}$/,  // Côte d'Ivoire
    /^\+221[0-9]{9}$/,   // Sénégal
    /^\+223[0-9]{8}$/,   // Mali
    /^\+226[0-9]{8}$/,   // Burkina Faso
    /^\+229[0-9]{8}$/,   // Bénin
    /^\+228[0-9]{8}$/,   // Togo
    /^\+227[0-9]{8}$/,   // Niger
    /^\+245[0-9]{7}$/,   // Guinée-Bissau
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Détecter le pays à partir d'un numéro de téléphone
 */
export function detectCountryFromPhone(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  const countryPrefixes: Record<string, string> = {
    '+225': 'CI',
    '+221': 'SN',
    '+223': 'ML',
    '+226': 'BF',
    '+229': 'BJ',
    '+228': 'TG',
    '+227': 'NE',
    '+245': 'GW',
  };

  for (const [prefix, country] of Object.entries(countryPrefixes)) {
    if (cleaned.startsWith(prefix)) {
      return country;
    }
  }

  return null;
}

/**
 * Calculer le grade à partir d'un score
 */
export function scoreToGrade(score: number): string {
  if (score >= 800) return 'A+';
  if (score >= 750) return 'A';
  if (score >= 700) return 'B+';
  if (score >= 650) return 'B';
  if (score >= 600) return 'C+';
  if (score >= 550) return 'C';
  if (score >= 450) return 'D';
  return 'E';
}

/**
 * Calculer la catégorie de risque à partir d'un score
 */
export function scoreToRiskCategory(score: number): string {
  if (score >= 750) return 'very_low';
  if (score >= 650) return 'low';
  if (score >= 550) return 'medium';
  if (score >= 450) return 'high';
  return 'very_high';
}

/**
 * Délai avec retry exponentiel
 */
export function calculateBackoff(attempt: number, baseMs = 1000, maxMs = 30000): number {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  // Ajouter du jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

/**
 * Sleep async
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Masquer partiellement un numéro de téléphone
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  const start = phone.substring(0, 6);
  const end = phone.substring(phone.length - 2);
  const middle = '*'.repeat(phone.length - 8);
  return `${start}${middle}${end}`;
}

/**
 * Masquer partiellement un identifiant national
 */
export function maskNationalId(id: string): string {
  if (id.length < 6) return id;
  const start = id.substring(0, 2);
  const end = id.substring(id.length - 2);
  const middle = '*'.repeat(id.length - 4);
  return `${start}${middle}${end}`;
}
