export type {
  WriterMemoryContext,
  WriterMemoryAudit,
  ContextHeatmapCell,
} from './types';
export {
  buildWriterContextKey,
  deriveContextWeights,
  selectWriterMemoryGlyph,
} from './habits';
export { auditWriterMemory } from './audit';
export {
  getGlyphEngineMode,
  resetGlyphEngineMode,
  setGlyphEngineMode,
  type GlyphEngineMode,
} from './session';
