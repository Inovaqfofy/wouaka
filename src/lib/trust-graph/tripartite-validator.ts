/**
 * TRIPARTITE VALIDATOR
 * Moteur de validation croisée : CNI vs Capture USSD vs SMS
 * Implémente le paradigme "Confiance par la Preuve"
 */

import { jaroWinklerSimilarity, normalizeAfricanName, matchAfricanNames } from './name-matcher';
import type { ExtractionResult } from './sms-transaction-extractor';
import type { UssdScreenshotResult } from './ussd-screenshot-analyzer';

// ============================================
// TYPES
// ============================================

export interface IdentitySource {
  source_type: 'cni' | 'ussd' | 'sms' | 'declared';
  full_name: string;
  phone_number?: string;
  extracted_at: string;
  confidence: number;
  raw_data?: Record<string, unknown>;
}

export interface TripartiteValidationInput {
  cni_identity: IdentitySource | null;
  ussd_capture: UssdScreenshotResult | null;
  sms_transactions: ExtractionResult | null;
  declared_info: {
    full_name: string;
    phone_number: string;
  };
}

export interface NameCorrelation {
  source_a: string;
  source_b: string;
  name_a: string;
  name_b: string;
  similarity_score: number;
  is_match: boolean;
  analysis: string;
}

export interface IdentityCoherenceResult {
  is_coherent: boolean;
  coherence_score: number;
  identity_confidence: number;
  validated_name: string | null;
  validated_phone: string | null;
  correlations: NameCorrelation[];
  discrepancies: IdentityDiscrepancy[];
  recommendations: string[];
  risk_flags: string[];
  certification_level: 'none' | 'partial' | 'verified' | 'certified';
}

export interface IdentityDiscrepancy {
  field: string;
  source_a: { source: string; value: string };
  source_b: { source: string; value: string };
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  requires_justification: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const MATCH_THRESHOLDS = {
  high_confidence: 0.90,    // Correspondance forte
  medium_confidence: 0.80,  // Correspondance acceptable
  low_confidence: 0.70,     // Correspondance faible, requiert attention
  reject: 0.60,             // Rejet - divergence significative
};

const SOURCE_WEIGHTS = {
  cni: 1.0,           // Document officiel = poids maximal
  ussd: 0.85,         // Capture USSD = fiable mais peut être obsolète
  sms: 0.75,          // SMS = nom parfois abrégé
  declared: 0.3,      // Déclaratif = poids minimal
};

const CERTIFICATION_THRESHOLDS = {
  certified: 85,      // Triple validation réussie
  verified: 70,       // Double validation réussie
  partial: 50,        // Validation simple
  none: 0,            // Aucune validation
};

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export function validateTripartiteIdentity(
  input: TripartiteValidationInput
): IdentityCoherenceResult {
  const correlations: NameCorrelation[] = [];
  const discrepancies: IdentityDiscrepancy[] = [];
  const recommendations: string[] = [];
  const riskFlags: string[] = [];

  // Extract names from all sources
  const sources: IdentitySource[] = [];

  // CNI Source
  if (input.cni_identity) {
    sources.push(input.cni_identity);
  }

  // USSD Source
  if (input.ussd_capture?.extractedName) {
    sources.push({
      source_type: 'ussd',
      full_name: input.ussd_capture.extractedName,
      phone_number: input.ussd_capture.extractedPhone || undefined,
      extracted_at: new Date().toISOString(),
      confidence: input.ussd_capture.ocrConfidence / 100,
    });
  }

  // SMS Source - extract name from transaction patterns
  if (input.sms_transactions?.transactions && input.sms_transactions.transactions.length > 0) {
    const smsName = extractNameFromSMS(input.sms_transactions);
    if (smsName) {
      sources.push({
        source_type: 'sms',
        full_name: smsName.name,
        confidence: smsName.confidence,
        extracted_at: new Date().toISOString(),
      });
    }
  }

  // Declared Source
  if (input.declared_info.full_name) {
    sources.push({
      source_type: 'declared',
      full_name: input.declared_info.full_name,
      phone_number: input.declared_info.phone_number,
      extracted_at: new Date().toISOString(),
      confidence: 1.0, // User claims this
    });
  }

  // Perform pairwise comparisons
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const correlation = compareSourceNames(sources[i], sources[j]);
      correlations.push(correlation);

      // Check for significant discrepancies
      if (!correlation.is_match && correlation.similarity_score < MATCH_THRESHOLDS.low_confidence) {
        const severity = determineSeverity(sources[i], sources[j], correlation.similarity_score);
        
        discrepancies.push({
          field: 'full_name',
          source_a: { source: sources[i].source_type, value: sources[i].full_name },
          source_b: { source: sources[j].source_type, value: sources[j].full_name },
          severity,
          explanation: generateDiscrepancyExplanation(sources[i], sources[j], correlation),
          requires_justification: severity === 'high' || severity === 'critical',
        });

        if (severity === 'critical') {
          riskFlags.push(`CRITICAL: Nom "${sources[i].full_name}" (${sources[i].source_type}) ≠ "${sources[j].full_name}" (${sources[j].source_type})`);
        }
      }
    }
  }

  // Calculate coherence score
  const coherenceScore = calculateCoherenceScore(correlations, sources);
  
  // Determine identity confidence
  const identityConfidence = calculateIdentityConfidence(sources, correlations);
  
  // Determine certification level
  const certificationLevel = determineCertificationLevel(sources, coherenceScore, discrepancies);
  
  // Determine validated name (most trusted source with highest correlation)
  const validatedName = selectValidatedName(sources, correlations);
  
  // Generate recommendations
  recommendations.push(...generateRecommendations(sources, discrepancies, coherenceScore));

  return {
    is_coherent: coherenceScore >= CERTIFICATION_THRESHOLDS.verified && 
                 discrepancies.filter(d => d.severity === 'critical').length === 0,
    coherence_score: coherenceScore,
    identity_confidence: identityConfidence,
    validated_name: validatedName,
    validated_phone: input.declared_info.phone_number,
    correlations,
    discrepancies,
    recommendations,
    risk_flags: riskFlags,
    certification_level: certificationLevel,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function compareSourceNames(source_a: IdentitySource, source_b: IdentitySource): NameCorrelation {
  const result = matchAfricanNames(source_a.full_name, source_b.full_name);
  
  return {
    source_a: source_a.source_type,
    source_b: source_b.source_type,
    name_a: source_a.full_name,
    name_b: source_b.full_name,
    similarity_score: result.score / 100,
    is_match: result.score >= 85,
    analysis: result.details.join(', '),
  };
}

function extractNameFromSMS(smsResult: ExtractionResult): { name: string; confidence: number } | null {
  // Look for name patterns in SMS transactions
  // Common patterns: "De: KOUASSI JEAN", "Envoyé à: DIALLO MOUSSA"
  const transactions = smsResult.transactions;
  
  const nameOccurrences: Record<string, number> = {};
  
  for (const tx of transactions) {
    // Extract names from counterparty field
    if (tx.counterparty && tx.counterparty.length > 3) {
      const name = normalizeAfricanName(tx.counterparty);
      if (name && name.length > 5) {
        nameOccurrences[name] = (nameOccurrences[name] || 0) + 1;
      }
    }
  }
  
  // Find the most frequent name (likely the account holder)
  let mostFrequentName: string | null = null;
  let maxOccurrences = 0;
  
  for (const [name, count] of Object.entries(nameOccurrences)) {
    if (count > maxOccurrences) {
      maxOccurrences = count;
      mostFrequentName = name;
    }
  }
  
  if (mostFrequentName && maxOccurrences >= 2) {
    return {
      name: mostFrequentName,
      confidence: Math.min(0.9, 0.5 + (maxOccurrences * 0.1)),
    };
  }
  
  return null;
}

function determineSeverity(
  source_a: IdentitySource,
  source_b: IdentitySource,
  similarity: number
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical if official document differs from capture
  if (
    (source_a.source_type === 'cni' && source_b.source_type === 'ussd') ||
    (source_a.source_type === 'ussd' && source_b.source_type === 'cni')
  ) {
    if (similarity < MATCH_THRESHOLDS.reject) return 'critical';
    if (similarity < MATCH_THRESHOLDS.low_confidence) return 'high';
  }
  
  // High if CNI differs from any verified source
  if (source_a.source_type === 'cni' || source_b.source_type === 'cni') {
    if (similarity < MATCH_THRESHOLDS.reject) return 'high';
    if (similarity < MATCH_THRESHOLDS.low_confidence) return 'medium';
  }
  
  // Lower severity for declarative mismatches
  if (source_a.source_type === 'declared' || source_b.source_type === 'declared') {
    if (similarity < MATCH_THRESHOLDS.reject) return 'medium';
    return 'low';
  }
  
  return 'medium';
}

function generateDiscrepancyExplanation(
  source_a: IdentitySource,
  source_b: IdentitySource,
  correlation: NameCorrelation
): string {
  const sim = Math.round(correlation.similarity_score * 100);
  
  if (correlation.similarity_score < MATCH_THRESHOLDS.reject) {
    return `Les noms sont significativement différents (${sim}% de similarité). ` +
           `Cela peut indiquer un numéro Mobile Money appartenant à une autre personne.`;
  }
  
  if (source_a.source_type === 'sms' || source_b.source_type === 'sms') {
    return `Le nom extrait des SMS peut être abrégé ou formaté différemment (${sim}% de similarité).`;
  }
  
  return `Différence détectée entre ${source_a.source_type.toUpperCase()} et ${source_b.source_type.toUpperCase()} (${sim}% de similarité).`;
}

function calculateCoherenceScore(
  correlations: NameCorrelation[],
  sources: IdentitySource[]
): number {
  if (correlations.length === 0) return 0;
  if (sources.length <= 1) return sources[0]?.source_type === 'cni' ? 50 : 20;
  
  // Calculate weighted average of correlations
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const corr of correlations) {
    const weight_a = SOURCE_WEIGHTS[corr.source_a as keyof typeof SOURCE_WEIGHTS] || 0.5;
    const weight_b = SOURCE_WEIGHTS[corr.source_b as keyof typeof SOURCE_WEIGHTS] || 0.5;
    const combinedWeight = (weight_a + weight_b) / 2;
    
    totalWeightedScore += corr.similarity_score * combinedWeight * 100;
    totalWeight += combinedWeight;
  }
  
  return Math.round(totalWeightedScore / totalWeight);
}

function calculateIdentityConfidence(
  sources: IdentitySource[],
  correlations: NameCorrelation[]
): number {
  // Base confidence from source diversity
  let confidence = 0;
  
  if (sources.some(s => s.source_type === 'cni')) confidence += 40;
  if (sources.some(s => s.source_type === 'ussd')) confidence += 25;
  if (sources.some(s => s.source_type === 'sms')) confidence += 15;
  
  // Boost from correlations
  const avgSimilarity = correlations.length > 0
    ? correlations.reduce((sum, c) => sum + c.similarity_score, 0) / correlations.length
    : 0;
  
  confidence += avgSimilarity * 20;
  
  return Math.min(100, Math.round(confidence));
}

function determineCertificationLevel(
  sources: IdentitySource[],
  coherenceScore: number,
  discrepancies: IdentityDiscrepancy[]
): 'none' | 'partial' | 'verified' | 'certified' {
  const hasCriticalDiscrepancy = discrepancies.some(d => d.severity === 'critical');
  if (hasCriticalDiscrepancy) return 'none';
  
  const hasCNI = sources.some(s => s.source_type === 'cni');
  const hasUSSD = sources.some(s => s.source_type === 'ussd');
  const hasSMS = sources.some(s => s.source_type === 'sms');
  
  // Certified: Triple validation with high coherence
  if (hasCNI && hasUSSD && coherenceScore >= CERTIFICATION_THRESHOLDS.certified) {
    return 'certified';
  }
  
  // Verified: Double validation
  if ((hasCNI && hasUSSD) || (hasCNI && hasSMS)) {
    if (coherenceScore >= CERTIFICATION_THRESHOLDS.verified) {
      return 'verified';
    }
  }
  
  // Partial: Single strong source
  if (hasCNI && coherenceScore >= CERTIFICATION_THRESHOLDS.partial) {
    return 'partial';
  }
  
  return 'none';
}

function selectValidatedName(
  sources: IdentitySource[],
  correlations: NameCorrelation[]
): string | null {
  // Priority: CNI > USSD > SMS > Declared
  const priorityOrder: Array<'cni' | 'ussd' | 'sms' | 'declared'> = ['cni', 'ussd', 'sms', 'declared'];
  
  for (const sourceType of priorityOrder) {
    const source = sources.find(s => s.source_type === sourceType);
    if (source) {
      return source.full_name;
    }
  }
  
  return null;
}

function generateRecommendations(
  sources: IdentitySource[],
  discrepancies: IdentityDiscrepancy[],
  coherenceScore: number
): string[] {
  const recommendations: string[] = [];
  
  // Missing sources
  const sourceTypes = sources.map(s => s.source_type);
  
  if (!sourceTypes.includes('ussd')) {
    recommendations.push('Ajoutez une capture d\'écran de votre profil Mobile Money pour augmenter votre niveau de certification.');
  }
  
  if (!sourceTypes.includes('cni')) {
    recommendations.push('Téléchargez votre pièce d\'identité pour valider votre identité.');
  }
  
  // Discrepancy recommendations
  const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical');
  if (criticalDiscrepancies.length > 0) {
    recommendations.push('ATTENTION : Des incohérences critiques ont été détectées. Veuillez vérifier que le numéro Mobile Money vous appartient bien.');
  }
  
  const highDiscrepancies = discrepancies.filter(d => d.severity === 'high');
  if (highDiscrepancies.length > 0) {
    recommendations.push('Des différences significatives ont été détectées. Vous pouvez fournir un justificatif ou un garant pour clarifier.');
  }
  
  // Low coherence
  if (coherenceScore < 60) {
    recommendations.push('Votre niveau de cohérence est faible. Ajoutez plus de preuves pour améliorer votre profil.');
  }
  
  return recommendations;
}

// ============================================
// FRAUD DETECTION
// ============================================

export interface PhoneFraudCheck {
  is_suspicious: boolean;
  fraud_indicators: Array<{
    indicator: string;
    severity: 'warning' | 'high' | 'critical';
    description: string;
  }>;
  fraud_score: number;
}

export async function checkPhoneFraud(
  phoneNumber: string,
  userId: string,
  supabaseClient: any
): Promise<PhoneFraudCheck> {
  const indicators: PhoneFraudCheck['fraud_indicators'] = [];
  let fraudScore = 0;
  
  // Check if phone number is used by multiple identities
  const { data: existingUsages, error } = await supabaseClient
    .from('phone_trust_scores')
    .select('user_id, certification_level, trust_score')
    .eq('phone_number', phoneNumber)
    .neq('user_id', userId);
  
  if (existingUsages && existingUsages.length > 0) {
    // Phone used by others
    const certifiedUsages = existingUsages.filter((u: any) => u.certification_level === 'certified');
    
    if (certifiedUsages.length > 0) {
      indicators.push({
        indicator: 'DUPLICATE_CERTIFIED_PHONE',
        severity: 'critical',
        description: `Ce numéro est déjà certifié par ${certifiedUsages.length} autre(s) utilisateur(s).`,
      });
      fraudScore += 80;
    } else if (existingUsages.length > 0) {
      indicators.push({
        indicator: 'DUPLICATE_PHONE',
        severity: 'high',
        description: `Ce numéro est utilisé par ${existingUsages.length} autre(s) utilisateur(s).`,
      });
      fraudScore += 50;
    }
  }
  
  return {
    is_suspicious: fraudScore > 30,
    fraud_indicators: indicators,
    fraud_score: Math.min(100, fraudScore),
  };
}
