import type { DnaMetric } from '../types';

export type RhythmDNA = {
  confidence: number;
  writingSpeed: DnaMetric<number>;
  lineHeightModulation: DnaMetric<number>;
  randomness: DnaMetric<number>;
  driftFrequency: DnaMetric<number>;
  pageRhythmPhase: DnaMetric<number>;
};
