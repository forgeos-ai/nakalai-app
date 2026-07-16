/**
 * InkState — pure function of PressureState.
 */

import { clamp, clamp01 } from '../types';
import type { InkState, PressureState, StrokeDynamics } from './types';

/**
 * PressureState → InkState (pure).
 */
export function inkFromPressure(
  pressure: PressureState,
  dynamics: StrokeDynamics,
): InkState {
  const taper = dynamics.taper;
  const liftDip = dynamics.phase === 'lift' ? 0.04 : 0;
  const opacity = clamp(
    pressure.opacity * (0.94 + taper * 0.06 - liftDip),
    0.62,
    0.97,
  );
  const strokeThickness = pressure.strokeWidth * (0.92 + taper * 0.1);
  const edgeSoftness = clamp01(
    pressure.edgeSoftness * (0.9 + (1 - taper) * 0.08),
  );
  const density = clamp01(
    pressure.pressure * 0.55 + opacity * 0.35 + (1 - edgeSoftness) * 0.1,
  );

  return Object.freeze({
    opacity,
    strokeThickness,
    edgeSoftness,
    density,
  });
}

/**
 * Map ink + pressure to renderer-facing alpha and shadowBlur.
 */
export function inkToRenderScalars(ink: InkState, pressure: PressureState): {
  alpha: number;
  shadowBlur: number;
} {
  return {
    alpha: ink.opacity,
    shadowBlur: pressure.shadowBlur,
  };
}
