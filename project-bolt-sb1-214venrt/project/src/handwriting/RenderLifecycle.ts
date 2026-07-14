/**
 * RenderLifecycle — per-upload pipeline isolation.
 *
 * Every Match My Style upload starts a fresh session epoch so stale async
 * extracts / paints / font loads can never overwrite newer work. No UI.
 */

import { clearExtractedGlyphs } from '../utils/glyphSlicer';
import { clearJitterCache } from '../jitter';
import { clearHandwritingProfile } from './HandwritingProfile';
import { invalidateFontRegistry } from './FontRegistry';

/** Monotonic session id — bumps on every new upload / hard reset. */
let pipelineEpoch = 0;
/** Monotonic extract job id within / across sessions. */
let extractToken = 0;
/**
 * Render generation — bumped only on fresh upload / self-heal.
 * Concurrent page paints (same generation) stay live; old generations die.
 */
let renderGeneration = 0;
let renderSeq = 0;

const trackedObjectUrls = new Set<string>();
const trackedBitmaps = new Set<ImageBitmap>();
const trackedTimers = new Set<ReturnType<typeof setTimeout>>();
const trackedRafs = new Set<number>();
const trackedAbortControllers = new Set<AbortController>();

export type PipelineSession = {
  epoch: number;
  extractToken: number;
};

export function getPipelineEpoch(): number {
  return pipelineEpoch;
}

export function getRenderToken(): number {
  return renderGeneration * 1_000_000 + renderSeq;
}

export function isExtractTokenLive(token: number): boolean {
  return token === extractToken && token > 0;
}

export function isRenderTokenLive(token: number): boolean {
  if (token <= 0) return false;
  const gen = Math.floor(token / 1_000_000);
  return gen === renderGeneration;
}

export function isPipelineEpochLive(epoch: number): boolean {
  return epoch === pipelineEpoch && epoch > 0;
}

/** Track blob: URLs so sessions can revoke them. */
export function trackObjectUrl(url: string): string {
  trackedObjectUrls.add(url);
  return url;
}

export function untrackObjectUrl(url: string): void {
  trackedObjectUrls.delete(url);
}

export function revokeTrackedObjectUrls(): void {
  for (const url of trackedObjectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
  trackedObjectUrls.clear();
}

export function trackImageBitmap(bitmap: ImageBitmap): ImageBitmap {
  trackedBitmaps.add(bitmap);
  return bitmap;
}

export function disposeTrackedBitmaps(): void {
  for (const bmp of trackedBitmaps) {
    try {
      bmp.close();
    } catch {
      /* ignore */
    }
  }
  trackedBitmaps.clear();
}

export function trackTimeout(
  handler: () => void,
  ms: number,
): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    trackedTimers.delete(id);
    handler();
  }, ms);
  trackedTimers.add(id);
  return id;
}

export function clearTrackedTimers(): void {
  for (const id of trackedTimers) {
    clearTimeout(id);
  }
  trackedTimers.clear();
}

export function trackRaf(cb: FrameRequestCallback): number {
  if (typeof requestAnimationFrame === 'undefined') return 0;
  const id = requestAnimationFrame((t) => {
    trackedRafs.delete(id);
    cb(t);
  });
  trackedRafs.add(id);
  return id;
}

export function clearTrackedRafs(): void {
  if (typeof cancelAnimationFrame === 'undefined') {
    trackedRafs.clear();
    return;
  }
  for (const id of trackedRafs) {
    cancelAnimationFrame(id);
  }
  trackedRafs.clear();
}

export function createSessionAbortController(): AbortController {
  const ac = new AbortController();
  trackedAbortControllers.add(ac);
  return ac;
}

export function abortTrackedControllers(): void {
  for (const ac of trackedAbortControllers) {
    try {
      ac.abort();
    } catch {
      /* ignore */
    }
  }
  trackedAbortControllers.clear();
}

/**
 * Hard-reset the rendering pipeline — equivalent to a fresh page load for
 * Match My Style runtime state (does NOT touch React UI state or user text).
 */
export function beginFreshUploadSession(): PipelineSession {
  pipelineEpoch += 1;
  extractToken = pipelineEpoch;
  // Invalidate every in-flight canvas paint from prior uploads
  renderGeneration = pipelineEpoch;
  renderSeq = 0;

  abortTrackedControllers();
  clearTrackedTimers();
  clearTrackedRafs();
  revokeTrackedObjectUrls();
  disposeTrackedBitmaps();

  clearHandwritingProfile();
  clearExtractedGlyphs();
  clearJitterCache();
  invalidateFontRegistry();

  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.info(
      '[NakalAI] Fresh upload session',
      pipelineEpoch,
      '— prior jobs invalidated',
    );
  }

  return { epoch: pipelineEpoch, extractToken };
}

/** Claim a new extract job under the current session (or start one). */
export function acquireExtractToken(): number {
  if (pipelineEpoch === 0) {
    beginFreshUploadSession();
  }
  extractToken += 1;
  return extractToken;
}

/** Claim a paint slot under the current generation (siblings stay live). */
export function acquireRenderToken(): number {
  if (renderGeneration === 0) {
    renderGeneration = 1;
  }
  renderSeq += 1;
  return renderGeneration * 1_000_000 + renderSeq;
}

/**
 * Fully reset canvas 2D state so transforms / clips / shadows cannot bleed
 * across paints. Reallocating width/height clears the backing store.
 */
export function resetCanvasSurface(
  canvas: HTMLCanvasElement,
  widthPx: number,
  heightPx: number,
  dpr: number,
  fillContainer: boolean,
): CanvasRenderingContext2D | null {
  // Drop any prior GPU/backing store completely
  try {
    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
  } catch {
    /* ignore */
  }

  canvas.width = Math.max(1, Math.round(widthPx * dpr));
  canvas.height = Math.max(1, Math.round(heightPx * dpr));
  canvas.style.width = fillContainer ? '100%' : `${widthPx}px`;
  canvas.style.height = fillContainer ? '100%' : `${heightPx}px`;

  const ctx = canvas.getContext('2d', {
    alpha: true,
    willReadFrequently: false,
  });
  if (!ctx) return null;

  // Prefer full reset when available (Chrome 99+)
  const maybeReset = (
    ctx as CanvasRenderingContext2D & { reset?: () => void }
  ).reset;
  if (typeof maybeReset === 'function') {
    try {
      maybeReset.call(ctx);
    } catch {
      /* ignore */
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.filter = 'none';
  ctx.imageSmoothingEnabled = true;
  ctx.lineWidth = 1;
  ctx.miterLimit = 10;
  try {
    ctx.beginPath();
  } catch {
    /* ignore */
  }
  try {
    // Empty clip restoration — identity clip via reset transform + full clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, widthPx, heightPx);
  } catch {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return ctx;
}

/**
 * Rebuild font/registry plumbing after inconsistency (no page reload).
 * Does NOT bump render generation — active paint may continue after reload.
 */
export function selfHealRenderingEngine(reason: string): void {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('[NakalAI] Self-healing render engine:', reason);
  }
  invalidateFontRegistry();
  clearTrackedTimers();
  clearTrackedRafs();
}
