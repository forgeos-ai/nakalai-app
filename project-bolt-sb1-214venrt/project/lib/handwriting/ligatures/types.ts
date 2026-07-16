/**
 * Ligature Intelligence — types.
 */

import type { DnaMetric } from '../types';

/**
 * Without OCR: probabilistic join behavior only.
 * observedPairJoins stays empty in v1.
 */
export type LigatureDNA = {
  confidence: number;
  connectedLetterBehavior: DnaMetric<number>;
  entryExitCurvature: DnaMetric<number>;
  joinPriorByClass: DnaMetric<{
    vowelVowel: number;
    consonantVowel: number;
    doubleLetter: number;
  }>;
  observedPairJoins: Array<{
    left: string;
    right: string;
    rate: number;
    confidence: number;
  }>;
};

export type TransitionDirection = number; // -1..1

export type GlyphTransition = {
  pair: string;
  left: string;
  right: string;
  joinStrength: number;
  preferredGapEm: number;
  exitDirection: TransitionDirection;
  entryDirection: TransitionDirection;
  overlapAmount: number;
  confidence: number;
};

export type TransitionHeatmapCell = {
  pair: string;
  hits: number;
  meanJoinStrength: number;
  meanConfidence: number;
  meanGapEm: number;
  joinRate: number;
};

export type LigatureAudit = {
  transitionConsistency: number;
  continuityScore: number;
  joinConfidence: number;
  heatmap: TransitionHeatmapCell[];
  transitions: GlyphTransition[];
};

export type LigatureEngineMode = 'legacy' | 'intelligent';
