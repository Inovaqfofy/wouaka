// ============================================
// SOVEREIGN SCORING MODULE - Main Export
// No external dependencies, fully self-hosted
// ============================================

export * from './data-sources-sovereign';
export * from './feature-engineering';
export * from './scoring-engine';

// Version info
export const SOVEREIGN_SCORING_VERSION = '5.2.0';
export const SOVEREIGN_SCORING_REGION = 'UEMOA';
export const SOVEREIGN_SCORING_COUNTRIES = [
  'Benin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinea-Bissau',
  'Mali', 'Niger', 'Senegal', 'Togo'
];

// Summary statistics
export const MODULE_STATS = {
  total_data_sources: 20,
  categories: ['banking', 'mobile_money', 'utilities', 'device', 'social', 'psychometric', 'environmental', 'declared'],
  total_features: 28,
  sub_scores: 6,
  risk_tiers: 6,
  offline_capable: true,
  external_dependencies: 0,
};
