/**
 * Motion Physics orchestration — plan-builder entry point.
 */

import { clamp } from '../types';
import { buildMotionState } from './motion';
import { pressureFromMotion } from './pressureModel';
import { inkFromPressure, inkToRenderScalars } from './inkModel';
import { strokeDynamicsFromMotion } from './strokeDynamics';
import type { MotionPhysicsContext } from './types';

export type LegacyPressureInput = Readonly<{
  baseAlpha: number;
  alphaVariance: number;
  shadowBlurPx: number;
  strength: number;
  randomness: number;
  r2: number;
  r5: number;
}>;

export type GlyphPhysicsResult = Readonly<{
  alpha: number;
  shadowBlur: number;
  motion?: ReturnType<typeof buildMotionState>;
  pressure?: ReturnType<typeof pressureFromMotion>;
  ink?: ReturnType<typeof inkFromPressure>;
  stroke?: ReturnType<typeof strokeDynamicsFromMotion>;
  nextVelocity: number;
}>;

/**
 * Legacy seeded pressure (pre–Sprint E baseline).
 */
export function legacyGlyphInkScalars(input: LegacyPressureInput): {
  alpha: number;
  shadowBlur: number;
} {
  const alpha = Math.max(
    0.62,
    input.baseAlpha -
      input.alphaVariance * input.strength * (0.25 + input.r5 * 0.75),
  );
  const shadowBlur = clamp(
    input.shadowBlurPx * (0.85 + (input.r2 - 0.5) * 0.3 * input.randomness),
    0.15,
    1.2,
  );
  return { alpha, shadowBlur };
}

/**
 * Motion Physics pipeline for one glyph.
 */
export function computeGlyphPhysics(
  ctx: MotionPhysicsContext,
  previousVelocity: number,
  renderScalars: Readonly<{
    baseAlpha: number;
    alphaVariance: number;
    shadowBlurPx: number;
    strokeWidthPx: number;
    strength: number;
  }>,
): GlyphPhysicsResult {
  const motion = buildMotionState(ctx, previousVelocity);
  const pressure = pressureFromMotion({
    motion,
    baseAlpha: renderScalars.baseAlpha,
    alphaVariance: renderScalars.alphaVariance,
    shadowBlurPx: renderScalars.shadowBlurPx,
    strokeWidthPx: renderScalars.strokeWidthPx,
    strength: renderScalars.strength,
  });
  const stroke = strokeDynamicsFromMotion(motion, ctx.glyphIndex);
  const ink = inkFromPressure(pressure, stroke);
  const { alpha, shadowBlur } = inkToRenderScalars(ink, pressure);

  return Object.freeze({
    alpha,
    shadowBlur,
    motion,
    pressure,
    ink,
    stroke,
    nextVelocity: motion.velocity,
  });
}

export { buildMotionState } from './motion';
export { pressureFromMotion } from './pressureModel';
export { inkFromPressure, inkToRenderScalars } from './inkModel';
export { strokeDynamicsFromMotion } from './strokeDynamics';
export { auditMotionPhysics } from './audit';
export {
  setPressureEngineMode,
  getPressureEngineMode,
  resetPressureEngineMode,
} from './session';
export type * from './types';
