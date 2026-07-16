/**
 * Confidence gate for ligature joins — never force continuity.
 */

import { clamp01 } from '../types';
import type { HandwritingDNA } from '../dna/types';

export function joinConfidenceThreshold(dna: HandwritingDNA): number {
  // Faster writers tolerate lower confidence; hesitant writers leave gaps.
  const speed = dna.rhythm.writingSpeed.value;
  const base = dna.ligatures.confidence;
  return clamp01(0.42 + (1 - speed) * 0.18 + (1 - base) * 0.12);
}

export function shouldJoinTransition(args: {
  confidence: number;
  joinStrength: number;
  threshold: number;
  isCursive: boolean;
}): boolean {
  if (!args.isCursive) {
    // Print writers almost never force joins — only very high confidence doubles.
    return args.confidence >= 0.88 && args.joinStrength >= 0.9;
  }
  return (
    args.confidence >= args.threshold &&
    args.joinStrength * args.confidence >= args.threshold * 0.72
  );
}
