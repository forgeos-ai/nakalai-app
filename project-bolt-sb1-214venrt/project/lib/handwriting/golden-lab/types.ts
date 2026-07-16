/**
 * Golden Lab v1 — evaluation framework types.
 * Read-only consumers of lib/handwriting; never mutates production state.
 */

import type { HandwritingDNA } from '../dna/types';
import type { PagePaintPlan } from '../renderer/types';
import type { ContextHeatmapCell } from '../memory/types';
import type { TransitionHeatmapCell } from '../ligatures/types';

export const GOLDEN_LAB_VERSION = 1 as const;

/** Engine label for comparison artifacts. */
export type EngineVersionId = 'dna-v1-baseline' | 'dna-v1-current';

export type GoldenSampleId =
  | 'cursive-neat-paragraph'
  | 'casual-print-notes'
  | 'rushed-slanted'
  | 'low-confidence-fallback'
  | 'double-letter-kerning';

export type GoldenSample = {
  id: GoldenSampleId;
  label: string;
  text: string;
  /** Pre-built DNA fixture — no upload required. */
  dna: HandwritingDNA;
  widthPx: number;
  pageSalt: number;
};

export type ScorecardDimension =
  | 'glyphDiversity'
  | 'writerConsistency'
  | 'spacing'
  | 'baseline'
  | 'pressure'
  | 'motionScore'
  | 'inkConsistency'
  | 'strokeFlow'
  | 'rhythm'
  | 'ligatures'
  | 'transitionConsistency'
  | 'continuityScore'
  | 'joinConfidence'
  | 'overallRealism';

export type DimensionScore = {
  dimension: ScorecardDimension;
  /** 0–100 */
  score: number;
  confidence: number;
  detail: string;
};

export type EngineScorecard = {
  engineVersion: EngineVersionId;
  sampleId: GoldenSampleId;
  dimensions: Record<ScorecardDimension, DimensionScore>;
  repeatedGlyphAudit: Array<{
    char: string;
    occurrences: number;
    uniqueVariants: number;
    variantSequence: number[];
  }>;
  writerMemoryAudit?: {
    consistency: number;
    diversity: number;
    cells: ContextHeatmapCell[];
  };
  ligatureAudit?: {
    transitionConsistency: number;
    continuityScore: number;
    joinConfidence: number;
    heatmap: TransitionHeatmapCell[];
  };
  motionPhysicsAudit?: {
    motionScore: number;
    pressureScore: number;
    inkConsistency: number;
    strokeFlow: number;
    timeline: import('../pressure/types').MotionTimelineCell[];
    pressureHeatmap: import('../pressure/types').PressureHeatmapCell[];
    velocityHeatmap: import('../pressure/types').VelocityHeatmapCell[];
  };
  overall: number;
  planFingerprint: string;
  dnaSeed: number;
  timestamp: string;
};

export type RegressionVerdict = {
  sampleId: GoldenSampleId;
  baselineVersion: EngineVersionId;
  currentVersion: EngineVersionId;
  baselineOverall: number;
  currentOverall: number;
  deltaOverall: number;
  /** true when current >= baseline on every dimension */
  noRegression: boolean;
  /** true when current overall improved */
  improved: boolean;
  dimensionDeltas: Record<ScorecardDimension, number>;
  planFingerprintMatch: boolean;
  baselineFingerprint: string;
  currentFingerprint: string;
};

export type GoldenLabReport = {
  version: typeof GOLDEN_LAB_VERSION;
  runAt: string;
  samples: GoldenSampleId[];
  baseline: EngineScorecard[];
  current: EngineScorecard[];
  regressions: RegressionVerdict[];
  /** Gate: all samples pass noRegression */
  mergeReady: boolean;
  summary: string;
};

export type RenderArtifact = {
  sampleId: GoldenSampleId;
  engineVersion: EngineVersionId;
  plan: PagePaintPlan;
  scorecard: EngineScorecard;
  /** data URL when rendered in browser; empty in node */
  imageDataUrl?: string;
};
