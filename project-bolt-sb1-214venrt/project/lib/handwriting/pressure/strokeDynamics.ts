/**
 * Stroke dynamics — touch → flow → lift, entry → middle → exit.
 */

import { clamp01 } from '../types';
import type { MotionState, StrokeDynamics, StrokePhase, StrokeSegment } from './types';

function resolvePhase(motion: MotionState): StrokePhase {
  if (motion.penLift > 0.55) return 'lift';
  if (motion.velocity > 0.62 && motion.hesitation < 0.25) return 'flow';
  return 'touch';
}

function resolveSegment(motion: MotionState, glyphIndex: number): StrokeSegment {
  const mod = glyphIndex % 5;
  if (mod === 0 || motion.hesitation > 0.45) return 'entry';
  if (mod === 4 || motion.penLift > 0.4) return 'exit';
  return 'middle';
}

function taperForSegment(segment: StrokeSegment, motion: MotionState): number {
  const base =
    segment === 'entry'
      ? 0.72 + motion.velocity * 0.12
      : segment === 'exit'
        ? 0.68 + motion.penLift * 0.2
        : 0.88 + motion.velocity * 0.08;
  return clamp01(base - motion.curvature * 0.06);
}

/**
 * Derive stroke phase and natural taper from motion.
 */
export function strokeDynamicsFromMotion(
  motion: MotionState,
  glyphIndex: number,
): StrokeDynamics {
  const phase = resolvePhase(motion);
  const segment = resolveSegment(motion, glyphIndex);
  const taper = taperForSegment(segment, motion);

  return Object.freeze({ phase, segment, taper });
}
