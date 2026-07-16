/**
 * Golden Lab v1 — public barrel.
 */

export { GOLDEN_LAB_VERSION } from './types';
export type {
  GoldenSample,
  GoldenSampleId,
  EngineScorecard,
  GoldenLabReport,
  RegressionVerdict,
  ScorecardDimension,
  RenderArtifact,
  EngineVersionId,
} from './types';

export { getGoldenSamples, getGoldenSample } from './samples';
export { scoreSample } from './scorecard';
export { runGoldenLab, DIMENSIONS } from './regression';
export {
  BASELINE_ENGINE_ID,
  CURRENT_ENGINE_ID,
  GOLDEN_BASELINE,
  bootstrapBaselineFingerprints,
} from './baselines';
export { fingerprintPaintPlan } from './fingerprint';
export { textToSegments } from './segments';
export { renderGoldenSample, TEXT_AREA_HEIGHT } from './renderSample';
