/**
 * Privacy teardown — zeroize / drop every in-memory DNA & glyph buffer.
 * Never touches payment entitlement or assignment text.
 */

import { clearHandwritingDNA } from './dna/session';
import { clearExtractedGlyphs } from '../../src/utils/glyphSlicer';
import { clearLetterPatchSession } from '../../src/utils/matrixSlicer';
import { clearJitterCache } from '../../src/jitter';
import { clearHandwritingProfile } from '../../src/handwriting/HandwritingProfile';
import { clearMatchedStyleOverrides } from '../../src/pageGeometry';
import {
  abortTrackedControllers,
  clearTrackedTimers,
  clearTrackedRafs,
  revokeTrackedObjectUrls,
  disposeTrackedBitmaps,
  invalidateRenderGeneration,
} from '../../src/handwriting/RenderLifecycle';
import { invalidateFontRegistry } from '../../src/handwriting/FontRegistry';

/**
 * Scrub matched preview canvases so pixels cannot be reused after purge.
 */
export function scrubHandwritingCanvases(
  root: ParentNode | null | undefined = typeof document !== 'undefined'
    ? document
    : null,
): void {
  if (!root) return;
  const nodes = root.querySelectorAll(
    'canvas[data-handwriting-surface="true"]',
  );
  nodes.forEach((node) => {
    const canvas = node as HTMLCanvasElement;
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    } catch {
      /* ignore */
    }
    delete canvas.dataset.profileSeed;
    delete canvas.dataset.profileRevision;
    delete canvas.dataset.renderToken;
    delete canvas.dataset.dnaDeterministic;
  });
}

/**
 * Hard destroy all DNA + glyph analysis state after successful PDF export
 * (or on fresh upload). Does not clear payment / entitlement / text.
 */
export function destroyHandwritingSession(opts?: {
  scrubDom?: boolean;
  /** When true, also bump render generation so in-flight paints die. */
  invalidateRenders?: boolean;
}): void {
  abortTrackedControllers();
  clearTrackedTimers();
  clearTrackedRafs();
  revokeTrackedObjectUrls();
  disposeTrackedBitmaps();

  clearHandwritingDNA();
  clearHandwritingProfile();
  clearMatchedStyleOverrides();
  clearExtractedGlyphs();
  clearLetterPatchSession();
  clearJitterCache();
  invalidateFontRegistry();

  if (opts?.invalidateRenders !== false) {
    invalidateRenderGeneration();
  }

  if (opts?.scrubDom !== false) {
    scrubHandwritingCanvases();
  }
}
