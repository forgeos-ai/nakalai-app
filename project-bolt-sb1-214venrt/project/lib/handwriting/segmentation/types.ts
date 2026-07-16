/**
 * Segmentation DNA — unlabeled character boxes & layout geometry.
 * No OCR; no character identity guesses.
 */

import type { DnaMetric } from '../types';

export type SegmentationCluster = {
  signature: string;
  frequency: number;
  aspect: number;
  inkDensity: number;
  bboxCount: number;
};

export type SegmentationDNA = {
  confidence: number;
  analysisEdgePx: number;
  lineBands: Array<{ top: number; bottom: number }>;
  characterBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    lineIndex: number;
  }>;
  lineCount: DnaMetric<number>;
  characterCount: DnaMetric<number>;
  clusters: SegmentationCluster[];
  strokeThickness: DnaMetric<number>;
  connectivityRatio: DnaMetric<number>;
  meanVerticalGapPx: DnaMetric<number>;
  meanBaselinePx: DnaMetric<number>;
  topMarginPx: DnaMetric<number>;
};
