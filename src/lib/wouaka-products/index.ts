// ============================================
// WOUAKA PRODUCTS - MAIN EXPORTS
// W-KYC | W-SCORE | WOUAKA CORE
// ============================================

// Types
export * from './types';
export * from './w-score-certainty';

// W-KYC Engine
export {
  KYC_LEVEL_CONFIGS,
  UEMOA_DOCUMENT_TEMPLATES,
  FORGERY_CHECKS,
  KYC_RISK_FACTORS,
  calculateKycRiskScore,
  determineKycStatus,
} from './w-kyc-engine';

export type {
  KycRiskInput,
  KycRiskFactor,
  ForgeryCheck,
  DocumentTemplate,
} from './w-kyc-engine';

// W-SCORE Engine
export {
  FEATURE_DEFINITIONS,
  RISK_TIERS,
  FRAUD_RULES,
  calculateFeatures,
  calculateSubScores,
  runFraudAnalysis,
  calculateWScore,
} from './w-score-engine';

export type {
  ScoringInput,
  FraudRule,
} from './w-score-engine';

// WOUAKA CORE
export {
  PIPELINE_STEPS,
  calculateCombinedRisk,
  createProcessingContext,
  addTimelineEvent,
  addAuditLog,
  processKyc,
  processScoring,
  processWouakaCore,
  determineWebhookEvents,
} from './wouaka-core';

export type {
  ProcessingContext,
  WebhookEventType,
} from './wouaka-core';
