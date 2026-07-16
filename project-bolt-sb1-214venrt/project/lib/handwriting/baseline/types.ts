import type { DnaMetric } from '../types';

export type BaselineDNA = {
  confidence: number;
  globalSlantDegrees: DnaMetric<number>;
  drift: DnaMetric<number>;
  lineBaselinesPx: DnaMetric<number[]>;
  meanBaselinePx: DnaMetric<number>;
  rotationVarianceDeg: DnaMetric<number>;
};
