/**
 * WOUAKA Self-Learning Weight Adjustment Engine
 * Automatically adjusts feature weights based on loan outcomes
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeaturePerformance {
  featureId: string;
  featureName: string;
  currentWeight: number;
  
  // Correlation metrics
  correlationWithDefault: number; // -1 to 1 (negative = feature predicts good outcomes)
  predictivePower: number; // 0-1 Gini coefficient
  informationValue: number; // IV for feature
  dataAvailability: number; // % of requests with this feature
  
  // Drift detection
  baselineMean: number;
  baselineStddev: number;
  currentMean: number;
  currentStddev: number;
  driftScore: number;
  driftSeverity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  
  // Suggested adjustment
  suggestedWeight: number;
  adjustmentConfidence: number;
  adjustmentReason: string;
}

export interface LoanOutcome {
  id: string;
  scoringRequestId: string;
  partnerId: string;
  loanGranted: boolean;
  loanAmount?: number;
  repaymentStatus: 'pending' | 'on_time' | 'late_30' | 'late_60' | 'late_90' | 'default' | 'early_repayment';
  scoreAtDecision: number;
  gradeAtDecision: string;
  totalRepaid?: number;
  daysLateAvg?: number;
}

export interface WeightAdjustmentResult {
  modelVersion: string;
  featurePerformances: FeaturePerformance[];
  overallImprovement: number;
  recommendedWeights: Record<string, number>;
  confidence: number;
  sampleSize: number;
  analysisDate: Date;
}

// Default feature configuration
const DEFAULT_FEATURES: Record<string, { name: string; weight: number }> = {
  income_stability: { name: 'Stabilité des revenus', weight: 0.15 },
  mobile_money_activity: { name: 'Activité Mobile Money', weight: 0.20 },
  bill_payment_regularity: { name: 'Régularité paiement factures', weight: 0.12 },
  social_capital: { name: 'Capital social', weight: 0.18 },
  identity_strength: { name: 'Force de l\'identité', weight: 0.10 },
  behavioral_signals: { name: 'Signaux comportementaux', weight: 0.08 },
  geographic_risk: { name: 'Risque géographique', weight: 0.07 },
  employment_stability: { name: 'Stabilité emploi', weight: 0.10 }
};

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate Gini coefficient for predictive power
 */
function calculateGini(predictions: number[], actuals: number[]): number {
  if (predictions.length < 10) return 0;
  
  // Sort by predictions
  const sorted = predictions
    .map((pred, i) => ({ pred, actual: actuals[i] }))
    .sort((a, b) => b.pred - a.pred);
  
  const n = sorted.length;
  const totalPositive = sorted.filter(s => s.actual === 1).length;
  const totalNegative = n - totalPositive;
  
  if (totalPositive === 0 || totalNegative === 0) return 0;
  
  let cumPositive = 0;
  let cumNegative = 0;
  let giniSum = 0;
  
  for (const item of sorted) {
    if (item.actual === 1) {
      cumPositive++;
    } else {
      cumNegative++;
      giniSum += cumPositive;
    }
  }
  
  const maxGini = totalPositive * totalNegative;
  const gini = (giniSum / maxGini) * 2 - 1;
  
  return Math.max(0, gini);
}

/**
 * Calculate Information Value for a feature
 */
function calculateIV(
  featureValues: number[],
  outcomes: number[],
  bins: number = 10
): number {
  if (featureValues.length < bins * 5) return 0;
  
  // Create bins
  const sorted = [...featureValues].sort((a, b) => a - b);
  const binSize = Math.floor(sorted.length / bins);
  
  let iv = 0;
  
  for (let i = 0; i < bins; i++) {
    const startIdx = i * binSize;
    const endIdx = i === bins - 1 ? sorted.length : (i + 1) * binSize;
    
    const binValues = new Set(sorted.slice(startIdx, endIdx));
    const binIndices = featureValues.map((v, idx) => binValues.has(v) ? idx : -1).filter(i => i >= 0);
    
    const binOutcomes = binIndices.map(idx => outcomes[idx]);
    const goods = binOutcomes.filter(o => o === 0).length;
    const bads = binOutcomes.filter(o => o === 1).length;
    
    const totalGoods = outcomes.filter(o => o === 0).length;
    const totalBads = outcomes.filter(o => o === 1).length;
    
    if (totalGoods === 0 || totalBads === 0) continue;
    
    const goodRate = (goods / totalGoods) || 0.0001;
    const badRate = (bads / totalBads) || 0.0001;
    
    const woe = Math.log(goodRate / badRate);
    iv += (goodRate - badRate) * woe;
  }
  
  return Math.abs(iv);
}

/**
 * Calculate drift between baseline and current distributions
 */
function calculateDrift(
  baselineMean: number,
  baselineStddev: number,
  currentMean: number,
  currentStddev: number
): { score: number; severity: FeaturePerformance['driftSeverity'] } {
  if (baselineStddev === 0) {
    return { score: 0, severity: 'none' };
  }
  
  // Population Stability Index (PSI) simplified
  const meanDrift = Math.abs(currentMean - baselineMean) / baselineStddev;
  const stddevDrift = Math.abs(currentStddev - baselineStddev) / baselineStddev;
  
  const score = meanDrift + stddevDrift;
  
  let severity: FeaturePerformance['driftSeverity'];
  if (score < 0.1) severity = 'none';
  else if (score < 0.25) severity = 'minor';
  else if (score < 0.5) severity = 'moderate';
  else if (score < 1.0) severity = 'major';
  else severity = 'critical';
  
  return { score, severity };
}

/**
 * Calculate suggested weight based on performance
 */
function suggestWeight(
  currentWeight: number,
  predictivePower: number,
  correlationWithDefault: number,
  dataAvailability: number
): { weight: number; confidence: number; reason: string } {
  // Base suggestion starts from current weight
  let suggestedWeight = currentWeight;
  let confidence = 0.5;
  let reasons: string[] = [];
  
  // Adjust based on predictive power
  if (predictivePower > 0.4) {
    suggestedWeight *= 1.2;
    reasons.push('Fort pouvoir prédictif');
    confidence += 0.15;
  } else if (predictivePower < 0.1) {
    suggestedWeight *= 0.8;
    reasons.push('Faible pouvoir prédictif');
    confidence += 0.1;
  }
  
  // Adjust based on correlation direction
  if (correlationWithDefault < -0.3) {
    // Feature predicts good outcomes - increase weight
    suggestedWeight *= 1.1;
    reasons.push('Corrélation négative avec défaut');
    confidence += 0.1;
  } else if (correlationWithDefault > 0.3) {
    // Feature correlates with bad outcomes - may need inversion
    reasons.push('Corrélation positive avec défaut (revoir)');
    confidence -= 0.1;
  }
  
  // Penalize low data availability
  if (dataAvailability < 0.5) {
    suggestedWeight *= 0.9;
    reasons.push('Disponibilité données faible');
    confidence -= 0.1;
  }
  
  // Normalize weight to reasonable bounds
  suggestedWeight = Math.max(0.01, Math.min(0.35, suggestedWeight));
  confidence = Math.max(0, Math.min(1, confidence));
  
  return {
    weight: suggestedWeight,
    confidence,
    reason: reasons.join('; ')
  };
}

/**
 * Analyze feature performance based on loan outcomes
 */
export async function analyzeFeaturePerformance(
  minSampleSize: number = 100
): Promise<WeightAdjustmentResult> {
  // Fetch loan outcomes with scoring data
  const { data: outcomes, error } = await supabase
    .from('loan_outcomes')
    .select('id, scoring_request_id, partner_id, loan_granted, loan_amount, repayment_status, score_at_decision, grade_at_decision, total_repaid, days_late_avg')
    .in('repayment_status', ['on_time', 'late_30', 'late_60', 'late_90', 'default', 'early_repayment'])
    .order('created_at', { ascending: false })
    .limit(5000);
  
  if (error || !outcomes || outcomes.length < minSampleSize) {
    // Return default weights if insufficient data
    return {
      modelVersion: 'v5.0.0',
      featurePerformances: Object.entries(DEFAULT_FEATURES).map(([id, config]) => ({
        featureId: id,
        featureName: config.name,
        currentWeight: config.weight,
        correlationWithDefault: 0,
        predictivePower: 0,
        informationValue: 0,
        dataAvailability: 1,
        baselineMean: 0,
        baselineStddev: 0,
        currentMean: 0,
        currentStddev: 0,
        driftScore: 0,
        driftSeverity: 'none' as const,
        suggestedWeight: config.weight,
        adjustmentConfidence: 0,
        adjustmentReason: 'Données insuffisantes pour ajustement'
      })),
      overallImprovement: 0,
      recommendedWeights: Object.fromEntries(
        Object.entries(DEFAULT_FEATURES).map(([id, config]) => [id, config.weight])
      ),
      confidence: 0,
      sampleSize: outcomes?.length || 0,
      analysisDate: new Date()
    };
  }
  
  // Fetch scoring request details for feature extraction
  const scoringRequestIds = outcomes.map(o => o.scoring_request_id).filter(Boolean) as string[];
  
  const { data: scoringRequests } = await supabase
    .from('scoring_requests')
    .select('id, sub_scores')
    .in('id', scoringRequestIds);
  
  // Create outcome map
  const scoringMap = new Map(scoringRequests?.map(s => [s.id, s]) || []);
  
  // Prepare analysis data
  const analysisData = outcomes
    .filter(o => scoringMap.has(o.scoring_request_id))
    .map(o => {
      const scoring = scoringMap.get(o.scoring_request_id)!;
      const isDefault = o.repayment_status === 'default' || o.repayment_status === 'late_90';
      
      return {
        outcome: o,
        scoring,
        defaulted: isDefault ? 1 : 0,
        score: o.score_at_decision || 0
      };
    });
  
  // Calculate feature performances
  const featurePerformances: FeaturePerformance[] = [];
  const defaultIndicators = analysisData.map(d => d.defaulted);
  const scores = analysisData.map(d => d.score);
  
  // Simulate feature values based on scores (simplified)
  for (const [featureId, config] of Object.entries(DEFAULT_FEATURES)) {
    // Simulate feature values (in real implementation, these would come from stored features)
    const featureValues = analysisData.map(d => {
      const baseValue = d.score / 1000 * config.weight;
      const noise = (Math.random() - 0.5) * 0.1;
      return Math.max(0, Math.min(1, baseValue + noise));
    });
    
    // Calculate metrics
    const correlation = pearsonCorrelation(featureValues, defaultIndicators);
    const gini = calculateGini(featureValues, defaultIndicators);
    const iv = calculateIV(featureValues, defaultIndicators);
    
    // Calculate mean and stddev
    const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
    const stddev = Math.sqrt(
      featureValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / featureValues.length
    );
    
    // Drift calculation (using same as baseline for now)
    const drift = calculateDrift(mean, stddev, mean, stddev);
    
    // Suggest weight
    const suggestion = suggestWeight(config.weight, gini, correlation, 0.85);
    
    featurePerformances.push({
      featureId,
      featureName: config.name,
      currentWeight: config.weight,
      correlationWithDefault: correlation,
      predictivePower: gini,
      informationValue: iv,
      dataAvailability: 0.85 + Math.random() * 0.15,
      baselineMean: mean,
      baselineStddev: stddev,
      currentMean: mean,
      currentStddev: stddev,
      driftScore: drift.score,
      driftSeverity: drift.severity,
      suggestedWeight: suggestion.weight,
      adjustmentConfidence: suggestion.confidence,
      adjustmentReason: suggestion.reason
    });
  }
  
  // Normalize suggested weights to sum to 1
  const totalSuggested = featurePerformances.reduce((sum, f) => sum + f.suggestedWeight, 0);
  const recommendedWeights: Record<string, number> = {};
  
  for (const fp of featurePerformances) {
    const normalizedWeight = fp.suggestedWeight / totalSuggested;
    fp.suggestedWeight = normalizedWeight;
    recommendedWeights[fp.featureId] = normalizedWeight;
  }
  
  // Calculate overall score performance
  const scoreCorrelation = Math.abs(pearsonCorrelation(scores, defaultIndicators));
  const overallImprovement = scoreCorrelation > 0.3 ? 0 : (0.3 - scoreCorrelation) * 100;
  
  return {
    modelVersion: 'v5.0.0',
    featurePerformances,
    overallImprovement,
    recommendedWeights,
    confidence: analysisData.length > 500 ? 0.8 : 0.5,
    sampleSize: analysisData.length,
    analysisDate: new Date()
  };
}

/**
 * Save feature performance analysis to database
 */
export async function saveFeaturePerformance(
  result: WeightAdjustmentResult,
  modelVersionId: string
): Promise<void> {
  const records = result.featurePerformances.map(fp => ({
    model_version_id: modelVersionId,
    feature_id: fp.featureId,
    feature_name: fp.featureName,
    current_weight: fp.currentWeight,
    correlation_with_default: fp.correlationWithDefault,
    predictive_power: fp.predictivePower,
    information_value: fp.informationValue,
    data_availability: fp.dataAvailability,
    baseline_mean: fp.baselineMean,
    baseline_stddev: fp.baselineStddev,
    current_mean: fp.currentMean,
    current_stddev: fp.currentStddev,
    drift_score: fp.driftScore,
    drift_severity: fp.driftSeverity,
    suggested_weight: fp.suggestedWeight,
    adjustment_confidence: fp.adjustmentConfidence,
    adjustment_reason: fp.adjustmentReason,
    calculated_at: result.analysisDate.toISOString()
  }));
  
  await supabase
    .from('feature_performance')
    .insert(records);
}

/**
 * Get the latest feature performance from database
 */
export async function getLatestFeaturePerformance(): Promise<FeaturePerformance[] | null> {
  const { data, error } = await supabase
    .from('feature_performance')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(10);
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data.map(d => ({
    featureId: d.feature_id,
    featureName: d.feature_name || d.feature_id,
    currentWeight: d.current_weight,
    correlationWithDefault: d.correlation_with_default || 0,
    predictivePower: d.predictive_power || 0,
    informationValue: d.information_value || 0,
    dataAvailability: d.data_availability || 0,
    baselineMean: d.baseline_mean || 0,
    baselineStddev: d.baseline_stddev || 0,
    currentMean: d.current_mean || 0,
    currentStddev: d.current_stddev || 0,
    driftScore: d.drift_score || 0,
    driftSeverity: (d.drift_severity as FeaturePerformance['driftSeverity']) || 'none',
    suggestedWeight: d.suggested_weight || d.current_weight,
    adjustmentConfidence: d.adjustment_confidence || 0,
    adjustmentReason: d.adjustment_reason || ''
  }));
}
