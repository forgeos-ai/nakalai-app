/**
 * Pressure engine mode session — Golden Lab toggles without touching paint.ts.
 */

import type { PressureEngineMode } from './types';

let activeMode: PressureEngineMode = 'physics';

export function setPressureEngineMode(mode: PressureEngineMode): void {
  activeMode = mode;
}

export function getPressureEngineMode(): PressureEngineMode {
  return activeMode;
}

export function resetPressureEngineMode(): void {
  activeMode = 'physics';
}
