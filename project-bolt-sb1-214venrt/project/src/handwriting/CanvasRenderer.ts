/**
 * CanvasRenderer — DNA Engine v1 paint entry.
 * Delegates to deterministic DNA renderer (no Math.random).
 */

import type { PageSegment } from '../pagination';
import type { HandwritingProfile } from './HandwritingProfile';
import {
  renderDnaToCanvas,
  getActiveHandwritingDNA,
} from '../../lib/handwriting';

export type CanvasRenderRequest = {
  canvas: HTMLCanvasElement;
  segments: PageSegment[];
  profile: HandwritingProfile;
  widthPx: number;
  heightPx: number;
  fillContainer?: boolean;
  layoutScale?: number;
  pageSalt?: number;
  /** Optional external token; otherwise a fresh one is acquired. */
  renderToken?: number;
};

/**
 * Core deterministic paint — aborted if renderToken is superseded.
 * Consumes session DNA when present; otherwise adapts the HandwritingProfile.
 */
export async function renderHandwritingToCanvas(
  request: CanvasRenderRequest,
): Promise<{ ok: boolean; token: number }> {
  const result = await renderDnaToCanvas({
    canvas: request.canvas,
    segments: request.segments,
    dna: getActiveHandwritingDNA(),
    profile: request.profile,
    widthPx: request.widthPx,
    heightPx: request.heightPx,
    fillContainer: request.fillContainer,
    layoutScale: request.layoutScale,
    pageSalt: request.pageSalt,
    renderToken: request.renderToken,
  });
  return { ok: result.ok, token: result.token };
}
