export interface ScoringInputData {
  // Personal information
  full_name: string;
  national_id?: string;
  phone_number?: string;
  
  // Business information
  company_name?: string;
  rccm_number?: string;
  employment_type: 'employed' | 'self_employed' | 'business_owner' | 'freelancer';
  years_in_business: number;
  sector?: string;
  
  // Financial data
  monthly_income: number;
  monthly_expenses: number;
  existing_loans: number;
  mobile_money_volume: number;
  
  // Behavioral data
  sim_age_months: number;
  mobile_money_transactions: number;
  utility_payments_on_time: number;
  utility_payments_late: number;
  
  // Location
  region?: string;
  city?: string;
}

export interface FeatureImportance {
  feature: string;
  value: number;
  weight: number;
  contribution: number;
  impact: 'positive' | 'neutral' | 'negative';
  verified?: boolean;
  source?: string;
  confidence?: number;
}

// Data transparency for real scoring
export interface DataTransparency {
  verified_sources: Array<{
    feature: string;
    source: string;
    confidence: number;
  }>;
  declared_sources: string[];
  verified_count: number;
  declared_count: number;
  total_features?: number;
  confidence_explanation: string;
}

// Credit recommendations from v5.2
export interface CreditRecommendations {
  approved?: boolean;
  max_amount?: number;
  max_amount_multiplier: number;
  max_tenor_months: number;
  estimated_max_loan: number;
  suggested_rate_adjustment?: number;
  conditions?: string[];
}

// Sub-score from v5.2 (6 layers)
export interface SubScore {
  id: string;
  name: string;
  score: number;
  weight: number;
  features_used: string[];
  confidence: number;
  explanation: string;
}

// Fraud alert from v5.2
export interface FraudAlert {
  rule_id: string;
  message: string;
  penalty: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

// Fraud analysis from v5.2
export interface FraudAnalysis {
  alerts: FraudAlert[];
  total_penalty: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  categories_triggered?: string[];
  cross_validation_score?: number;
}

// UEMOA Compliance flags v5.2
export interface ComplianceFlags {
  consent_tracked: boolean;
  explainable: boolean;
  non_discriminatory: boolean;
  data_minimization: boolean;
  retention_policy: string;
  right_to_explanation?: boolean;
  sovereign_processing?: boolean;
}

export interface ScoringResult {
  // Main score (0-100)
  score: number;
  grade: string;
  risk_category: string;
  risk_description?: string;
  confidence: number;
  
  // 6 Sub-scores (v5.2)
  sub_scores?: SubScore[];
  
  // 4 Business sub-indicators (0-100)
  reliability: number;
  stability: number;
  short_term_risk: number;
  engagement_capacity: number;
  
  // Credit recommendations (v5.2)
  credit_recommendations?: CreditRecommendations;
  
  // Fraud analysis (v5.2)
  fraud_analysis?: FraudAnalysis;
  
  // Explanations
  explanations: string[];
  recommendations: string[];
  positive_factors?: string[];
  negative_factors?: string[];
  improvement_suggestions?: string[];
  feature_importance: FeatureImportance[];
  
  // Metadata
  processing_time_ms: number;
  model_version: string;
  calculated_at?: string;
  
  // Data transparency
  data_transparency?: DataTransparency;
  is_real?: boolean;
  is_demo?: boolean;
  
  // UEMOA Compliance (v5.2)
  compliance?: ComplianceFlags;
}

export const RISK_CATEGORY_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' },
  good: { label: 'Bon', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  fair: { label: 'Moyen', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  poor: { label: 'Faible', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  very_poor: { label: 'Très faible', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const GRADE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  'A+': { label: 'A+', color: 'text-green-700', bgColor: 'bg-green-100' },
  'A': { label: 'A', color: 'text-green-600', bgColor: 'bg-green-50' },
  'B+': { label: 'B+', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  'B': { label: 'B', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'C+': { label: 'C+', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'C': { label: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'D': { label: 'D', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'E': { label: 'E', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const BUSINESS_INDICATORS = [
  { key: 'reliability', label: 'Fiabilité', description: 'Historique de paiements et formalisation' },
  { key: 'stability', label: 'Stabilité', description: 'Stabilité professionnelle et digitale' },
  { key: 'short_term_risk', label: 'Risque CT', description: 'Risque à court terme (100 = faible)' },
  { key: 'engagement_capacity', label: 'Capacité', description: 'Capacité d\'engagement financier' },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'employed', label: 'Salarié' },
  { value: 'self_employed', label: 'Travailleur indépendant' },
  { value: 'business_owner', label: 'Chef d\'entreprise' },
  { value: 'freelancer', label: 'Freelance' },
];

export const SECTORS = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'services', label: 'Services' },
  { value: 'technology', label: 'Technologie' },
  { value: 'finance', label: 'Finance' },
  { value: 'construction', label: 'Construction' },
  { value: 'transport', label: 'Transport' },
  { value: 'education', label: 'Éducation' },
  { value: 'health', label: 'Santé' },
  { value: 'other', label: 'Autre' },
];

export const WEST_AFRICAN_CITIES = [
  { value: 'abidjan', label: 'Abidjan', country: 'Côte d\'Ivoire' },
  { value: 'dakar', label: 'Dakar', country: 'Sénégal' },
  { value: 'lagos', label: 'Lagos', country: 'Nigeria' },
  { value: 'accra', label: 'Accra', country: 'Ghana' },
  { value: 'cotonou', label: 'Cotonou', country: 'Bénin' },
  { value: 'lome', label: 'Lomé', country: 'Togo' },
  { value: 'bamako', label: 'Bamako', country: 'Mali' },
  { value: 'ouagadougou', label: 'Ouagadougou', country: 'Burkina Faso' },
  { value: 'niamey', label: 'Niamey', country: 'Niger' },
  { value: 'conakry', label: 'Conakry', country: 'Guinée' },
];

// API Response types for partner endpoints
export interface PrecheckResponse {
  status: 'reliable' | 'evaluate' | 'risky';
  quick_score: number;
  sim_stability: 'low' | 'medium' | 'high';
  processing_time_ms: number;
  request_id: string;
}

export interface FraudShieldResponse {
  fraud_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  flags: Array<{
    code: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  anomalies_detected: number;
  identity_coherence: number;
  behavior_coherence: number;
  processing_time_ms: number;
  request_id: string;
}

export interface BusinessInsightsResponse {
  business_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  commercial_reliability: number;
  activity_stability: number;
  digital_presence: number;
  declaration_coherence: number;
  estimated_age_months: number;
  continuity_index: number;
  fraud_risk_index: number;
  grade: string;
  processing_time_ms: number;
  request_id: string;
}

export interface RBIResponse {
  rbi_score: number;
  risk_category: 'low' | 'medium' | 'high';
  regularity_factor: number;
  stability_factor: number;
  digital_behavior: number;
  continuity_factor: number;
  confidence: number;
  processing_time_ms: number;
  request_id: string;
}
