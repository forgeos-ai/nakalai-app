/**
 * Ligature engine mode session — Golden Lab toggles without touching paint.ts.
 */

import type { LigatureEngineMode } from './types';

let activeMode: LigatureEngineMode = 'intelligent';

export function setLigatureEngineMode(mode: LigatureEngineMode): void {
  activeMode = mode;
}

export function getLigatureEngineMode(): LigatureEngineMode {
  return activeMode;
}

export function resetLigatureEngineMode(): void {
  activeMode = 'intelligent';
}
