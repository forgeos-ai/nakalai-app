import type { DnaMetric } from '../types';

export type SpacingDNA = {
  confidence: number;
  trackingEm: DnaMetric<number>;
  wordSpacingEm: DnaMetric<number>;
  lineSpacingScale: DnaMetric<number>;
  meanVerticalGapPx: DnaMetric<number>;
  marginBias: DnaMetric<number>;
  marginIrregularityEm: DnaMetric<number>;
  /** Contextual kerning strengths (deterministic priors). */
  kerning: DnaMetric<{
    doubleLetter: number;
    afterVowel: number;
    default: number;
  }>;
};
