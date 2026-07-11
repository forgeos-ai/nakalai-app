/**
 * Layout metrics shared by the typography registry, glyph slicer, and
 * native fillText canvas renderer — no trajectory / stroke-stream math.
 */

export type StrokeLayoutMetrics = {
  strokeWeight: number;
  lineHeightScale: number;
  temperature: number;
  slantDegrees: number;
  /** Left inset / margin feel from archetype. */
  marginScale: number;
  /** Baseline jitter intensity 0–1 (drives micro-variance). */
  baselineJitter: number;
  /** Letter-spacing em from archetype. */
  trackingEm: number;
};

export function defaultStrokeLayoutMetrics(): StrokeLayoutMetrics {
  return {
    strokeWeight: 1.35,
    lineHeightScale: 1,
    temperature: 0.65,
    slantDegrees: 3,
    marginScale: 1,
    baselineJitter: 0.4,
    trackingEm: 0.015,
  };
}
