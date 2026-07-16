/**
 * Production canvas renderer — builds PaintPlan then paints passively.
 * All rendering decisions live in buildPagePaintPlan (instructions.ts).
 */

import type { PageSegment } from '../../../src/pagination';
import {
  ensureHandwritingFonts,
  probeFontUsable,
} from '../../../src/handwriting/FontRegistry';
import {
  acquireRenderToken,
  isRenderTokenLive,
  resetCanvasSurface,
  selfHealRenderingEngine,
} from '../../../src/handwriting/RenderLifecycle';
import type { HandwritingProfile } from '../../../src/handwriting/HandwritingProfile';
import type { HandwritingDNA } from '../dna/types';
import { getActiveHandwritingDNA } from '../dna/session';
import { profileToLightweightDna } from './fromProfile';
import { buildPagePaintPlan } from './instructions';
import { executePagePaintPlan } from './executePlan';
import type { PagePaintPlan } from './types';

export type DnaCanvasRenderRequest = {
  canvas: HTMLCanvasElement;
  segments: PageSegment[];
  dna?: HandwritingDNA | null;
  profile?: HandwritingProfile;
  widthPx: number;
  heightPx: number;
  glyphSelection?: 'legacy' | 'contextual';
  fillContainer?: boolean;
  layoutScale?: number;
  pageSalt?: number;
  renderToken?: number;
};

const latestCanvasPaint = new WeakMap<HTMLCanvasElement, number>();

/**
 * Build the canonical paint plan — shared by Golden Lab and production.
 */
export function buildProductionPaintPlan(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
  widthPx: number;
  pageSalt?: number;
  layoutScale?: number;
  glyphSelection?: 'legacy' | 'contextual';
  fontSizePx?: number;
}): PagePaintPlan {
  return buildPagePaintPlan({
    dna: args.dna,
    segments: args.segments,
    widthPx: args.widthPx,
    pageSalt: args.pageSalt ?? 0,
    layoutScale: args.layoutScale ?? 1,
    glyphSelection: args.glyphSelection ?? 'contextual',
    wordSpacing: 'rhythm',
    fontSizePx: args.fontSizePx,
  });
}

/**
 * Paint from DNA. Loads fonts, builds PaintPlan, executes passively.
 */
export async function renderDnaToCanvas(
  request: DnaCanvasRenderRequest,
): Promise<{ ok: boolean; token: number; plan: PagePaintPlan | null }> {
  const {
    canvas,
    segments,
    widthPx,
    heightPx,
    glyphSelection = 'contextual',
    fillContainer = false,
    layoutScale = 1,
    pageSalt = 0,
  } = request;

  const token = request.renderToken ?? acquireRenderToken();
  if (!isRenderTokenLive(token)) {
    return { ok: false, token, plan: null };
  }
  latestCanvasPaint.set(canvas, token);
  const paintLive = () =>
    isRenderTokenLive(token) && latestCanvasPaint.get(canvas) === token;

  const dna =
    request.dna ??
    getActiveHandwritingDNA() ??
    (request.profile ? profileToLightweightDna(request.profile) : null);

  if (!dna) {
    return { ok: false, token, plan: null };
  }

  const fontSize = Math.max(8, dna.profileHints.avgCharHeightPx * layoutScale);
  let families = [...dna.glyphs.faceFamilies.value];
  if (families.length === 0) {
    families = [dna.profileHints.fontFamily || 'Architects Daughter'];
  }
  if (glyphSelection === 'contextual') {
    families = [dna.profileHints.fontFamily || families[0]!];
  }

  let verified = await ensureHandwritingFonts(families, fontSize);
  if (!paintLive()) return { ok: false, token, plan: null };

  if (verified.length === 0) {
    selfHealRenderingEngine('no-verified-fonts');
    verified = await ensureHandwritingFonts(families, fontSize);
    if (!paintLive()) return { ok: false, token, plan: null };
  }
  if (verified.length === 0) {
    return { ok: false, token, plan: null };
  }
  families = families.filter((f) =>
    verified.some((v) => v.toLowerCase() === f.toLowerCase()),
  );
  if (families.length === 0) families = verified;

  const dpr = Math.min(
    2,
    (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
  );
  const ctx = resetCanvasSurface(canvas, widthPx, heightPx, dpr, fillContainer);
  if (!ctx || !paintLive()) {
    return { ok: false, token, plan: null };
  }

  if (!probeFontUsable(ctx, families[0]!, fontSize)) {
    selfHealRenderingEngine(`stale-font:${families[0]}`);
    verified = await ensureHandwritingFonts(families, fontSize);
    if (!paintLive() || verified.length === 0) {
      return { ok: false, token, plan: null };
    }
    families = verified;
  }

  const plan = buildProductionPaintPlan({
    dna,
    segments,
    widthPx,
    pageSalt,
    layoutScale,
    glyphSelection,
    fontSizePx: fontSize,
  });

  if (!paintLive()) return { ok: false, token, plan: null };

  executePagePaintPlan(ctx, plan);

  delete canvas.dataset.profileSeed;
  canvas.dataset.profileRevision = String(dna.seed >>> 0);
  canvas.dataset.renderToken = String(token);
  canvas.dataset.dnaDeterministic = '1';

  return { ok: true, token, plan };
}
