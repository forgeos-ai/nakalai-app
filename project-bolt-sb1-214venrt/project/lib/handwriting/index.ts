/**
 * DNA Engine v1 — public barrel.
 * Segmentation → DNA → Glyphs/Rhythm/Spacing/Baseline/Ligatures → Renderer
 *
 * Constraints: memory-only, never persist DNA, destroy after PDF export.
 */

export {
  type DnaMetric,
  type DnaConfidence,
  type DnaSource,
  metric,
  hashDnaSeed,
  mixSeed,
  createSeededRng,
  clamp,
  clamp01,
  aggregateConfidence,
} from './types';

export {
  HANDWRITING_DNA_VERSION,
  type HandwritingDNA,
  assembleHandwritingDNA,
  type AssembleDnaInput,
  getActiveHandwritingDNA,
  getHandwritingDnaRevision,
  setActiveHandwritingDNA,
  clearHandwritingDNA,
  isHandwritingDnaActive,
  handwritingDnaToProfile,
} from './dna';

export {
  segmentHandwritingFile,
  segmentationFromSlice,
  emptySegmentationDNA,
  type SegmentationDNA,
  type SegmentationCluster,
} from './segmentation';

export { deriveGlyphVariants, type GlyphVariantDNA } from './glyphs';
export {
  auditWriterMemory,
  setGlyphEngineMode,
  resetGlyphEngineMode,
  getGlyphEngineMode,
} from './memory';
export { deriveRhythm, type RhythmDNA } from './rhythm';
export {
  buildLineRhythmCurve,
  buildParagraphRhythmPlans,
  computeRhythmWordGapEm,
  type WordSpacingMode,
} from './rhythm';
export { deriveSpacing, type SpacingDNA } from './spacing';
export { deriveBaseline, type BaselineDNA } from './baseline';
export {
  deriveLigatures,
  auditLigatureIntelligence,
  setLigatureEngineMode,
  resetLigatureEngineMode,
  getLigatureEngineMode,
  type LigatureDNA,
  type GlyphTransition,
  type LigatureAudit,
} from './ligatures';

export {
  buildPagePaintPlan,
  renderDnaToCanvas,
  profileToLightweightDna,
  getDnaDebugSnapshot,
  drawDnaDebugOverlay,
  type DnaCanvasRenderRequest,
  type PagePaintPlan,
  type RendererDNA,
} from './renderer';

export {
  destroyHandwritingSession,
  scrubHandwritingCanvases,
} from './privacy';

export {
  runGoldenLab,
  getGoldenSamples,
  scoreSample,
  GOLDEN_BASELINE,
} from './golden-lab';
