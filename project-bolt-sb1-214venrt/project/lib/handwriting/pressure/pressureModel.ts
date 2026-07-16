/**
 * PressureState — pure function of MotionState.
 */

import { clamp, clamp01 } from '../types';
import type { MotionState, PressureState } from './types';

export type PressureModelInput = Readonly<{
  motion: MotionState;
  baseAlpha: number;
  alphaVariance: number;
  shadowBlurPx: number;
  strokeWidthPx: number;
  strength: number;
}>;

/**
 * MotionState → PressureState (pure).
 */
export function pressureFromMotion(input: PressureModelInput): PressureState {
  const { motion, baseAlpha, alphaVariance, shadowBlurPx, strokeWidthPx, strength } =
    input;

  const slowFactor = 1 - motion.velocity;
  const pressure = clamp01(
    0.42 + slowFactor * 0.38 - motion.penLift * 0.22 + motion.hesitation * 0.08,
  );

  const strokeWidth = clamp(
    strokeWidthPx * (0.88 + pressure * 0.18 - motion.penLift * 0.06),
    0.45,
    strokeWidthPx * 1.25,
  );

  const opacity = clamp(
    baseAlpha -
      alphaVariance * strength * (0.15 + motion.velocity * 0.55) +
      slowFactor * alphaVariance * 0.12 -
      motion.penLift * 0.04,
    0.62,
    0.97,
  );

  const shadowBlur = clamp(
    shadowBlurPx *
      (0.82 + pressure * 0.22 - motion.velocity * 0.12 + motion.curvature * 0.06),
    0.15,
    1.2,
  );

  const edgeSoftness = clamp01(
    0.35 + motion.curvature * 0.25 + motion.penLift * 0.2 - pressure * 0.1,
  );

  return Object.freeze({
    pressure,
    strokeWidth,
    opacity,
    shadowBlur,
    edgeSoftness,
  });
}
