/**
 * Glyph engine mode — toggled by Golden Lab without touching renderer.
 */

export type GlyphEngineMode = 'cycle' | 'memory';

let activeMode: GlyphEngineMode = 'memory';

export function setGlyphEngineMode(mode: GlyphEngineMode): void {
  activeMode = mode;
}

export function getGlyphEngineMode(): GlyphEngineMode {
  return activeMode;
}

export function resetGlyphEngineMode(): void {
  activeMode = 'memory';
}
