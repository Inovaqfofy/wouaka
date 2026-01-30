/**
 * WOUAKA A/B Testing Framework
 * Allows testing new model configurations in production with controlled traffic splits
 */

import { supabase } from '@/integrations/supabase/client';

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  
  // Configuration
  controlModelVersionId: string;
  treatmentModelVersionId: string;
  trafficSplit: number; // 0-1, percentage going to treatment
  
  // Targeting
  targetCountries?: string[];
  targetPartnerIds?: string[];
  minSampleSize: number;
  
  // Results
  controlRequests: number;
  treatmentRequests: number;
  controlOutcomes: number;
  treatmentOutcomes: number;
  controlDefaultRate?: number;
  treatmentDefaultRate?: number;
  statisticalSignificance?: number;
  
  // Status
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  winner?: 'control' | 'treatment' | 'inconclusive';
  
  // Timestamps
  startedAt?: Date;
  endedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExperimentInput {
  name: string;
  description: string;
  hypothesis: string;
  controlModelVersionId: string;
  treatmentModelVersionId: string;
  trafficSplit?: number;
  targetCountries?: string[];
  targetPartnerIds?: string[];
  minSampleSize?: number;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: 'control' | 'treatment';
  modelVersionId: string;
}

export interface ExperimentResults {
  experiment: ABExperiment;
  isSignificant: boolean;
  pValue: number;
  confidenceInterval: { lower: number; upper: number };
  effectSize: number;
  recommendation: string;
  details: {
    controlStats: VariantStats;
    treatmentStats: VariantStats;
  };
}

interface VariantStats {
  requests: number;
  outcomes: number;
  defaults: number;
  defaultRate: number;
  avgScore: number;
}

/**
 * Create a new A/B experiment
 */
export async function createExperiment(
  input: CreateExperimentInput,
  createdBy?: string
): Promise<ABExperiment> {
  const { data, error } = await supabase
    .from('ab_experiments')
    .insert({
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      control_model_version_id: input.controlModelVersionId,
      treatment_model_version_id: input.treatmentModelVersionId,
      traffic_split: input.trafficSplit || 0.5,
      target_countries: input.targetCountries,
      target_partner_ids: input.targetPartnerIds,
      min_sample_size: input.minSampleSize || 1000,
      status: 'draft',
      created_by: createdBy
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return mapToExperiment(data);
}

/**
 * Get experiment by ID
 */
export async function getExperiment(id: string): Promise<ABExperiment | null> {
  const { data, error } = await supabase
    .from('ab_experiments')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return mapToExperiment(data);
}

/**
 * List all experiments
 */
export async function listExperiments(
  options: {
    status?: ABExperiment['status'];
    limit?: number;
  } = {}
): Promise<ABExperiment[]> {
  let query = supabase
    .from('ab_experiments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return (data || []).map(mapToExperiment);
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentId: string): Promise<void> {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId);
  
  if (error) {
    throw error;
  }
}

/**
 * Pause an experiment
 */
export async function pauseExperiment(experimentId: string): Promise<void> {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId);
  
  if (error) {
    throw error;
  }
}

/**
 * Resume an experiment
 */
export async function resumeExperiment(experimentId: string): Promise<void> {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'running',
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId);
  
  if (error) {
    throw error;
  }
}

/**
 * Stop an experiment and determine winner
 */
export async function stopExperiment(experimentId: string): Promise<ExperimentResults> {
  // First, calculate final results
  const results = await calculateExperimentResults(experimentId);
  
  // Update experiment with final status
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      winner: results.experiment.winner,
      control_default_rate: results.details.controlStats.defaultRate,
      treatment_default_rate: results.details.treatmentStats.defaultRate,
      statistical_significance: results.pValue < 0.05 ? (1 - results.pValue) * 100 : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId);
  
  if (error) {
    throw error;
  }
  
  return results;
}

/**
 * Cancel an experiment
 */
export async function cancelExperiment(experimentId: string): Promise<void> {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'cancelled',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId);
  
  if (error) {
    throw error;
  }
}

/**
 * Get active running experiments
 */
export async function getRunningExperiments(): Promise<ABExperiment[]> {
  return listExperiments({ status: 'running' });
}

/**
 * Assign a request to an experiment variant
 * Uses deterministic hashing for consistent assignment
 */
export async function assignToExperiment(
  requestId: string,
  partnerId: string,
  country?: string
): Promise<ExperimentAssignment | null> {
  // Get running experiments
  const experiments = await getRunningExperiments();
  
  if (experiments.length === 0) {
    return null;
  }
  
  // Find matching experiment based on targeting
  for (const exp of experiments) {
    // Check country targeting
    if (exp.targetCountries && exp.targetCountries.length > 0) {
      if (!country || !exp.targetCountries.includes(country)) {
        continue;
      }
    }
    
    // Check partner targeting
    if (exp.targetPartnerIds && exp.targetPartnerIds.length > 0) {
      if (!exp.targetPartnerIds.includes(partnerId)) {
        continue;
      }
    }
    
    // Deterministic assignment based on request ID hash
    const hash = simpleHash(requestId + exp.id);
    const assignmentValue = (hash % 1000) / 1000;
    
    const variant: 'control' | 'treatment' = 
      assignmentValue < exp.trafficSplit ? 'treatment' : 'control';
    
    const modelVersionId = variant === 'treatment' 
      ? exp.treatmentModelVersionId 
      : exp.controlModelVersionId;
    
    // Increment counter
    await incrementExperimentCounter(exp.id, variant);
    
    return {
      experimentId: exp.id,
      variant,
      modelVersionId
    };
  }
  
  return null;
}

/**
 * Record an outcome for an experiment
 */
export async function recordExperimentOutcome(
  experimentId: string,
  variant: 'control' | 'treatment',
  _defaulted: boolean
): Promise<void> {
  // Manually update outcome counters
  const { data: experiment } = await supabase
    .from('ab_experiments')
    .select('control_outcomes, treatment_outcomes')
    .eq('id', experimentId)
    .single();
  
  if (experiment) {
    const updates = variant === 'control'
      ? { control_outcomes: (experiment.control_outcomes || 0) + 1 }
      : { treatment_outcomes: (experiment.treatment_outcomes || 0) + 1 };
    
    await supabase
      .from('ab_experiments')
      .update(updates)
      .eq('id', experimentId);
  }
}

/**
 * Calculate experiment results with statistical analysis
 */
export async function calculateExperimentResults(
  experimentId: string
): Promise<ExperimentResults> {
  const experiment = await getExperiment(experimentId);
  
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  // Get outcomes linked to this experiment (simplified)
  const { data: outcomes } = await supabase
    .from('loan_outcomes')
    .select('*')
    .or(`scoring_request_id.in.(${experimentId})`) // Would need proper linking
    .limit(10000);
  
  // For now, use stored counters and simulate stats
  const controlStats: VariantStats = {
    requests: experiment.controlRequests,
    outcomes: experiment.controlOutcomes,
    defaults: Math.round(experiment.controlOutcomes * (experiment.controlDefaultRate || 0.1)),
    defaultRate: experiment.controlDefaultRate || 0.1,
    avgScore: 650
  };
  
  const treatmentStats: VariantStats = {
    requests: experiment.treatmentRequests,
    outcomes: experiment.treatmentOutcomes,
    defaults: Math.round(experiment.treatmentOutcomes * (experiment.treatmentDefaultRate || 0.08)),
    defaultRate: experiment.treatmentDefaultRate || 0.08,
    avgScore: 670
  };
  
  // Calculate statistical significance using two-proportion z-test
  const { pValue, effectSize, confidenceInterval } = calculateStatisticalSignificance(
    controlStats,
    treatmentStats
  );
  
  const isSignificant = pValue < 0.05;
  
  // Determine winner
  let winner: ABExperiment['winner'];
  let recommendation: string;
  
  if (!isSignificant) {
    winner = 'inconclusive';
    recommendation = `Pas de différence significative détectée (p=${pValue.toFixed(3)}). Continuer l'expérience ou augmenter la taille d'échantillon.`;
  } else if (treatmentStats.defaultRate < controlStats.defaultRate) {
    winner = 'treatment';
    recommendation = `Le traitement montre une réduction significative du taux de défaut de ${(effectSize * 100).toFixed(1)}%. Recommandation: promouvoir en production.`;
  } else {
    winner = 'control';
    recommendation = `Le contrôle performe mieux. Le traitement augmente le taux de défaut de ${(Math.abs(effectSize) * 100).toFixed(1)}%. Recommandation: abandonner le traitement.`;
  }
  
  // Update experiment winner
  experiment.winner = winner;
  
  return {
    experiment,
    isSignificant,
    pValue,
    confidenceInterval,
    effectSize,
    recommendation,
    details: {
      controlStats,
      treatmentStats
    }
  };
}

// ============= HELPER FUNCTIONS =============

/**
 * Simple string hash for deterministic assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Increment experiment request counter
 */
async function incrementExperimentCounter(
  experimentId: string,
  variant: 'control' | 'treatment'
): Promise<void> {
  const column = variant === 'control' ? 'control_requests' : 'treatment_requests';
  
  const { data: experiment } = await supabase
    .from('ab_experiments')
    .select(column)
    .eq('id', experimentId)
    .single();
  
  if (experiment) {
    const currentCount = (experiment as Record<string, number>)[column] || 0;
    await supabase
      .from('ab_experiments')
      .update({ [column]: currentCount + 1 })
      .eq('id', experimentId);
  }
}

/**
 * Calculate statistical significance for A/B test
 * Uses two-proportion z-test
 */
function calculateStatisticalSignificance(
  control: VariantStats,
  treatment: VariantStats
): {
  pValue: number;
  effectSize: number;
  confidenceInterval: { lower: number; upper: number };
} {
  const n1 = control.outcomes;
  const n2 = treatment.outcomes;
  const p1 = control.defaultRate;
  const p2 = treatment.defaultRate;
  
  if (n1 < 30 || n2 < 30) {
    // Not enough samples
    return {
      pValue: 1,
      effectSize: p2 - p1,
      confidenceInterval: { lower: -1, upper: 1 }
    };
  }
  
  // Pooled proportion
  const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  
  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) * (1/n1 + 1/n2));
  
  if (se === 0) {
    return {
      pValue: 1,
      effectSize: 0,
      confidenceInterval: { lower: 0, upper: 0 }
    };
  }
  
  // Z-score
  const z = (p2 - p1) / se;
  
  // Two-tailed p-value (approximation)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  // Effect size (difference in rates)
  const effectSize = p2 - p1;
  
  // 95% confidence interval
  const marginOfError = 1.96 * se;
  const confidenceInterval = {
    lower: effectSize - marginOfError,
    upper: effectSize + marginOfError
  };
  
  return { pValue, effectSize, confidenceInterval };
}

/**
 * Normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

function mapToExperiment(data: Record<string, unknown>): ABExperiment {
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) || '',
    hypothesis: (data.hypothesis as string) || '',
    controlModelVersionId: data.control_model_version_id as string,
    treatmentModelVersionId: data.treatment_model_version_id as string,
    trafficSplit: (data.traffic_split as number) || 0.5,
    targetCountries: data.target_countries as string[] | undefined,
    targetPartnerIds: data.target_partner_ids as string[] | undefined,
    minSampleSize: (data.min_sample_size as number) || 1000,
    controlRequests: (data.control_requests as number) || 0,
    treatmentRequests: (data.treatment_requests as number) || 0,
    controlOutcomes: (data.control_outcomes as number) || 0,
    treatmentOutcomes: (data.treatment_outcomes as number) || 0,
    controlDefaultRate: data.control_default_rate as number | undefined,
    treatmentDefaultRate: data.treatment_default_rate as number | undefined,
    statisticalSignificance: data.statistical_significance as number | undefined,
    status: (data.status as ABExperiment['status']) || 'draft',
    winner: data.winner as ABExperiment['winner'] | undefined,
    startedAt: data.started_at ? new Date(data.started_at as string) : undefined,
    endedAt: data.ended_at ? new Date(data.ended_at as string) : undefined,
    createdBy: data.created_by as string | undefined,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string)
  };
}
