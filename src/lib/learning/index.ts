/**
 * WOUAKA Self-Learning Engine
 * Main entry point for learning modules
 */

// Weight adjustment
export {
  analyzeFeaturePerformance,
  saveFeaturePerformance,
  getLatestFeaturePerformance,
  type FeaturePerformance,
  type LoanOutcome,
  type WeightAdjustmentResult
} from './weight-adjuster';

// Model versioning
export {
  getActiveModelVersion,
  getModelVersion,
  listModelVersions,
  createModelVersion,
  createVersionFromAdjustment,
  updateModelPerformance,
  promoteToTesting,
  promoteToProduction,
  compareModelVersions,
  archiveModelVersion,
  getFeatureWeightHistory,
  type ModelVersion,
  type FraudRule,
  type CreateModelVersionInput,
  type ModelPerformanceMetrics
} from './model-versioner';

// A/B Testing
export {
  createExperiment,
  getExperiment,
  listExperiments,
  startExperiment,
  pauseExperiment,
  resumeExperiment,
  stopExperiment,
  cancelExperiment,
  getRunningExperiments,
  assignToExperiment,
  recordExperimentOutcome,
  calculateExperimentResults,
  type ABExperiment,
  type CreateExperimentInput,
  type ExperimentAssignment,
  type ExperimentResults
} from './ab-testing';
