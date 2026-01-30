/**
 * Types et interfaces pour le SDK Wouaka
 */

// ============================================
// Configuration
// ============================================

export interface WouakaConfig {
  /** Clé API (format: wk_live_xxx ou wk_test_xxx) */
  apiKey: string;
  /** Environnement: 'production' | 'sandbox' */
  environment?: 'production' | 'sandbox';
  /** URL de base personnalisée (optionnel) */
  baseUrl?: string;
  /** Timeout en millisecondes (défaut: 30000) */
  timeout?: number;
  /** Nombre de tentatives en cas d'erreur (défaut: 3) */
  retries?: number;
}

// ============================================
// W-SCORE (Credit Scoring)
// ============================================

export interface ScoreRequest {
  /** Numéro de téléphone au format international */
  phone_number: string;
  /** Nom complet du client */
  full_name: string;
  /** Numéro d'identification national (optionnel) */
  national_id?: string;
  /** Code pays UEMOA: CI, SN, ML, BF, BJ, TG, NE, GW */
  country?: UEMOACountry;
  /** Référence externe pour traçabilité */
  external_reference?: string;
  /** Sources de données à consulter */
  data_sources?: DataSource[];
  /** Consentement du client */
  consent?: ConsentInfo;
}

export interface ScoreResponse {
  /** Identifiant unique de la requête */
  request_id: string;
  /** Score de crédit (300-850) */
  score: number;
  /** Catégorie de risque */
  risk_category: RiskCategory;
  /** Grade alphanumérique (A+ à E) */
  grade: ScoreGrade;
  /** Niveau de confiance (0-100) */
  confidence: number;
  /** Détails des facteurs de scoring */
  factors: ScoreFactor[];
  /** Sources de données utilisées */
  data_sources_used: DataSourceResult[];
  /** Recommandation crédit */
  recommendation: CreditRecommendation;
  /** Horodatage */
  created_at: string;
  /** Temps de traitement en ms */
  processing_time_ms: number;
}

export interface ScoreFactor {
  /** Nom du facteur */
  name: string;
  /** Impact sur le score (-100 à +100) */
  impact: number;
  /** Description lisible */
  description: string;
  /** Catégorie du facteur */
  category: 'telecom' | 'mobile_money' | 'identity' | 'behavior' | 'social';
}

export interface CreditRecommendation {
  /** Décision recommandée */
  decision: 'approve' | 'review' | 'decline';
  /** Montant maximum recommandé en XOF */
  max_amount?: number;
  /** Durée maximum recommandée en mois */
  max_duration_months?: number;
  /** Taux d'intérêt suggéré */
  suggested_rate?: number;
  /** Notes explicatives */
  notes: string[];
}

// ============================================
// W-KYC (Know Your Customer)
// ============================================

export interface KycRequest {
  /** Nom complet */
  full_name: string;
  /** Numéro de téléphone */
  phone_number?: string;
  /** Numéro d'identification national */
  national_id?: string;
  /** Date de naissance (YYYY-MM-DD) */
  date_of_birth?: string;
  /** Type de document d'identité */
  document_type?: DocumentType;
  /** Numéro du document */
  document_number?: string;
  /** Date d'expiration du document */
  document_expiry?: string;
  /** Adresse */
  address?: AddressInfo;
  /** Référence externe */
  external_reference?: string;
}

export interface KycResponse {
  /** Identifiant unique */
  request_id: string;
  /** Statut global */
  status: KycStatus;
  /** Vérifié ou non */
  verified: boolean;
  /** Score d'identité (0-100) */
  identity_score: number;
  /** Score de fraude (0-100, plus bas = moins de risque) */
  fraud_score: number;
  /** Niveau de risque */
  risk_level: RiskLevel;
  /** Résultats des vérifications individuelles */
  checks: KycCheck[];
  /** Drapeaux de risque identifiés */
  risk_flags: string[];
  /** Données vérifiées */
  verified_data: VerifiedData;
  /** Horodatage */
  created_at: string;
  /** Temps de traitement */
  processing_time_ms: number;
}

export interface KycCheck {
  /** Type de vérification */
  type: string;
  /** Nom lisible */
  name: string;
  /** Réussi ou non */
  passed: boolean;
  /** Niveau de confiance */
  confidence: number;
  /** Message détaillé */
  message: string;
  /** Données supplémentaires */
  metadata?: Record<string, unknown>;
}

export interface VerifiedData {
  full_name?: string;
  date_of_birth?: string;
  national_id?: string;
  phone_verified?: boolean;
  document_valid?: boolean;
  address_verified?: boolean;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country: string;
}

// ============================================
// Identity Verification
// ============================================

export interface IdentityRequest {
  /** Numéro de téléphone */
  phone_number?: string;
  /** Numéro d'identification */
  national_id?: string;
  /** Email */
  email?: string;
  /** Nom complet pour correspondance */
  full_name?: string;
}

export interface IdentityResponse {
  /** Identifiant unique */
  request_id: string;
  /** Identité trouvée */
  found: boolean;
  /** Données d'identité */
  identity?: IdentityData;
  /** Score de confiance */
  trust_score: number;
  /** Sources consultées */
  data_sources: string[];
  /** Horodatage */
  created_at: string;
}

export interface IdentityData {
  full_name: string;
  phone_number?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F';
  nationality?: string;
  address?: AddressInfo;
  photo_url?: string;
  id_verified: boolean;
  phone_verified: boolean;
}

// ============================================
// Precheck (Vérification rapide)
// ============================================

export interface PrecheckRequest {
  phone_number: string;
  full_name: string;
}

export interface PrecheckResponse {
  request_id: string;
  eligible: boolean;
  quick_score: number;
  sim_stability: 'stable' | 'recent' | 'new';
  risk_indicators: string[];
  recommendation: 'proceed' | 'verify' | 'decline';
  processing_time_ms: number;
}

// ============================================
// Webhooks
// ============================================

export interface WebhookConfig {
  /** URL de destination */
  url: string;
  /** Événements à recevoir */
  events: WebhookEvent[];
  /** Nom descriptif */
  name?: string;
  /** Headers personnalisés */
  headers?: Record<string, string>;
  /** Actif ou non */
  is_active?: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  name: string;
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status_code: number;
  response_body?: string;
  delivered_at: string;
  duration_ms: number;
}

export type WebhookEvent =
  | 'score.completed'
  | 'score.failed'
  | 'kyc.verified'
  | 'kyc.failed'
  | 'kyc.pending_review'
  | 'identity.found'
  | 'identity.not_found'
  | 'precheck.completed'
  | 'document.uploaded'
  | 'document.verified'
  | 'alert.fraud_detected'
  | 'alert.risk_change';

// ============================================
// Enums et types utilitaires
// ============================================

export type UEMOACountry = 'CI' | 'SN' | 'ML' | 'BF' | 'BJ' | 'TG' | 'NE' | 'GW';

export type DataSource = 
  | 'mobile_money'
  | 'telecom'
  | 'utility'
  | 'registry'
  | 'bank'
  | 'social';

export interface DataSourceResult {
  source: DataSource;
  provider: string;
  available: boolean;
  data_quality: 'high' | 'medium' | 'low';
  last_updated?: string;
}

export type RiskCategory = 
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ScoreGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'E';

export type KycStatus = 
  | 'verified'
  | 'pending'
  | 'failed'
  | 'requires_review'
  | 'expired';

export type DocumentType = 
  | 'national_id'
  | 'passport'
  | 'driver_license'
  | 'voter_card'
  | 'residence_permit';

export interface ConsentInfo {
  /** Consentement donné */
  given: boolean;
  /** Horodatage du consentement */
  timestamp: string;
  /** Adresse IP (optionnel) */
  ip_address?: string;
  /** Version des CGU acceptées */
  terms_version?: string;
}

// ============================================
// API Responses génériques
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  request_id: string;
  timestamp: string;
  processing_time_ms: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}
