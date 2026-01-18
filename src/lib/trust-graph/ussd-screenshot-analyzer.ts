/**
 * WOUAKA USSD Screenshot Analyzer
 * Local OCR analysis for Mobile Money profile screenshots
 */

import Tesseract from 'tesseract.js';
import { matchAfricanNames } from './name-matcher';

export type MoMoProvider = 'orange_money' | 'mtn_momo' | 'wave' | 'moov' | 'unknown';
export type ScreenType = 'profile' | 'balance' | 'history' | 'menu' | 'unknown';

export interface UssdScreenshotResult {
  provider: MoMoProvider;
  screenType: ScreenType;
  
  // Extracted data
  extractedName: string | null;
  extractedPhone: string | null;
  extractedBalance: number | null;
  extractedAccountStatus: string | null;
  
  // Validation
  ocrConfidence: number;
  tamperingProbability: number;
  uiAuthenticityScore: number;
  
  // Cross-validation with CNI
  nameMatchResult?: {
    cniName: string;
    matchScore: number;
    isMatch: boolean;
    details: string[];
  };
  
  // Raw data
  fullText: string;
  processingTimeMs: number;
}

// UI patterns for provider detection
const PROVIDER_PATTERNS: Record<MoMoProvider, RegExp[]> = {
  orange_money: [
    /orange\s*money/i,
    /mon\s*compte\s*om/i,
    /\*144#/i,
    /\*122#/i,
    /solde\s*disponible/i,
    /orange\s*ci|orange\s*sn|orange\s*ml/i,
  ],
  mtn_momo: [
    /mtn\s*mo(?:bile\s*)?mo(?:ney)?/i,
    /momo/i,
    /\*170#/i,
    /\*126#/i,
    /y'ello/i,
    /mtn\s*ci|mtn\s*gh/i,
  ],
  wave: [
    /wave/i,
    /solde\s*wave/i,
    /wave\s*mobile/i,
    /transfert\s*wave/i,
  ],
  moov: [
    /moov\s*money/i,
    /flooz/i,
    /moov\s*africa/i,
    /\*155#/i,
  ],
  unknown: [],
};

// Screen type patterns
const SCREEN_TYPE_PATTERNS: Record<ScreenType, RegExp[]> = {
  profile: [
    /profil|profile/i,
    /mon\s*compte/i,
    /informations?\s*personnelles?/i,
    /nom\s*complet|nom\s*et\s*pr[eé]nom/i,
    /titulaire/i,
    /account\s*holder/i,
  ],
  balance: [
    /solde|balance/i,
    /disponible|available/i,
    /fcfa|xof|gnf/i,
    /votre\s*solde/i,
    /your\s*balance/i,
  ],
  history: [
    /historique|history/i,
    /transactions?/i,
    /derniers?\s*(?:op[eé]rations?|mouvements?)/i,
    /recent\s*(?:transactions?|activity)/i,
  ],
  menu: [
    /menu\s*principal/i,
    /accueil|home/i,
    /services?/i,
    /transfert|paiement|retrait/i,
  ],
  unknown: [],
};

// Extraction patterns for profile data
const NAME_EXTRACTION_PATTERNS = [
  /(?:nom\s*(?:complet)?|name|titulaire)\s*:?\s*([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][A-Za-zàâäéèêëïîôöùûüç\s'-]+)/i,
  /(?:pr[eé]nom\s*et\s*nom|nom\s*et\s*pr[eé]nom)\s*:?\s*(.+)/i,
  /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})$/m,
];

const PHONE_EXTRACTION_PATTERNS = [
  /(?:t[eé]l[eé]?(?:phone)?|num[eé]ro|n°|mobile)\s*:?\s*(\+?[\d\s-]{8,15})/i,
  /(\+?(?:221|225|223|226|228|229|245|224)[\d\s-]{8,12})/,
  /(\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/,
];

const BALANCE_EXTRACTION_PATTERNS = [
  /(?:solde|balance|disponible)\s*:?\s*([\d\s,.]+)\s*(?:fcfa|xof|f|cfa)/i,
  /([\d\s,.]+)\s*(?:fcfa|xof|f\s*cfa)/i,
];

/**
 * Detect provider from screenshot text
 */
function detectProvider(text: string): MoMoProvider {
  for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    if (provider === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return provider as MoMoProvider;
      }
    }
  }
  return 'unknown';
}

/**
 * Detect screen type from text
 */
function detectScreenType(text: string): ScreenType {
  // Score each type
  const scores: Record<ScreenType, number> = {
    profile: 0,
    balance: 0,
    history: 0,
    menu: 0,
    unknown: 0,
  };

  for (const [type, patterns] of Object.entries(SCREEN_TYPE_PATTERNS)) {
    if (type === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        scores[type as ScreenType] += 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'unknown';
  
  return Object.entries(scores).find(([_, s]) => s === maxScore)?.[0] as ScreenType || 'unknown';
}

/**
 * Extract name from OCR text
 */
function extractName(text: string): string | null {
  for (const pattern of NAME_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate name (at least 2 parts, reasonable length)
      if (name.length >= 3 && name.length <= 50 && name.includes(' ')) {
        return name;
      }
    }
  }
  return null;
}

/**
 * Extract phone number
 */
function extractPhone(text: string): string | null {
  for (const pattern of PHONE_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean and format
      const phone = match[1].replace(/[\s.-]/g, '');
      if (phone.length >= 8 && phone.length <= 15) {
        return phone;
      }
    }
  }
  return null;
}

/**
 * Extract balance
 */
function extractBalance(text: string): number | null {
  for (const pattern of BALANCE_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/[\s,]/g, '').replace('.', ''));
      if (!isNaN(amount) && amount >= 0) {
        return amount;
      }
    }
  }
  return null;
}

/**
 * Calculate tampering probability based on text patterns
 */
function calculateTamperingProbability(text: string, ocrConfidence: number): number {
  let probability = 0;
  
  // Low OCR confidence suggests manipulation
  if (ocrConfidence < 60) {
    probability += 20;
  }
  
  // Suspiciously round numbers
  const amounts = text.match(/([\d,]+)\s*(?:fcfa|xof)/gi) || [];
  const roundAmounts = amounts.filter(a => {
    const num = parseInt(a.replace(/\D/g, ''));
    return num > 0 && num % 1000 === 0 && num % 10000 === 0;
  });
  if (roundAmounts.length > 2) {
    probability += 10;
  }
  
  // Inconsistent formatting
  const hasMultipleFonts = /[A-Z]{3,}.*[a-z]{3,}.*[A-Z]{3,}/m.test(text);
  if (hasMultipleFonts) {
    probability += 15;
  }
  
  // Missing expected elements for profile screen
  const hasName = NAME_EXTRACTION_PATTERNS.some(p => p.test(text));
  const hasPhone = PHONE_EXTRACTION_PATTERNS.some(p => p.test(text));
  if (!hasName && !hasPhone && detectScreenType(text) === 'profile') {
    probability += 25;
  }
  
  return Math.min(100, probability);
}

/**
 * Calculate UI authenticity score
 */
function calculateUiAuthenticity(text: string, provider: MoMoProvider): number {
  let score = 50; // Base score
  
  // Provider-specific elements increase authenticity
  const providerPatterns = PROVIDER_PATTERNS[provider] || [];
  const matchedPatterns = providerPatterns.filter(p => p.test(text)).length;
  score += matchedPatterns * 10;
  
  // Standard UI elements
  if (/menu|retour|suivant|ok|annuler|valider/i.test(text)) {
    score += 10;
  }
  
  // Date/time patterns suggest real screenshot
  if (/\d{1,2}[:/h]\d{2}|\d{2}[/-]\d{2}[/-]\d{4}/i.test(text)) {
    score += 5;
  }
  
  // Network/battery indicators
  if (/4g|3g|wifi|%|batterie|réseau/i.test(text)) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Analyze a USSD/MoMo screenshot image
 */
export async function analyzeUssdScreenshot(
  imageFile: File | Blob,
  cniName?: string
): Promise<UssdScreenshotResult> {
  const startTime = Date.now();
  
  // Perform OCR
  const result = await Tesseract.recognize(imageFile, 'fra+eng', {
    logger: (m) => console.log('[OCR]', m.status, Math.round((m.progress || 0) * 100) + '%'),
  });
  
  const text = result.data.text;
  const ocrConfidence = result.data.confidence;
  
  // Detect provider and screen type
  const provider = detectProvider(text);
  const screenType = detectScreenType(text);
  
  // Extract data
  const extractedName = extractName(text);
  const extractedPhone = extractPhone(text);
  const extractedBalance = extractBalance(text);
  
  // Calculate security scores
  const tamperingProbability = calculateTamperingProbability(text, ocrConfidence);
  const uiAuthenticityScore = calculateUiAuthenticity(text, provider);
  
  // Cross-validate with CNI if provided
  let nameMatchResult: UssdScreenshotResult['nameMatchResult'] | undefined;
  
  if (cniName && extractedName) {
    const match = matchAfricanNames(cniName, extractedName);
    nameMatchResult = {
      cniName,
      matchScore: match.score,
      isMatch: match.score >= 85,
      details: match.details,
    };
  }
  
  return {
    provider,
    screenType,
    extractedName,
    extractedPhone,
    extractedBalance,
    extractedAccountStatus: null, // Could be extracted with more patterns
    ocrConfidence,
    tamperingProbability,
    uiAuthenticityScore,
    nameMatchResult,
    fullText: text,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Validate screenshot for phone certification
 */
export function validateForCertification(result: UssdScreenshotResult): {
  canCertify: boolean;
  reasons: string[];
  score: number;
} {
  const reasons: string[] = [];
  let score = 0;
  
  // OCR confidence
  if (result.ocrConfidence >= 70) {
    score += 20;
  } else {
    reasons.push('Qualité OCR insuffisante');
  }
  
  // Provider detected
  if (result.provider !== 'unknown') {
    score += 15;
  } else {
    reasons.push('Provider non détecté');
  }
  
  // Name extracted
  if (result.extractedName) {
    score += 20;
  } else {
    reasons.push('Nom non extrait');
  }
  
  // Phone extracted
  if (result.extractedPhone) {
    score += 10;
  }
  
  // Low tampering
  if (result.tamperingProbability < 30) {
    score += 15;
  } else if (result.tamperingProbability > 50) {
    reasons.push('Suspicion de manipulation');
  }
  
  // UI authenticity
  if (result.uiAuthenticityScore >= 70) {
    score += 10;
  }
  
  // Name match
  if (result.nameMatchResult?.isMatch) {
    score += 30;
  } else if (result.nameMatchResult && !result.nameMatchResult.isMatch) {
    reasons.push(`Correspondance nom: ${result.nameMatchResult.matchScore}%`);
  }
  
  return {
    canCertify: score >= 70 && reasons.length === 0,
    reasons,
    score,
  };
}
