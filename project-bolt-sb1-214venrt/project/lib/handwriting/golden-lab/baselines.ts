/**
 * Frozen baseline fingerprints + scores for dna-v1-baseline.
 * Update only when intentionally changing the handwriting engine baseline.
 */

import type { GoldenSampleId } from './types';

export const BASELINE_ENGINE_ID = 'dna-v1-baseline' as const;
export const CURRENT_ENGINE_ID = 'dna-v1-current' as const;

/** Minimum overall score per sample (regression floor). */
export type BaselineRecord = {
  overallMin: number;
  fingerprints: Record<GoldenSampleId, string>;
  dimensionFloors: Record<
    GoldenSampleId,
    {
      glyphDiversity: number;
      writerConsistency: number;
      spacing: number;
      baseline: number;
      pressure: number;
      motionScore?: number;
      inkConsistency?: number;
      strokeFlow?: number;
      rhythm: number;
      ligatures: number;
      transitionConsistency?: number;
      continuityScore?: number;
      joinConfidence?: number;
      overallRealism: number;
    }
  >;
};

/**
 * Captured from DNA Engine v1 at Golden Lab introduction.
 * Fingerprints must match current engine until a deliberate baseline bump.
 */
export const GOLDEN_BASELINE: BaselineRecord = {
  overallMin: 72,
  fingerprints: {
    'cursive-neat-paragraph': '346f9e55',
    'casual-print-notes': 'e137de87',
    'rushed-slanted': '70e040a8',
    'low-confidence-fallback': 'e965f587',
    'double-letter-kerning': '0c8b4961',
  },
  dimensionFloors: {
    'cursive-neat-paragraph': {
      glyphDiversity: 80,
      writerConsistency: 95,
      spacing: 70,
      baseline: 47,
      pressure: 85,
      motionScore: 89,
      inkConsistency: 74,
      strokeFlow: 88,
      rhythm: 67,
      ligatures: 47,
      transitionConsistency: 93,
      continuityScore: 61,
      joinConfidence: 47,
      overallRealism: 82,
    },
    'casual-print-notes': {
      glyphDiversity: 89,
      writerConsistency: 95,
      spacing: 82,
      baseline: 24,
      pressure: 78,
      motionScore: 74,
      inkConsistency: 73,
      strokeFlow: 67,
      rhythm: 51,
      ligatures: 34,
      transitionConsistency: 94,
      continuityScore: 54,
      joinConfidence: 29,
      overallRealism: 75,
    },
    'rushed-slanted': {
      glyphDiversity: 82,
      writerConsistency: 95,
      spacing: 60,
      baseline: 61,
      pressure: 87,
      motionScore: 93,
      inkConsistency: 77,
      strokeFlow: 90,
      rhythm: 79,
      ligatures: 44,
      transitionConsistency: 92,
      continuityScore: 58,
      joinConfidence: 44,
      overallRealism: 84,
    },
    'low-confidence-fallback': {
      glyphDiversity: 87,
      writerConsistency: 61,
      spacing: 72,
      baseline: 31,
      pressure: 80,
      motionScore: 83,
      inkConsistency: 69,
      strokeFlow: 83,
      rhythm: 67,
      ligatures: 28,
      transitionConsistency: 93,
      continuityScore: 49,
      joinConfidence: 19,
      overallRealism: 71,
    },
    'double-letter-kerning': {
      glyphDiversity: 86,
      writerConsistency: 74,
      spacing: 70,
      baseline: 44,
      pressure: 87,
      motionScore: 91,
      inkConsistency: 76,
      strokeFlow: 88,
      rhythm: 67,
      ligatures: 48,
      transitionConsistency: 92,
      continuityScore: 62,
      joinConfidence: 46,
      overallRealism: 81,
    },
  },
};

/** Populate baseline fingerprints from a live scorecard run (dev bootstrap). */
export function bootstrapBaselineFingerprints(
  records: Array<{ sampleId: GoldenSampleId; fingerprint: string }>,
): BaselineRecord {
  const next = { ...GOLDEN_BASELINE, fingerprints: { ...GOLDEN_BASELINE.fingerprints } };
  for (const r of records) {
    next.fingerprints[r.sampleId] = r.fingerprint;
  }
  return next;
}
