// ============================================
// SOVEREIGN SCORING ENGINE v5.2
// Multi-Layer Explainable Credit Scoring
// ============================================

export interface SubScore {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number;
  features_used: string[];
  confidence: number;
  explanation: string;
}

export interface RiskTier {
  tier: string;
  grade: string;
  score_min: number;
  score_max: number;
  color: string;
  description: string;
  recommendations: string[];
  max_loan_multiplier: number;
  max_tenor_months: number;
  interest_adjustment: number;
}

export interface ScoringOutput {
  // Main score
  final_score: number;
  grade: string;
  risk_tier: RiskTier;
  confidence: number;
  
  // Sub-scores (6 layers)
  sub_scores: {
    identity_stability: SubScore;
    cashflow_consistency: SubScore;
    behavioral_psychometric: SubScore;
    financial_discipline: SubScore;
    social_capital: SubScore;
    environmental_adjustment: SubScore;
  };
  
  // Credit recommendations
  credit_recommendation: {
    approved: boolean;
    max_amount: number;
    max_tenor_months: number;
    suggested_rate_adjustment: number;
    conditions: string[];
  };
  
  // Explainability
  explanations: {
    positive_factors: string[];
    negative_factors: string[];
    improvement_suggestions: string[];
    data_quality_notes: string[];
  };
  
  // Metadata
  processing_time_ms: number;
  model_version: string;
  data_sources_used: string[];
  features_computed: number;
}

// ============================================
// RISK TIERS (UEMOA Calibrated)
// ============================================

export const RISK_TIERS: RiskTier[] = [
  {
    tier: 'prime',
    grade: 'A+',
    score_min: 85,
    score_max: 100,
    color: 'emerald',
    description: 'Profil excellent - Risque minimal',
    recommendations: [
      'Accorder le crédit demandé',
      'Proposer des conditions préférentielles',
      'Envisager fidélisation',
    ],
    max_loan_multiplier: 5,
    max_tenor_months: 36,
    interest_adjustment: -2,
  },
  {
    tier: 'near_prime',
    grade: 'A',
    score_min: 70,
    score_max: 84,
    color: 'green',
    description: 'Bon profil - Risque faible',
    recommendations: [
      'Accorder le crédit avec conditions standard',
      'Suivi régulier recommandé',
    ],
    max_loan_multiplier: 4,
    max_tenor_months: 24,
    interest_adjustment: 0,
  },
  {
    tier: 'standard',
    grade: 'B',
    score_min: 55,
    score_max: 69,
    color: 'yellow',
    description: 'Profil moyen - Risque modéré',
    recommendations: [
      'Accorder avec garanties supplémentaires',
      'Réduire le montant ou la durée',
      'Suivi renforcé nécessaire',
    ],
    max_loan_multiplier: 3,
    max_tenor_months: 18,
    interest_adjustment: 2,
  },
  {
    tier: 'subprime',
    grade: 'C',
    score_min: 40,
    score_max: 54,
    color: 'orange',
    description: 'Profil à risque - Attention requise',
    recommendations: [
      'Évaluation approfondie nécessaire',
      'Garanties solides obligatoires',
      'Montant et durée réduits',
    ],
    max_loan_multiplier: 2,
    max_tenor_months: 12,
    interest_adjustment: 5,
  },
  {
    tier: 'high_risk',
    grade: 'D',
    score_min: 25,
    score_max: 39,
    color: 'red',
    description: 'Risque élevé - Recommandation négative',
    recommendations: [
      'Refus recommandé sauf exception',
      'Si accordé: montant minimal, garanties maximales',
      'Suivi hebdomadaire',
    ],
    max_loan_multiplier: 1,
    max_tenor_months: 6,
    interest_adjustment: 10,
  },
  {
    tier: 'decline',
    grade: 'E',
    score_min: 0,
    score_max: 24,
    color: 'gray',
    description: 'Profil non éligible',
    recommendations: [
      'Refuser le crédit',
      'Orienter vers formation financière',
      'Réexaminer dans 6 mois',
    ],
    max_loan_multiplier: 0,
    max_tenor_months: 0,
    interest_adjustment: 0,
  },
];

// ============================================
// SUB-SCORE DEFINITIONS
// ============================================

export interface SubScoreDefinition {
  id: string;
  name: string;
  weight: number;
  feature_ids: string[];
  calculation: string;
}

export const SUB_SCORE_DEFINITIONS: SubScoreDefinition[] = [
  {
    id: 'identity_stability',
    name: 'Identité & Stabilité',
    weight: 0.20,
    feature_ids: [
      'document_verification_score',
      'sim_age_score',
      'address_stability_score',
      'business_formalization_score',
    ],
    calculation: 'weighted_average(features) * verification_bonus',
  },
  {
    id: 'cashflow_consistency',
    name: 'Cohérence Flux de Trésorerie',
    weight: 0.25,
    feature_ids: [
      'income_stability_index',
      'expense_to_income_ratio',
      'momo_velocity_7d',
      'momo_in_out_ratio',
      'cashflow_regularity',
    ],
    calculation: 'weighted_average(features) * data_quality_factor',
  },
  {
    id: 'behavioral_psychometric',
    name: 'Comportement & Psychométrie',
    weight: 0.15,
    feature_ids: [
      'digital_engagement_score',
      'financial_literacy_score',
      'response_consistency_score',
      'planning_horizon_score',
    ],
    calculation: 'weighted_average(features)',
  },
  {
    id: 'financial_discipline',
    name: 'Discipline Financière',
    weight: 0.20,
    feature_ids: [
      'utility_payment_discipline',
      'rent_payment_consistency',
      'tontine_discipline',
      'cooperative_loan_history',
      'savings_rate',
    ],
    calculation: 'weighted_average(features) * history_length_bonus',
  },
  {
    id: 'social_capital',
    name: 'Capital Social',
    weight: 0.12,
    feature_ids: [
      'tontine_network_score',
      'cooperative_standing_score',
      'guarantor_quality_score',
      'community_standing_score',
    ],
    calculation: 'weighted_average(features)',
  },
  {
    id: 'environmental_adjustment',
    name: 'Ajustement Environnemental',
    weight: 0.08,
    feature_ids: [
      'economic_zone_factor',
      'infrastructure_access_score',
      'seasonal_adjustment_factor',
    ],
    calculation: 'weighted_average(features)',
  },
];

// ============================================
// SCORING CALCULATOR
// ============================================

export function calculateSubScore(
  features: Record<string, number>,
  definition: SubScoreDefinition,
  confidences: Record<string, number>
): SubScore {
  let weightedSum = 0;
  let totalWeight = 0;
  let totalConfidence = 0;
  const usedFeatures: string[] = [];
  
  for (const featureId of definition.feature_ids) {
    const value = features[featureId];
    if (value !== undefined && value !== null) {
      const confidence = confidences[featureId] || 50;
      const weight = confidence / 100;
      
      weightedSum += value * 100 * weight;
      totalWeight += weight;
      totalConfidence += confidence;
      usedFeatures.push(featureId);
    }
  }
  
  const score = totalWeight > 0 ? weightedSum / totalWeight : 50;
  const avgConfidence = usedFeatures.length > 0 
    ? totalConfidence / usedFeatures.length 
    : 30;
  
  return {
    id: definition.id,
    name: definition.name,
    score: Math.round(Math.max(0, Math.min(100, score))),
    weight: definition.weight,
    features_used: usedFeatures,
    confidence: Math.round(avgConfidence),
    explanation: generateSubScoreExplanation(definition.id, score, usedFeatures.length),
  };
}

function generateSubScoreExplanation(id: string, score: number, featureCount: number): string {
  const level = score >= 70 ? 'bon' : score >= 50 ? 'moyen' : 'faible';
  const dataQuality = featureCount >= 3 ? 'solide' : featureCount >= 2 ? 'modérée' : 'limitée';
  
  const explanations: Record<string, string> = {
    identity_stability: `Niveau de stabilité identitaire ${level}. Base de données ${dataQuality}.`,
    cashflow_consistency: `Cohérence des flux de trésorerie ${level}. Analyse basée sur ${featureCount} indicateurs.`,
    behavioral_psychometric: `Profil comportemental ${level}. Évaluation ${dataQuality}.`,
    financial_discipline: `Discipline de paiement ${level}. Historique ${dataQuality}.`,
    social_capital: `Capital social ${level}. Réseau vérifié ${dataQuality}.`,
    environmental_adjustment: `Contexte économique ${level}. Données régionales ${dataQuality}.`,
  };
  
  return explanations[id] || `Score ${level} basé sur ${featureCount} facteurs.`;
}

export function calculateFinalScore(subScores: SubScore[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const subScore of subScores) {
    const adjustedWeight = subScore.weight * (subScore.confidence / 100);
    weightedSum += subScore.score * adjustedWeight;
    totalWeight += adjustedWeight;
  }
  
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}

export function getRiskTierByScore(score: number): RiskTier {
  return RISK_TIERS.find(t => score >= t.score_min && score <= t.score_max) || RISK_TIERS[RISK_TIERS.length - 1];
}

export function calculateCreditRecommendation(
  score: number,
  monthlyIncome: number,
  riskTier: RiskTier,
  fraudPenalty: number
): {
  approved: boolean;
  max_amount: number;
  max_tenor_months: number;
  suggested_rate_adjustment: number;
  conditions: string[];
} {
  const approved = score >= 25 && fraudPenalty < 40;
  const maxAmount = approved ? monthlyIncome * riskTier.max_loan_multiplier : 0;
  const conditions: string[] = [];
  
  if (fraudPenalty > 0) {
    conditions.push(`Alertes fraude détectées (-${fraudPenalty} pts)`);
  }
  if (score < 55) {
    conditions.push('Garanties supplémentaires requises');
  }
  if (score < 40) {
    conditions.push('Co-signature obligatoire');
  }
  if (riskTier.tier === 'standard') {
    conditions.push('Suivi mensuel recommandé');
  }
  if (riskTier.tier === 'subprime') {
    conditions.push('Suivi hebdomadaire obligatoire');
  }
  
  return {
    approved,
    max_amount: Math.round(maxAmount),
    max_tenor_months: riskTier.max_tenor_months,
    suggested_rate_adjustment: riskTier.interest_adjustment,
    conditions,
  };
}

export function generateExplanations(
  features: Record<string, number>,
  subScores: SubScore[],
  score: number
): {
  positive_factors: string[];
  negative_factors: string[];
  improvement_suggestions: string[];
  data_quality_notes: string[];
} {
  const positive: string[] = [];
  const negative: string[] = [];
  const improvements: string[] = [];
  const dataQuality: string[] = [];
  
  // Analyze features
  for (const [featureId, value] of Object.entries(features)) {
    if (value >= 0.7) {
      positive.push(getFeaturePositiveExplanation(featureId, value));
    } else if (value < 0.4) {
      negative.push(getFeatureNegativeExplanation(featureId, value));
      improvements.push(getImprovementSuggestion(featureId));
    }
  }
  
  // Analyze sub-scores
  for (const subScore of subScores) {
    if (subScore.confidence < 50) {
      dataQuality.push(`${subScore.name}: confiance limitée (${subScore.confidence}%) - données insuffisantes`);
    }
    if (subScore.features_used.length < 2) {
      dataQuality.push(`${subScore.name}: basé sur ${subScore.features_used.length} seul(s) indicateur(s)`);
    }
  }
  
  // Add general recommendations
  if (score < 55) {
    improvements.push('Fournir des preuves de revenus supplémentaires (relevés bancaires, factures)');
  }
  if (!features['business_formalization_score'] || features['business_formalization_score'] < 0.5) {
    improvements.push('Formaliser l\'activité (RCCM) pour améliorer le score');
  }
  
  return {
    positive_factors: positive.slice(0, 5),
    negative_factors: negative.slice(0, 5),
    improvement_suggestions: improvements.slice(0, 4),
    data_quality_notes: dataQuality.slice(0, 3),
  };
}

function getFeaturePositiveExplanation(featureId: string, value: number): string {
  const explanations: Record<string, string> = {
    income_stability_index: 'Revenus stables et réguliers',
    utility_payment_discipline: 'Excellent historique de paiement des factures',
    sim_age_score: 'Numéro de téléphone stable (confiance élevée)',
    tontine_discipline: 'Parfait historique de cotisation tontine',
    business_formalization_score: 'Entreprise formalisée et active',
    cooperative_loan_history: 'Historique de remboursement impeccable',
    savings_rate: 'Bonne capacité d\'épargne',
  };
  return explanations[featureId] || `${featureId}: valeur positive (${Math.round(value * 100)}%)`;
}

function getFeatureNegativeExplanation(featureId: string, value: number): string {
  const explanations: Record<string, string> = {
    income_stability_index: 'Revenus irréguliers ou volatils',
    expense_to_income_ratio: 'Dépenses trop élevées par rapport aux revenus',
    sim_age_score: 'Numéro de téléphone récent (confiance limitée)',
    debt_to_income_ratio: 'Niveau d\'endettement préoccupant',
    utility_payment_discipline: 'Retards fréquents de paiement',
    savings_rate: 'Pas d\'épargne ou épargne négative',
  };
  return explanations[featureId] || `${featureId}: valeur faible (${Math.round(value * 100)}%)`;
}

function getImprovementSuggestion(featureId: string): string {
  const suggestions: Record<string, string> = {
    income_stability_index: 'Diversifier les sources de revenus ou fournir un historique plus long',
    expense_to_income_ratio: 'Réduire les dépenses non essentielles',
    sim_age_score: 'Conserver le même numéro de téléphone',
    debt_to_income_ratio: 'Rembourser les dettes existantes avant nouvelle demande',
    utility_payment_discipline: 'Payer les factures avant la date limite',
    savings_rate: 'Épargner régulièrement, même de petits montants',
    business_formalization_score: 'Obtenir un numéro RCCM ou patente',
    document_verification_score: 'Fournir une pièce d\'identité valide et lisible',
  };
  return suggestions[featureId] || `Améliorer l'indicateur ${featureId}`;
}

// ============================================
// EDGE CASE HANDLING
// ============================================

export type DataQuality = 'high' | 'medium' | 'low' | 'insufficient';

export function assessDataQuality(
  featuresComputed: number,
  totalFeatures: number,
  avgConfidence: number
): DataQuality {
  const coverage = featuresComputed / totalFeatures;
  
  if (coverage >= 0.7 && avgConfidence >= 70) return 'high';
  if (coverage >= 0.5 && avgConfidence >= 50) return 'medium';
  if (coverage >= 0.3 || avgConfidence >= 40) return 'low';
  return 'insufficient';
}

export function handleLowDataScenario(
  dataQuality: DataQuality,
  baseScore: number
): { adjustedScore: number; penalty: number; message: string } {
  switch (dataQuality) {
    case 'high':
      return { adjustedScore: baseScore, penalty: 0, message: 'Données suffisantes pour évaluation fiable' };
    case 'medium':
      return { 
        adjustedScore: Math.max(baseScore - 5, 25), 
        penalty: 5, 
        message: 'Score ajusté (-5 pts) en raison de données partielles' 
      };
    case 'low':
      return { 
        adjustedScore: Math.max(baseScore - 15, 25), 
        penalty: 15, 
        message: 'Score fortement ajusté (-15 pts) - données insuffisantes' 
      };
    case 'insufficient':
      return { 
        adjustedScore: 25, 
        penalty: baseScore - 25, 
        message: 'Évaluation impossible - veuillez fournir plus de données' 
      };
  }
}

export function handleContradictoryData(
  contradictions: Array<{ field1: string; field2: string; severity: number }>
): { penalty: number; flags: string[] } {
  const flags: string[] = [];
  let penalty = 0;
  
  for (const c of contradictions) {
    flags.push(`Incohérence entre ${c.field1} et ${c.field2}`);
    penalty += c.severity * 3;
  }
  
  return { penalty: Math.min(penalty, 30), flags };
}
