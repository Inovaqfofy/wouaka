// ============================================
// W-KYC ENGINE v1.0
// Sovereign KYC System for UEMOA
// ============================================

import type {
  KycLevel,
  KycLevelConfig,
  KycDocumentType,
  KycStatus,
  Country,
  ExtractedIdentity,
  DocumentVerification,
  FaceMatchResult,
  LivenessResult,
  AddressVerification,
  KycRiskScore,
  KycResult,
  DeviceInfo,
  GeoLocation,
} from './types';

// ============================================
// KYC LEVEL CONFIGURATIONS
// ============================================

export const KYC_LEVEL_CONFIGS: Record<KycLevel, KycLevelConfig> = {
  basic: {
    level: 'basic',
    name: 'KYC Basique',
    description: 'Vérification d\'identité minimale',
    required_documents: [
      { document_type: 'cni', required: true, alternatives: ['passport', 'carte_consulaire'], ocr_enabled: true },
    ],
    requires_selfie: true,
    requires_liveness: false,
    requires_address_verification: false,
    min_age: 18,
    max_processing_hours: 1,
    auto_approve_threshold: 85,
  },
  enhanced: {
    level: 'enhanced',
    name: 'KYC Renforcé',
    description: 'Vérification d\'identité avec adresse',
    required_documents: [
      { document_type: 'cni', required: true, alternatives: ['passport'], ocr_enabled: true },
      { document_type: 'proof_of_address', required: true, alternatives: ['utility_bill', 'bank_statement'], max_age_months: 3, ocr_enabled: true },
    ],
    requires_selfie: true,
    requires_liveness: true,
    requires_address_verification: true,
    min_age: 18,
    max_processing_hours: 4,
    auto_approve_threshold: 80,
  },
  advanced: {
    level: 'advanced',
    name: 'KYC Avancé',
    description: 'Vérification complète pour transactions importantes',
    required_documents: [
      { document_type: 'cni', required: true, alternatives: ['passport'], ocr_enabled: true },
      { document_type: 'proof_of_address', required: true, max_age_months: 3, ocr_enabled: true },
      { document_type: 'bank_statement', required: true, max_age_months: 1, ocr_enabled: true },
    ],
    requires_selfie: true,
    requires_liveness: true,
    requires_address_verification: true,
    min_age: 18,
    max_processing_hours: 24,
    auto_approve_threshold: 90,
  },
};

// ============================================
// UEMOA DOCUMENT TEMPLATES
// ============================================

interface DocumentTemplate {
  country: Country;
  document_type: KycDocumentType;
  name: string;
  dimensions_mm: { width: number; height: number };
  has_mrz: boolean;
  has_barcode: boolean;
  key_fields: string[];
  security_features: string[];
  ocr_zones: { field: string; x: number; y: number; width: number; height: number }[];
}

export const UEMOA_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Sénégal
  {
    country: 'SN',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Sénégalaise',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: true,
    has_barcode: false,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'date_expiration'],
    security_features: ['hologramme', 'microimpression', 'uv_elements'],
    ocr_zones: [
      { field: 'numero', x: 0.1, y: 0.15, width: 0.4, height: 0.08 },
      { field: 'nom', x: 0.35, y: 0.35, width: 0.6, height: 0.08 },
      { field: 'prenom', x: 0.35, y: 0.45, width: 0.6, height: 0.08 },
      { field: 'date_naissance', x: 0.35, y: 0.55, width: 0.3, height: 0.08 },
    ],
  },
  // Côte d'Ivoire
  {
    country: 'CI',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Ivoirienne',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: true,
    has_barcode: true,
    key_fields: ['numero', 'nom', 'prenoms', 'date_naissance', 'lieu_naissance', 'date_expiration', 'profession'],
    security_features: ['hologramme', 'puce_electronique', 'fond_securise'],
    ocr_zones: [
      { field: 'numero', x: 0.55, y: 0.1, width: 0.4, height: 0.08 },
      { field: 'nom', x: 0.35, y: 0.3, width: 0.6, height: 0.08 },
      { field: 'prenoms', x: 0.35, y: 0.4, width: 0.6, height: 0.08 },
      { field: 'date_naissance', x: 0.35, y: 0.5, width: 0.3, height: 0.08 },
    ],
  },
  // Mali
  {
    country: 'ML',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Malienne',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: false,
    has_barcode: false,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance', 'filiation'],
    security_features: ['fond_guillloche', 'microimpression'],
    ocr_zones: [
      { field: 'numero', x: 0.6, y: 0.15, width: 0.35, height: 0.08 },
      { field: 'nom', x: 0.35, y: 0.35, width: 0.6, height: 0.08 },
    ],
  },
  // Burkina Faso
  {
    country: 'BF',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Burkinabè',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: true,
    has_barcode: false,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance', 'profession'],
    security_features: ['hologramme', 'fond_securise'],
    ocr_zones: [],
  },
  // Togo
  {
    country: 'TG',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Togolaise',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: false,
    has_barcode: false,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance'],
    security_features: ['microimpression'],
    ocr_zones: [],
  },
  // Bénin
  {
    country: 'BJ',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Béninoise',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: true,
    has_barcode: true,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance', 'date_expiration'],
    security_features: ['puce_electronique', 'hologramme'],
    ocr_zones: [],
  },
  // Niger
  {
    country: 'NE',
    document_type: 'cni',
    name: 'Carte Nationale d\'Identité Nigérienne',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: false,
    has_barcode: false,
    key_fields: ['numero', 'nom', 'prenom', 'date_naissance'],
    security_features: ['fond_guilloche'],
    ocr_zones: [],
  },
  // Guinée-Bissau
  {
    country: 'GW',
    document_type: 'cni',
    name: 'Bilhete de Identidade Guineense',
    dimensions_mm: { width: 85.6, height: 54 },
    has_mrz: false,
    has_barcode: false,
    key_fields: ['numero', 'nome', 'data_nascimento'],
    security_features: [],
    ocr_zones: [],
  },
];

// ============================================
// FORGERY DETECTION RULES
// ============================================

interface ForgeryCheck {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  check_function: string;
}

export const FORGERY_CHECKS: ForgeryCheck[] = [
  // Document integrity
  { id: 'metadata_tampering', name: 'Métadonnées modifiées', description: 'Détection d\'édition via EXIF', severity: 'high', check_function: 'checkMetadata' },
  { id: 'resolution_inconsistency', name: 'Résolution incohérente', description: 'Zones de résolution différente', severity: 'medium', check_function: 'checkResolution' },
  { id: 'compression_artifacts', name: 'Artefacts de compression', description: 'Double compression JPEG détectée', severity: 'medium', check_function: 'checkCompression' },
  { id: 'font_consistency', name: 'Police incohérente', description: 'Polices différentes détectées', severity: 'high', check_function: 'checkFonts' },
  { id: 'alignment_issues', name: 'Problèmes d\'alignement', description: 'Éléments mal alignés', severity: 'medium', check_function: 'checkAlignment' },
  
  // Screenshot detection
  { id: 'screenshot_indicators', name: 'Indicateurs de capture', description: 'Barre de statut, bordures d\'app', severity: 'high', check_function: 'checkScreenshot' },
  { id: 'screen_reflection', name: 'Reflets d\'écran', description: 'Photo d\'écran détectée', severity: 'high', check_function: 'checkScreenReflection' },
  
  // Photo manipulation
  { id: 'face_swap', name: 'Échange de visage', description: 'Visage potentiellement remplacé', severity: 'high', check_function: 'checkFaceSwap' },
  { id: 'photo_overlay', name: 'Superposition de photo', description: 'Photo collée détectée', severity: 'high', check_function: 'checkPhotoOverlay' },
  
  // Document template
  { id: 'template_mismatch', name: 'Template non conforme', description: 'Ne correspond pas au template officiel', severity: 'high', check_function: 'checkTemplate' },
  { id: 'security_features_missing', name: 'Éléments de sécurité absents', description: 'Hologramme ou watermark manquant', severity: 'high', check_function: 'checkSecurityFeatures' },
];

// ============================================
// KYC RISK SCORING ENGINE
// ============================================

interface KycRiskFactor {
  id: string;
  name: string;
  category: 'identity' | 'document' | 'behavior' | 'geography' | 'history';
  weight: number;
  calculate: (data: KycRiskInput) => { score: number; severity: 'low' | 'medium' | 'high'; description: string };
}

interface KycRiskInput {
  identity: ExtractedIdentity | null;
  document_verification: DocumentVerification | null;
  face_match: FaceMatchResult | null;
  liveness: LivenessResult | null;
  address: AddressVerification | null;
  device: DeviceInfo | null;
  geolocation: GeoLocation | null;
  declared_info: Record<string, unknown>;
  behavioral_signals?: {
    session_duration: number;
    retakes: number;
    time_between_steps: number[];
  };
}

export const KYC_RISK_FACTORS: KycRiskFactor[] = [
  // Identity factors
  {
    id: 'document_confidence',
    name: 'Confiance document',
    category: 'document',
    weight: 0.25,
    calculate: (data) => {
      const conf = data.document_verification?.confidence || 0;
      const score = conf;
      return {
        score,
        severity: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        description: `Confiance OCR: ${Math.round(conf)}%`,
      };
    },
  },
  {
    id: 'face_match_score',
    name: 'Correspondance faciale',
    category: 'identity',
    weight: 0.20,
    calculate: (data) => {
      const match = data.face_match?.match_score || 0;
      const score = match * 100;
      return {
        score,
        severity: score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
        description: data.face_match?.is_match ? 'Visage correspondant' : 'Visage non correspondant',
      };
    },
  },
  {
    id: 'liveness_check',
    name: 'Détection vivacité',
    category: 'identity',
    weight: 0.15,
    calculate: (data) => {
      if (!data.liveness) return { score: 50, severity: 'medium', description: 'Non vérifié' };
      const score = data.liveness.is_live ? data.liveness.confidence : 0;
      return {
        score,
        severity: score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
        description: data.liveness.is_live ? 'Personne réelle confirmée' : 'Échec détection vivacité',
      };
    },
  },
  {
    id: 'document_expiry',
    name: 'Validité document',
    category: 'document',
    weight: 0.10,
    calculate: (data) => {
      const expiry = data.identity?.document_expiry;
      if (!expiry) return { score: 70, severity: 'low', description: 'Date expiration non extraite' };
      const expiryDate = new Date(expiry);
      const now = new Date();
      const monthsUntilExpiry = (expiryDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (monthsUntilExpiry < 0) return { score: 0, severity: 'high', description: 'Document expiré' };
      if (monthsUntilExpiry < 3) return { score: 50, severity: 'medium', description: 'Expire bientôt' };
      return { score: 100, severity: 'low', description: 'Document valide' };
    },
  },
  {
    id: 'data_consistency',
    name: 'Cohérence données',
    category: 'identity',
    weight: 0.15,
    calculate: (data) => {
      let inconsistencies = 0;
      const extracted = data.identity;
      const declared = data.declared_info;
      
      if (extracted?.full_name && declared?.full_name) {
        const similarity = calculateStringSimilarity(
          String(extracted.full_name).toLowerCase(),
          String(declared.full_name).toLowerCase()
        );
        if (similarity < 0.8) inconsistencies++;
      }
      
      if (extracted?.date_of_birth && declared?.date_of_birth) {
        if (extracted.date_of_birth !== declared.date_of_birth) inconsistencies++;
      }
      
      const score = Math.max(0, 100 - inconsistencies * 30);
      return {
        score,
        severity: inconsistencies > 1 ? 'high' : inconsistencies > 0 ? 'medium' : 'low',
        description: inconsistencies > 0 ? `${inconsistencies} incohérence(s) détectée(s)` : 'Données cohérentes',
      };
    },
  },
  {
    id: 'behavioral_signals',
    name: 'Signaux comportementaux',
    category: 'behavior',
    weight: 0.10,
    calculate: (data) => {
      const signals = data.behavioral_signals;
      if (!signals) return { score: 70, severity: 'low', description: 'Pas de données comportementales' };
      
      let score = 100;
      const issues: string[] = [];
      
      // Too fast completion (potential bot)
      if (signals.session_duration < 30) {
        score -= 30;
        issues.push('Complétion trop rapide');
      }
      
      // Too many retakes (potential fraud attempts)
      if (signals.retakes > 5) {
        score -= 20;
        issues.push('Nombreuses reprises');
      }
      
      return {
        score: Math.max(0, score),
        severity: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        description: issues.length > 0 ? issues.join(', ') : 'Comportement normal',
      };
    },
  },
  {
    id: 'address_verification',
    name: 'Vérification adresse',
    category: 'geography',
    weight: 0.05,
    calculate: (data) => {
      if (!data.address) return { score: 50, severity: 'medium', description: 'Adresse non vérifiée' };
      const score = data.address.is_verified ? data.address.confidence : 30;
      return {
        score,
        severity: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        description: data.address.is_verified ? 'Adresse confirmée' : 'Adresse non confirmée',
      };
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

// ============================================
// MAIN KYC ENGINE
// ============================================

export function calculateKycRiskScore(input: KycRiskInput): KycRiskScore {
  const riskFactors: KycRiskScore['risk_factors'] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const factor of KYC_RISK_FACTORS) {
    const result = factor.calculate(input);
    riskFactors.push({
      factor: factor.name,
      severity: result.severity,
      description: result.description,
      weight: factor.weight,
    });
    
    totalWeightedScore += result.score * factor.weight;
    totalWeight += factor.weight;
  }
  
  const finalScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50;
  
  // Determine risk level
  let riskLevel: KycRiskScore['risk_level'];
  if (finalScore >= 80) riskLevel = 'low';
  else if (finalScore >= 60) riskLevel = 'medium';
  else if (finalScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';
  
  // Fraud indicators
  const fraudIndicators: KycRiskScore['fraud_indicators'] = [
    {
      indicator: 'Document falsifié',
      detected: input.document_verification?.forgery_checks?.some(c => !c.passed) || false,
      confidence: input.document_verification?.confidence || 0,
    },
    {
      indicator: 'Selfie non correspondant',
      detected: input.face_match ? !input.face_match.is_match : false,
      confidence: input.face_match?.confidence || 0,
    },
    {
      indicator: 'Détection bot',
      detected: (input.behavioral_signals?.session_duration || 100) < 20,
      confidence: 70,
    },
    {
      indicator: 'Données incohérentes',
      detected: riskFactors.some(f => f.factor === 'Cohérence données' && f.severity === 'high'),
      confidence: 80,
    },
  ];
  
  return {
    score: finalScore,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    fraud_indicators: fraudIndicators,
  };
}

export function determineKycStatus(
  riskScore: KycRiskScore,
  levelConfig: KycLevelConfig
): { status: KycStatus; manual_review_required: boolean; rejection_reason?: string } {
  // Auto-reject if critical fraud detected
  const criticalFraud = riskScore.fraud_indicators.filter(f => f.detected && f.confidence > 80);
  if (criticalFraud.length > 0) {
    return {
      status: 'rejected',
      manual_review_required: false,
      rejection_reason: `Fraude détectée: ${criticalFraud.map(f => f.indicator).join(', ')}`,
    };
  }
  
  // Auto-approve if score above threshold and no high-risk factors
  const highRiskFactors = riskScore.risk_factors.filter(f => f.severity === 'high');
  if (riskScore.score >= levelConfig.auto_approve_threshold && highRiskFactors.length === 0) {
    return {
      status: 'verified',
      manual_review_required: false,
    };
  }
  
  // Require review for medium cases
  if (riskScore.risk_level === 'medium' || highRiskFactors.length > 0) {
    return {
      status: 'requires_review',
      manual_review_required: true,
    };
  }
  
  // Reject low scores
  if (riskScore.score < 40) {
    return {
      status: 'rejected',
      manual_review_required: false,
      rejection_reason: 'Score de risque trop élevé',
    };
  }
  
  return {
    status: 'pending',
    manual_review_required: true,
  };
}

// ============================================
// EXPORTS
// ============================================

export type {
  KycRiskInput,
  KycRiskFactor,
  ForgeryCheck,
  DocumentTemplate,
};
