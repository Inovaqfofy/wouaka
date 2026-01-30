/**
 * WOUAKA Model Version Management
 * Tracks model configurations, performance, and manages promotions
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { WeightAdjustmentResult } from './weight-adjuster';

export interface ModelVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  
  // Configuration
  featureWeights: Record<string, number>;
  subScoreWeights: Record<string, number>;
  fraudRules: FraudRule[];
  thresholds: Record<string, number>;
  
  // Performance metrics
  trainingSampleSize: number;
  validationSampleSize: number;
  validationAuc: number;
  validationGini: number;
  ksStatistic: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Comparison
  previousVersionId?: string;
  improvementVsPrevious: number;
  
  // Status
  status: 'draft' | 'testing' | 'active' | 'deprecated' | 'archived';
  isActive: boolean;
  promotedToProductionAt?: Date;
  promotedBy?: string;
  
  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudRule {
  rule: string;
  threshold: number;
  weight: number;
  description?: string;
}

export interface CreateModelVersionInput {
  name: string;
  description: string;
  featureWeights: Record<string, number>;
  subScoreWeights: Record<string, number>;
  fraudRules: FraudRule[];
  thresholds?: Record<string, number>;
  basedOnVersionId?: string;
}

export interface ModelPerformanceMetrics {
  auc: number;
  gini: number;
  ksStatistic: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

/**
 * Generate next version number
 */
function generateNextVersion(currentVersion: string): string {
  const parts = currentVersion.replace('v', '').split('.').map(Number);
  
  // Increment patch version
  parts[2] = (parts[2] || 0) + 1;
  
  // Handle overflow
  if (parts[2] >= 100) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  if (parts[1] >= 100) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  
  return `v${parts.join('.')}`;
}

/**
 * Get the currently active model version
 */
export async function getActiveModelVersion(): Promise<ModelVersion | null> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return mapToModelVersion(data);
}

/**
 * Get model version by ID
 */
export async function getModelVersion(id: string): Promise<ModelVersion | null> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return mapToModelVersion(data);
}

/**
 * List all model versions
 */
export async function listModelVersions(
  options: {
    status?: ModelVersion['status'];
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ versions: ModelVersion[]; total: number }> {
  let query = supabase
    .from('model_versions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    throw error;
  }
  
  return {
    versions: (data || []).map(mapToModelVersion),
    total: count || 0
  };
}

/**
 * Create a new model version
 */
export async function createModelVersion(
  input: CreateModelVersionInput,
  createdBy?: string
): Promise<ModelVersion> {
  // Get the latest version to generate next version number
  const { data: latestVersions } = await supabase
    .from('model_versions')
    .select('version')
    .order('created_at', { ascending: false })
    .limit(1);
  
  const latestVersion = latestVersions?.[0]?.version || 'v5.0.0';
  const newVersion = generateNextVersion(latestVersion);
  
  const { data, error } = await supabase
    .from('model_versions')
    .insert([{
      version: newVersion,
      name: input.name,
      description: input.description,
      feature_weights: input.featureWeights as Json,
      sub_score_weights: input.subScoreWeights as Json,
      fraud_rules: input.fraudRules as unknown as Json,
      thresholds: (input.thresholds || {}) as Json,
      previous_version_id: input.basedOnVersionId,
      status: 'draft',
      is_active: false,
      created_by: createdBy
    }])
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return mapToModelVersion(data);
}

/**
 * Create a new version from weight adjustment results
 */
export async function createVersionFromAdjustment(
  result: WeightAdjustmentResult,
  name: string,
  createdBy?: string
): Promise<ModelVersion> {
  // Get current active version
  const activeVersion = await getActiveModelVersion();
  
  return createModelVersion({
    name,
    description: `Auto-généré depuis analyse de ${result.sampleSize} outcomes. Amélioration estimée: ${result.overallImprovement.toFixed(1)}%`,
    featureWeights: result.recommendedWeights,
    subScoreWeights: activeVersion?.subScoreWeights || {
      financial_stability: 0.30,
      behavioral_reliability: 0.20,
      social_capital: 0.20,
      identity_verification: 0.15,
      fraud_risk: 0.15
    },
    fraudRules: activeVersion?.fraudRules || [],
    basedOnVersionId: activeVersion?.id
  }, createdBy);
}

/**
 * Update model performance metrics
 */
export async function updateModelPerformance(
  modelId: string,
  metrics: ModelPerformanceMetrics,
  sampleSize: number
): Promise<void> {
  const { error } = await supabase
    .from('model_versions')
    .update({
      validation_auc: metrics.auc,
      validation_gini: metrics.gini,
      ks_statistic: metrics.ksStatistic,
      accuracy: metrics.accuracy,
      precision_score: metrics.precision,
      recall_score: metrics.recall,
      f1_score: metrics.f1Score,
      validation_sample_size: sampleSize,
      updated_at: new Date().toISOString()
    })
    .eq('id', modelId);
  
  if (error) {
    throw error;
  }
}

/**
 * Promote a model version to testing
 */
export async function promoteToTesting(modelId: string): Promise<void> {
  const { error } = await supabase
    .from('model_versions')
    .update({
      status: 'testing',
      updated_at: new Date().toISOString()
    })
    .eq('id', modelId);
  
  if (error) {
    throw error;
  }
}

/**
 * Promote a model version to production
 */
export async function promoteToProduction(
  modelId: string,
  promotedBy: string
): Promise<void> {
  // First, deactivate all other versions
  await supabase
    .from('model_versions')
    .update({
      is_active: false,
      status: 'deprecated'
    })
    .eq('is_active', true);
  
  // Then, activate the new version
  const { error } = await supabase
    .from('model_versions')
    .update({
      status: 'active',
      is_active: true,
      promoted_to_production_at: new Date().toISOString(),
      promoted_by: promotedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', modelId);
  
  if (error) {
    throw error;
  }
}

/**
 * Compare two model versions
 */
export async function compareModelVersions(
  versionAId: string,
  versionBId: string
): Promise<{
  versionA: ModelVersion;
  versionB: ModelVersion;
  differences: {
    featureWeights: Record<string, { a: number; b: number; diff: number }>;
    subScoreWeights: Record<string, { a: number; b: number; diff: number }>;
    performanceComparison: {
      metric: string;
      a: number;
      b: number;
      improvement: number;
    }[];
  };
}> {
  const [versionA, versionB] = await Promise.all([
    getModelVersion(versionAId),
    getModelVersion(versionBId)
  ]);
  
  if (!versionA || !versionB) {
    throw new Error('One or both model versions not found');
  }
  
  // Compare feature weights
  const allFeatures = new Set([
    ...Object.keys(versionA.featureWeights),
    ...Object.keys(versionB.featureWeights)
  ]);
  
  const featureWeights: Record<string, { a: number; b: number; diff: number }> = {};
  for (const feature of allFeatures) {
    const a = versionA.featureWeights[feature] || 0;
    const b = versionB.featureWeights[feature] || 0;
    featureWeights[feature] = { a, b, diff: b - a };
  }
  
  // Compare sub-score weights
  const allSubScores = new Set([
    ...Object.keys(versionA.subScoreWeights),
    ...Object.keys(versionB.subScoreWeights)
  ]);
  
  const subScoreWeights: Record<string, { a: number; b: number; diff: number }> = {};
  for (const subScore of allSubScores) {
    const a = versionA.subScoreWeights[subScore] || 0;
    const b = versionB.subScoreWeights[subScore] || 0;
    subScoreWeights[subScore] = { a, b, diff: b - a };
  }
  
  // Compare performance
  const performanceComparison = [
    { metric: 'AUC', a: versionA.validationAuc, b: versionB.validationAuc },
    { metric: 'Gini', a: versionA.validationGini, b: versionB.validationGini },
    { metric: 'KS Statistic', a: versionA.ksStatistic, b: versionB.ksStatistic },
    { metric: 'Accuracy', a: versionA.accuracy, b: versionB.accuracy },
    { metric: 'Precision', a: versionA.precision, b: versionB.precision },
    { metric: 'Recall', a: versionA.recall, b: versionB.recall },
    { metric: 'F1 Score', a: versionA.f1Score, b: versionB.f1Score }
  ].map(m => ({
    ...m,
    improvement: m.a > 0 ? ((m.b - m.a) / m.a) * 100 : 0
  }));
  
  return {
    versionA,
    versionB,
    differences: {
      featureWeights,
      subScoreWeights,
      performanceComparison
    }
  };
}

/**
 * Archive a model version
 */
export async function archiveModelVersion(modelId: string): Promise<void> {
  const { error } = await supabase
    .from('model_versions')
    .update({
      status: 'archived',
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', modelId);
  
  if (error) {
    throw error;
  }
}

/**
 * Get model version history for a feature
 */
export async function getFeatureWeightHistory(
  featureId: string,
  limit: number = 20
): Promise<{ version: string; weight: number; date: Date }[]> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('version, feature_weights, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw error;
  }
  
  return (data || [])
    .filter(v => v.feature_weights && (v.feature_weights as Record<string, number>)[featureId] !== undefined)
    .map(v => ({
      version: v.version,
      weight: (v.feature_weights as Record<string, number>)[featureId],
      date: new Date(v.created_at)
    }));
}

// ============= HELPER FUNCTIONS =============

function mapToModelVersion(data: Record<string, unknown>): ModelVersion {
  return {
    id: data.id as string,
    version: data.version as string,
    name: (data.name as string) || '',
    description: (data.description as string) || '',
    featureWeights: (data.feature_weights as Record<string, number>) || {},
    subScoreWeights: (data.sub_score_weights as Record<string, number>) || {},
    fraudRules: (data.fraud_rules as FraudRule[]) || [],
    thresholds: (data.thresholds as Record<string, number>) || {},
    trainingSampleSize: (data.training_sample_size as number) || 0,
    validationSampleSize: (data.validation_sample_size as number) || 0,
    validationAuc: (data.validation_auc as number) || 0,
    validationGini: (data.validation_gini as number) || 0,
    ksStatistic: (data.ks_statistic as number) || 0,
    accuracy: (data.accuracy as number) || 0,
    precision: (data.precision_score as number) || 0,
    recall: (data.recall_score as number) || 0,
    f1Score: (data.f1_score as number) || 0,
    previousVersionId: data.previous_version_id as string | undefined,
    improvementVsPrevious: (data.improvement_vs_previous as number) || 0,
    status: (data.status as ModelVersion['status']) || 'draft',
    isActive: (data.is_active as boolean) || false,
    promotedToProductionAt: data.promoted_to_production_at 
      ? new Date(data.promoted_to_production_at as string) 
      : undefined,
    promotedBy: data.promoted_by as string | undefined,
    createdBy: data.created_by as string | undefined,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string)
  };
}
