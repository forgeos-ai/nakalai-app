/**
 * Motion Physics types — immutable state carriers.
 */

export type PressureEngineMode = 'legacy' | 'physics';

/** Per-glyph hand motion — frozen after construction. */
export type MotionState = Readonly<{
  velocity: number;
  acceleration: number;
  curvature: number;
  hesitation: number;
  penLift: number;
  strokeLength: number;
}>;

/** Pressure derived purely from motion. */
export type PressureState = Readonly<{
  pressure: number;
  strokeWidth: number;
  opacity: number;
  shadowBlur: number;
  edgeSoftness: number;
}>;

/** Ink derived purely from pressure. */
export type InkState = Readonly<{
  opacity: number;
  strokeThickness: number;
  edgeSoftness: number;
  density: number;
}>;

export type StrokePhase = 'touch' | 'flow' | 'lift';
export type StrokeSegment = 'entry' | 'middle' | 'exit';

export type StrokeDynamics = Readonly<{
  phase: StrokePhase;
  segment: StrokeSegment;
  taper: number;
}>;

export type MotionTimelineCell = Readonly<{
  glyphIndex: number;
  char: string;
  velocity: number;
  pressure: number;
  inkOpacity: number;
  penLift: number;
  phase: StrokePhase;
}>;

export type PressureHeatmapCell = Readonly<{
  char: string;
  hits: number;
  meanPressure: number;
  meanVelocity: number;
}>;

export type VelocityHeatmapCell = Readonly<{
  char: string;
  hits: number;
  meanVelocity: number;
  meanAcceleration: number;
}>;

export type MotionPhysicsAudit = Readonly<{
  motionScore: number;
  pressureScore: number;
  inkConsistency: number;
  strokeFlow: number;
  timeline: MotionTimelineCell[];
  pressureHeatmap: PressureHeatmapCell[];
  velocityHeatmap: VelocityHeatmapCell[];
}>;

export type MotionPhysicsContext = Readonly<{
  dnaSeed: number;
  rootSeed: number;
  glyphIndex: number;
  totalGlyphs: number;
  row: number;
  paragraphRow: number;
  wordIndex: number;
  charIndexInWord: number;
  wordLength: number;
  char: string;
  previousChar?: string;
  nextChar?: string;
  advancePx: number;
  fontSizePx: number;
  strength: number;
  writingSpeed: number;
  isCursive: boolean;
  variantId?: number;
  transitionJoinStrength?: number;
  transitionConfidence?: number;
  connectToNext?: boolean;
}>;
