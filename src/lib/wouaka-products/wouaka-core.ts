// ============================================
// WOUAKA CORE - UNIFIED KYC + SCORING ENGINE
// Version 1.0 - Sovereign Solution for UEMOA
// ============================================

import type {
  WouakaCoreRequest,
  WouakaCoreResult,
  KycResult,
  WScoreResult,
  KycLevel,
  AuditLog,
  ExtractedIdentity,
} from './types';

import {
  KYC_LEVEL_CONFIGS,
  calculateKycRiskScore,
  determineKycStatus,
  type KycRiskInput,
} from './w-kyc-engine';

import {
  calculateWScore,
  type ScoringInput,
} from './w-score-engine';

// ============================================
// ORCHESTRATION CONFIG
// ============================================

interface PipelineStep {
  id: string;
  name: string;
  required: boolean;
  timeout_ms: number;
  retry_count: number;
  fallback?: string;
}
const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'document_upload', name: 'Téléchargement documents', required: true, timeout_ms: 30000, retry_count: 2 },
  { id: 'ocr_extraction', name: 'Extraction OCR', required: true, timeout_ms: 60000, retry_count: 1 },
  { id: 'face_verification', name: 'Vérification faciale', required: true, timeout_ms: 30000, retry_count: 1 },
  { id: 'liveness_check', name: 'Détection vivacité', required: false, timeout_ms: 20000, retry_count: 2 },
  { id: 'document_verification', name: 'Vérification document', required: true, timeout_ms: 45000, retry_count: 1 },
  { id: 'kyc_risk_scoring', name: 'Scoring risque KYC', required: true, timeout_ms: 5000, retry_count: 0 },
  { id: 'financial_data_processing', name: 'Traitement données financières', required: false, timeout_ms: 60000, retry_count: 1 },
  { id: 'credit_scoring', name: 'Scoring crédit', required: false, timeout_ms: 10000, retry_count: 0 },
  { id: 'fraud_detection', name: 'Détection fraude', required: true, timeout_ms: 5000, retry_count: 0 },
  { id: 'final_decision', name: 'Décision finale', required: true, timeout_ms: 2000, retry_count: 0 },
];

// ============================================
// COMBINED RISK MODEL
// ============================================

interface CombinedRiskInput {
  kyc_risk_score: number;
  kyc_risk_level: 'low' | 'medium' | 'high' | 'critical';
  credit_score?: number;
  credit_grade?: string;
  fraud_score: number;
  fraud_risk_level: 'low' | 'medium' | 'high' | 'critical';
  data_quality: 'high' | 'medium' | 'low' | 'insufficient';
}

interface CombinedRiskOutput {
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  kyc_risk_weight: number;
  credit_risk_weight: number;
  fraud_risk_weight: number;
  final_recommendation: 'approve' | 'review' | 'reject';
  conditions: string[];
}

export function calculateCombinedRisk(input: CombinedRiskInput): CombinedRiskOutput {
  // Weight configuration
  const weights = {
    kyc: 0.35,
    credit: 0.40,
    fraud: 0.25,
  };
  
  // Convert risk levels to numeric scores
  const riskLevelToScore = (level: string): number => {
    switch (level) {
      case 'low': return 0;
      case 'medium': return 30;
      case 'high': return 60;
      case 'critical': return 100;
      default: return 50;
    }
  };
  
  // Calculate weighted risk
  const kycRisk = riskLevelToScore(input.kyc_risk_level);
  const creditRisk = input.credit_score ? 100 - input.credit_score : 50;
  const fraudRisk = input.fraud_score;
  
  const weightedRisk = 
    kycRisk * weights.kyc + 
    creditRisk * weights.credit + 
    fraudRisk * weights.fraud;
  
  // Determine overall risk level
  let overallRisk: CombinedRiskOutput['overall_risk'];
  if (weightedRisk < 25) overallRisk = 'low';
  else if (weightedRisk < 50) overallRisk = 'medium';
  else if (weightedRisk < 75) overallRisk = 'high';
  else overallRisk = 'critical';
  
  // Determine recommendation
  let recommendation: CombinedRiskOutput['final_recommendation'];
  const conditions: string[] = [];
  
  // Auto-reject conditions
  if (input.kyc_risk_level === 'critical' || input.fraud_risk_level === 'critical') {
    recommendation = 'reject';
    conditions.push('Risque critique détecté - rejet automatique');
  }
  // Auto-approve conditions
  else if (
    input.kyc_risk_level === 'low' && 
    input.fraud_risk_level === 'low' && 
    (input.credit_score || 0) >= 70 &&
    input.data_quality !== 'insufficient'
  ) {
    recommendation = 'approve';
    conditions.push('Profil satisfaisant - approbation recommandée');
  }
  // Review needed
  else {
    recommendation = 'review';
    
    if (input.kyc_risk_level === 'high') {
      conditions.push('Vérification KYC manuelle requise');
    }
    if (input.fraud_risk_level === 'high') {
      conditions.push('Alertes fraude à investiguer');
    }
    if ((input.credit_score || 0) < 55) {
      conditions.push('Score crédit faible - garanties requises');
    }
    if (input.data_quality === 'low' || input.data_quality === 'insufficient') {
      conditions.push('Données insuffisantes - documents complémentaires requis');
    }
  }
  
  return {
    overall_risk: overallRisk,
    kyc_risk_weight: weights.kyc,
    credit_risk_weight: weights.credit,
    fraud_risk_weight: weights.fraud,
    final_recommendation: recommendation,
    conditions,
  };
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

export interface ProcessingContext {
  request_id: string;
  start_time: Date;
  timeline: WouakaCoreResult['timeline'];
  audit_logs: AuditLog[];
}

export function createProcessingContext(): ProcessingContext {
  return {
    request_id: crypto.randomUUID(),
    start_time: new Date(),
    timeline: [],
    audit_logs: [],
  };
}

export function addTimelineEvent(
  ctx: ProcessingContext,
  event: string,
  status: 'completed' | 'failed' | 'skipped',
  duration_ms?: number
): void {
  ctx.timeline.push({
    event,
    timestamp: new Date().toISOString(),
    status,
    duration_ms,
  });
}

export function addAuditLog(
  ctx: ProcessingContext,
  action: string,
  resource_type: string,
  resource_id: string,
  details: Record<string, unknown>,
  actor_type: 'user' | 'system' | 'api' = 'system'
): void {
  ctx.audit_logs.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    actor_id: ctx.request_id,
    actor_type,
    resource_type,
    resource_id,
    details,
  });
}

// ============================================
// PROCESS FUNCTIONS
// ============================================

export async function processKyc(
  request: WouakaCoreRequest,
  ctx: ProcessingContext
): Promise<KycResult> {
  const startTime = Date.now();
  const levelConfig = KYC_LEVEL_CONFIGS[request.kyc_level];
  
  addAuditLog(ctx, 'kyc_started', 'kyc', ctx.request_id, { level: request.kyc_level });
  
  // Build KYC risk input from request
  const kycRiskInput: KycRiskInput = {
    identity: {
      full_name: request.declared_info.full_name,
      date_of_birth: request.declared_info.date_of_birth,
    },
    document_verification: null, // Would be populated by actual OCR/verification
    face_match: null, // Would be populated by face verification
    liveness: null, // Would be populated by liveness check
    address: null, // Would be populated by address verification
    device: request.device_info || null,
    geolocation: request.geolocation || null,
    declared_info: request.declared_info,
    behavioral_signals: undefined,
  };
  
  // Calculate KYC risk score
  const kycRiskScore = calculateKycRiskScore(kycRiskInput);
  
  // Determine status
  const statusResult = determineKycStatus(kycRiskScore, levelConfig);
  
  addTimelineEvent(ctx, 'kyc_processing', 'completed', Date.now() - startTime);
  addAuditLog(ctx, 'kyc_completed', 'kyc', ctx.request_id, { 
    status: statusResult.status, 
    risk_score: kycRiskScore.score 
  });
  
  return {
    kyc_id: crypto.randomUUID(),
    level: request.kyc_level,
    status: statusResult.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: statusResult.status === 'verified' ? new Date().toISOString() : undefined,
    identity_verification: null,
    face_verification: null,
    liveness_verification: null,
    address_verification: null,
    verified_identity: {
      full_name: request.declared_info.full_name,
      date_of_birth: request.declared_info.date_of_birth,
    } as ExtractedIdentity,
    risk_score: kycRiskScore,
    processing_time_ms: Date.now() - startTime,
    documents_submitted: request.documents.length,
    manual_review_required: statusResult.manual_review_required,
    rejection_reason: statusResult.rejection_reason,
    audit_trail: ctx.audit_logs.filter(l => l.resource_type === 'kyc'),
  };
}

export async function processScoring(
  request: WouakaCoreRequest,
  kycResult: KycResult,
  ctx: ProcessingContext
): Promise<WScoreResult | null> {
  const startTime = Date.now();
  
  // Only score if KYC passed or is in review
  if (kycResult.status === 'rejected') {
    addTimelineEvent(ctx, 'scoring_skipped', 'skipped');
    return null;
  }
  
  addAuditLog(ctx, 'scoring_started', 'score', ctx.request_id, {});
  
  // Build scoring input
  const scoringInput: ScoringInput = {
    kyc_data: {
      verified_identity: kycResult.verified_identity,
      kyc_risk_score: kycResult.risk_score.score,
      document_confidence: kycResult.identity_verification?.confidence || 70,
    },
    declared_info: {
      ...request.declared_info,
      sim_age_months: request.declared_info.phone_number ? 24 : 0, // Default assumption
    },
    financial_data: request.financial_data,
    social_capital: request.social_capital,
    psychometric_data: request.psychometric_data,
    environmental_data: request.environmental_data,
    device_info: request.device_info,
  };
  
  // Calculate score (async for confidence layer with guarantor bonus)
  const scoreResult = await calculateWScore(scoringInput);
  
  addTimelineEvent(ctx, 'scoring_completed', 'completed', Date.now() - startTime);
  addAuditLog(ctx, 'scoring_completed', 'score', ctx.request_id, {
    final_score: scoreResult.final_score,
    grade: scoreResult.grade,
    confidence_index: scoreResult.confidence_analysis?.confidence_index,
  });
  
  return scoreResult;
}

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

export async function processWouakaCore(
  request: WouakaCoreRequest
): Promise<WouakaCoreResult> {
  const ctx = createProcessingContext();
  const startTime = Date.now();
  
  addAuditLog(ctx, 'request_received', 'core', ctx.request_id, {
    reference_id: request.reference_id,
    kyc_level: request.kyc_level,
  });
  
  try {
    // Step 1: Process KYC
    addTimelineEvent(ctx, 'kyc_started', 'completed');
    const kycResult = await processKyc(request, ctx);
    
    // Step 2: Process Scoring (if KYC passes)
    const scoreResult = await processScoring(request, kycResult, ctx);
    
    // Step 3: Calculate combined risk
    const combinedRisk = calculateCombinedRisk({
      kyc_risk_score: kycResult.risk_score.score,
      kyc_risk_level: kycResult.risk_score.risk_level,
      credit_score: scoreResult?.final_score,
      credit_grade: scoreResult?.grade,
      fraud_score: scoreResult?.fraud_analysis.fraud_score || 0,
      fraud_risk_level: scoreResult?.fraud_analysis.risk_level || 'low',
      data_quality: scoreResult?.data_quality || 'medium',
    });
    
    addTimelineEvent(ctx, 'decision_made', 'completed');
    
    // Step 4: Determine final status
    let status: WouakaCoreResult['status'] = 'completed';
    if (combinedRisk.final_recommendation === 'reject') {
      status = 'rejected';
    } else if (combinedRisk.final_recommendation === 'review') {
      status = 'pending_review';
    }
    
    const processingTime = Date.now() - startTime;
    
    addAuditLog(ctx, 'request_completed', 'core', ctx.request_id, {
      status,
      processing_time_ms: processingTime,
      recommendation: combinedRisk.final_recommendation,
    });
    
    return {
      request_id: ctx.request_id,
      reference_id: request.reference_id,
      status,
      kyc: kycResult,
      score: scoreResult,
      combined_risk: combinedRisk,
      timeline: ctx.timeline,
      created_at: ctx.start_time.toISOString(),
      completed_at: new Date().toISOString(),
      processing_time_ms: processingTime,
      version: '1.0.0',
    };
    
  } catch (error) {
    addTimelineEvent(ctx, 'error', 'failed');
    addAuditLog(ctx, 'request_failed', 'core', ctx.request_id, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

// ============================================
// WEBHOOK EVENTS
// ============================================

export type WebhookEventType = 
  | 'kyc.started'
  | 'kyc.completed'
  | 'kyc.failed'
  | 'kyc.requires_review'
  | 'score.calculated'
  | 'score.updated'
  | 'decision.approved'
  | 'decision.rejected'
  | 'decision.pending_review'
  | 'fraud.alert'
  | 'document.uploaded'
  | 'document.verified'
  | 'document.rejected';

export function determineWebhookEvents(result: WouakaCoreResult): WebhookEventType[] {
  const events: WebhookEventType[] = [];
  
  // KYC events
  if (result.kyc.status === 'verified') {
    events.push('kyc.completed');
  } else if (result.kyc.status === 'rejected') {
    events.push('kyc.failed');
  } else if (result.kyc.status === 'requires_review') {
    events.push('kyc.requires_review');
  }
  
  // Score events
  if (result.score) {
    events.push('score.calculated');
  }
  
  // Decision events
  if (result.status === 'completed') {
    events.push('decision.approved');
  } else if (result.status === 'rejected') {
    events.push('decision.rejected');
  } else if (result.status === 'pending_review') {
    events.push('decision.pending_review');
  }
  
  // Fraud events
  if (result.score?.fraud_analysis && result.score.fraud_analysis.fraud_score > 30) {
    events.push('fraud.alert');
  }
  
  return events;
}

// ============================================
// EXPORTS
// ============================================

export {
  KYC_LEVEL_CONFIGS,
  PIPELINE_STEPS,
};
