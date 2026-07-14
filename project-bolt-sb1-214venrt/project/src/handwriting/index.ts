/**
 * Handwriting Profile Engine — public barrel.
 * StyleExtractor → HandwritingProfile → VariationEngine → CanvasRenderer
 */

export {
  HANDWRITING_PROFILE_VERSION,
  type HandwritingProfile,
  getActiveHandwritingProfile,
  getHandwritingProfileRevision,
  setActiveHandwritingProfile,
  clearHandwritingProfile,
  isHandwritingProfileActive,
  createDefaultHandwritingProfile,
  resolveHandwritingProfile,
  profileFromMatchedOverrides,
  matchedOverridesFromProfile,
  hashProfileSeed,
} from './HandwritingProfile';

export {
  extractHandwritingProfile,
  notebookStyleToHandwritingProfile,
  type StyleExtractRequest,
} from './StyleExtractor';

export {
  createVariationEngine,
  createSeededRng,
  mixSeed,
  seededWordGapPx,
  type VariationEngine,
  type GlyphVariation,
} from './VariationEngine';

export {
  renderHandwritingToCanvas,
  type CanvasRenderRequest,
} from './CanvasRenderer';

export {
  beginFreshUploadSession,
  acquireExtractToken,
  acquireRenderToken,
  isExtractTokenLive,
  isRenderTokenLive,
  getPipelineEpoch,
  getRenderToken,
  resetCanvasSurface,
  selfHealRenderingEngine,
  trackObjectUrl,
  untrackObjectUrl,
  type PipelineSession,
} from './RenderLifecycle';

export {
  ensureHandwritingFonts,
  invalidateFontRegistry,
  probeFontUsable,
  getFontRegistryGeneration,
} from './FontRegistry';
