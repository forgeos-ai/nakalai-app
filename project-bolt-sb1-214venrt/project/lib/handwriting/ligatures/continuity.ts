/**
 * Continuity adjustments from transition plans — gap/overlap only.
 * No Bezier bridges. No invented connectors.
 */

import { clamp } from '../types';
import type { GlyphTransition } from './types';

/**
 * Convert a transition into an advance delta in px.
 * Positive = more gap; negative = tighter / overlap.
 */
export function continuityAdvanceDeltaPx(args: {
  transition: GlyphTransition;
  fontSize: number;
  joined: boolean;
}): number {
  const { transition, fontSize, joined } = args;
  if (!joined) {
    // Low confidence → natural gap, never force continuity.
    return fontSize * Math.max(0.02, transition.preferredGapEm + 0.04);
  }

  const gapPx = transition.preferredGapEm * fontSize;
  const overlapPx = transition.overlapAmount * fontSize * 0.45;
  return clamp(gapPx - overlapPx, -fontSize * 0.22, fontSize * 0.08);
}

/** Soft slant nudge from exit/entry directions (radians contribution). */
export function continuityRotationNudge(transition: GlyphTransition): number {
  return (transition.exitDirection - transition.entryDirection) * 0.012;
}
