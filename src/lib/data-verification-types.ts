/**
 * Data Verification Types and Utilities
 * Distinguishes between verified and declared data sources
 */

export type DataSourceStatus = 'verified' | 'declared' | 'partially_verified' | 'unverified';

export interface DataSourceInfo {
  source_id: string;
  source_name: string;
  source_type: 'document' | 'api' | 'user_input' | 'ocr' | 'partner_attestation' | 'public_registry';
  status: DataSourceStatus;
  confidence: number; // 0-100
  verification_method?: string;
  verified_at?: string;
  verified_by?: string;
  raw_value: unknown;
  normalized_value: unknown;
  discrepancy_notes?: string;
}

export interface VerifiedDataSummary {
  total_fields: number;
  verified_count: number;
  declared_count: number;
  partially_verified_count: number;
  overall_confidence: number;
  data_quality: 'high' | 'medium' | 'low' | 'insufficient';
  verification_rate: number; // 0-100%
  sources: DataSourceInfo[];
  warnings: string[];
}

// ============================================
// VERIFICATION STATUS DETERMINATION
// ============================================

/**
 * Determine the verification status of a data field
 */
export function determineVerificationStatus(
  sourceType: string,
  confidence: number,
  hasDocumentProof: boolean,
  crossValidated: boolean
): DataSourceStatus {
  // High-trust sources
  if (sourceType === 'api' && confidence >= 90) {
    return 'verified';
  }

  // OCR with cross-validation
  if (sourceType === 'ocr' && crossValidated && confidence >= 70) {
    return 'verified';
  }

  // Document proof with good confidence
  if (hasDocumentProof && confidence >= 60) {
    return 'partially_verified';
  }

  // Partner attestation
  if (sourceType === 'partner_attestation' && confidence >= 80) {
    return 'verified';
  }

  // Public registry lookup
  if (sourceType === 'public_registry' && confidence >= 75) {
    return 'verified';
  }

  // User input without verification
  if (sourceType === 'user_input') {
    return 'declared';
  }

  // Low confidence or unknown source
  if (confidence < 50) {
    return 'unverified';
  }

  return 'declared';
}

/**
 * Calculate overall data quality from sources
 */
export function calculateDataQuality(sources: DataSourceInfo[]): VerifiedDataSummary {
  if (sources.length === 0) {
    return {
      total_fields: 0,
      verified_count: 0,
      declared_count: 0,
      partially_verified_count: 0,
      overall_confidence: 0,
      data_quality: 'insufficient',
      verification_rate: 0,
      sources: [],
      warnings: ['Aucune source de données fournie'],
    };
  }

  const verified = sources.filter(s => s.status === 'verified').length;
  const declared = sources.filter(s => s.status === 'declared').length;
  const partial = sources.filter(s => s.status === 'partially_verified').length;
  
  const totalConfidence = sources.reduce((sum, s) => sum + s.confidence, 0);
  const avgConfidence = totalConfidence / sources.length;
  
  const verificationRate = ((verified + partial * 0.5) / sources.length) * 100;
  
  // Determine quality
  let quality: 'high' | 'medium' | 'low' | 'insufficient';
  if (verificationRate >= 70 && avgConfidence >= 75) {
    quality = 'high';
  } else if (verificationRate >= 40 && avgConfidence >= 50) {
    quality = 'medium';
  } else if (verificationRate >= 20 || avgConfidence >= 30) {
    quality = 'low';
  } else {
    quality = 'insufficient';
  }

  // Generate warnings
  const warnings: string[] = [];
  if (verificationRate < 30) {
    warnings.push('Moins de 30% des données sont vérifiées - score moins fiable');
  }
  if (declared > verified * 2) {
    warnings.push('La majorité des données sont déclaratives - vérification recommandée');
  }
  if (avgConfidence < 60) {
    warnings.push('Confiance moyenne faible - données potentiellement incomplètes');
  }

  return {
    total_fields: sources.length,
    verified_count: verified,
    declared_count: declared,
    partially_verified_count: partial,
    overall_confidence: Math.round(avgConfidence),
    data_quality: quality,
    verification_rate: Math.round(verificationRate),
    sources,
    warnings,
  };
}

// ============================================
// CONFIDENCE ADJUSTMENTS
// ============================================

/**
 * Apply confidence penalty based on data quality
 */
export function applyDataQualityPenalty(
  baseScore: number,
  dataSummary: VerifiedDataSummary
): { adjustedScore: number; penalty: number; reason: string } {
  let penalty = 0;
  let reason = '';

  switch (dataSummary.data_quality) {
    case 'high':
      // No penalty, maybe small bonus
      penalty = -2; // Bonus
      reason = 'Données de haute qualité - bonus de confiance';
      break;
    case 'medium':
      penalty = 0;
      reason = 'Qualité de données acceptable';
      break;
    case 'low':
      penalty = 5;
      reason = 'Qualité de données faible - pénalité appliquée';
      break;
    case 'insufficient':
      penalty = 15;
      reason = 'Données insuffisantes - pénalité significative';
      break;
  }

  // Additional penalty if too many declared vs verified
  if (dataSummary.verification_rate < 20) {
    penalty += 5;
    reason += ' (+ pénalité données non vérifiées)';
  }

  const adjustedScore = Math.max(0, Math.min(100, baseScore - penalty));

  return { adjustedScore, penalty, reason };
}

// ============================================
// SOURCE TRACKING HELPERS
// ============================================

/**
 * Create a verified data source entry
 */
export function createVerifiedSource(
  id: string,
  name: string,
  type: DataSourceInfo['source_type'],
  value: unknown,
  confidence: number,
  verificationMethod: string
): DataSourceInfo {
  return {
    source_id: id,
    source_name: name,
    source_type: type,
    status: 'verified',
    confidence,
    verification_method: verificationMethod,
    verified_at: new Date().toISOString(),
    raw_value: value,
    normalized_value: value,
  };
}

/**
 * Create a declared (unverified) data source entry
 */
export function createDeclaredSource(
  id: string,
  name: string,
  value: unknown,
  confidence: number = 40
): DataSourceInfo {
  return {
    source_id: id,
    source_name: name,
    source_type: 'user_input',
    status: 'declared',
    confidence,
    raw_value: value,
    normalized_value: value,
  };
}

/**
 * Create a partially verified source (e.g., OCR without cross-validation)
 */
export function createPartiallyVerifiedSource(
  id: string,
  name: string,
  type: DataSourceInfo['source_type'],
  value: unknown,
  confidence: number,
  discrepancy?: string
): DataSourceInfo {
  return {
    source_id: id,
    source_name: name,
    source_type: type,
    status: 'partially_verified',
    confidence,
    raw_value: value,
    normalized_value: value,
    discrepancy_notes: discrepancy,
  };
}

// ============================================
// DISPLAY HELPERS
// ============================================

export const STATUS_LABELS: Record<DataSourceStatus, string> = {
  verified: 'Vérifié',
  declared: 'Déclaré',
  partially_verified: 'Partiellement vérifié',
  unverified: 'Non vérifié',
};

export const STATUS_COLORS: Record<DataSourceStatus, string> = {
  verified: 'text-green-600 bg-green-50',
  declared: 'text-amber-600 bg-amber-50',
  partially_verified: 'text-blue-600 bg-blue-50',
  unverified: 'text-red-600 bg-red-50',
};

export const QUALITY_LABELS: Record<string, string> = {
  high: 'Haute qualité',
  medium: 'Qualité moyenne',
  low: 'Qualité faible',
  insufficient: 'Données insuffisantes',
};

export const QUALITY_COLORS: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-amber-600',
  low: 'text-orange-600',
  insufficient: 'text-red-600',
};
