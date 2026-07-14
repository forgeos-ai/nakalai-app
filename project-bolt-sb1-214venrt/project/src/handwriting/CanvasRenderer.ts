/**
 * CanvasRenderer — paints assignment text from a HandwritingProfile only.
 * Never reads uploaded images. Supports render tokens + canvas surface reset.
 */

import type { PageSegment } from '../pagination';
import {
  LINE_SPACING_PX,
  BASELINE_NUDGE_PX,
} from '../pageGeometry';
import type { HandwritingProfile } from './HandwritingProfile';
import {
  createVariationEngine,
  seededWordGapPx,
} from './VariationEngine';
import {
  ensureHandwritingFonts,
  probeFontUsable,
} from './FontRegistry';
import {
  acquireRenderToken,
  isRenderTokenLive,
  resetCanvasSurface,
  selfHealRenderingEngine,
} from './RenderLifecycle';

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

const CURSIVE_COMPANIONS = [
  'Dancing Script',
  'Great Vibes',
  'Caveat',
] as const;

const PRINT_COMPANIONS = [
  'Playpen Sans',
  'Architects Daughter',
  'Shadows Into Light',
] as const;

/** Latest paint per canvas; prevents older async font loads repainting over it. */
const latestCanvasPaint = new WeakMap<HTMLCanvasElement, number>();

function buildFamilyList(profile: HandwritingProfile): string[] {
  const primary = profile.fontFamily || 'Architects Daughter';
  const companions = profile.isCursive ? CURSIVE_COMPANIONS : PRINT_COMPANIONS;
  const out = [primary];
  for (const c of companions) {
    if (c.toLowerCase() !== primary.toLowerCase()) out.push(c);
  }
  return out.slice(0, 3);
}

function isLetter(char: string | undefined): boolean {
  return Boolean(char && /^[A-Za-z]$/.test(char));
}

function verticalProportionForChar(
  char: string,
  profile: HandwritingProfile,
): number {
  if (/[bdfhkltA-Z]/.test(char)) return profile.ascenderScale;
  if (/[gjpqy]/.test(char)) return profile.descenderScale;
  return 1;
}

/**
 * Core deterministic paint — aborted if renderToken is superseded.
 */
export async function renderHandwritingToCanvas(
  request: CanvasRenderRequest,
): Promise<{ ok: boolean; token: number }> {
  const {
    canvas,
    segments,
    profile,
    widthPx,
    heightPx,
    fillContainer = false,
    layoutScale = 1,
    pageSalt = 0,
  } = request;

  const token = request.renderToken ?? acquireRenderToken();
  if (!isRenderTokenLive(token)) {
    return { ok: false, token };
  }
  latestCanvasPaint.set(canvas, token);
  const paintLive = () =>
    isRenderTokenLive(token) && latestCanvasPaint.get(canvas) === token;

  const fontSize = Math.max(8, profile.avgCharHeightPx * layoutScale);
  let families = buildFamilyList(profile);

  let verified = await ensureHandwritingFonts(families, fontSize);
  if (!paintLive()) return { ok: false, token };

  if (verified.length === 0) {
    selfHealRenderingEngine('no-verified-fonts');
    verified = await ensureHandwritingFonts(families, fontSize);
    if (!paintLive()) return { ok: false, token };
  }

  // Never let canvas silently substitute a browser generic font.
  if (verified.length === 0) {
    return { ok: false, token };
  }
  families = verified;

  const dpr = Math.min(
    2,
    (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
  );

  const ctx = resetCanvasSurface(
    canvas,
    widthPx,
    heightPx,
    dpr,
    fillContainer,
  );
  if (!ctx || !paintLive()) {
    return { ok: false, token };
  }

  // Self-heal if primary face still probes bad after load
  if (!probeFontUsable(ctx, families[0]!, fontSize)) {
    selfHealRenderingEngine(`stale-font:${families[0]}`);
    verified = await ensureHandwritingFonts(buildFamilyList(profile), fontSize);
    if (!paintLive()) return { ok: false, token };
    if (verified.length === 0) return { ok: false, token };
    families = verified;
  }
  if (families.length === 0) return { ok: false, token };

  const variation = createVariationEngine(profile, pageSalt);
  const trackingEmPx = profile.trackingEm * fontSize;
  const lineHeight =
    LINE_SPACING_PX * profile.lineSpacingScale * layoutScale;
  const inkHex = profile.inkHex;

  let row = 0;
  let globalIndex = 0;

  for (const segment of segments) {
    if (!paintLive()) return { ok: false, token };

    const baselineY = row * lineHeight + lineHeight - BASELINE_NUDGE_PX;
    const lineVariation = variation.forLine(row, fontSize);

    if (segment.type === 'break') {
      row += 1;
      continue;
    }

    let x =
      lineVariation.marginOffsetPx +
      (profile.marginBias - 1) * fontSize * 1.4;

    for (let wi = 0; wi < segment.words.length; wi++) {
      const word = segment.words[wi];
      for (let ci = 0; ci < word.chars.length; ci++) {
        if (!paintLive()) return { ok: false, token };

        const rc = word.chars[ci];
        const char = rc.char;
        const isWordGap = char === ' ';
        const charCode = char.charCodeAt(0) || 32;
        const glyphIndex = rc.globalIndex ?? globalIndex;
        globalIndex += 1;

        let nextChar: string | undefined = word.chars[ci + 1]?.char;
        if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
          nextChar = segment.words[wi + 1].chars[0].char;
        }

        const v = variation.forGlyph(glyphIndex, charCode);
        // A single face preserves writer identity. Mixing font families per
        // glyph made different samples converge into the same visual blend.
        const family = families[0]!;
        const paintFont = `400 ${fontSize}px "${family}"`;

        let contextualKerning = 0;
        if (char !== ' ' && nextChar && nextChar !== ' ') {
          if (!profile.isCursive) {
            contextualKerning = 0.35;
          } else if (char.toLowerCase() === nextChar.toLowerCase()) {
            contextualKerning =
              -0.6 - profile.connectedLetterBehavior * fontSize * 0.025;
          } else if (['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase())) {
            contextualKerning =
              0.3 - profile.connectedLetterBehavior * fontSize * 0.018;
          } else {
            contextualKerning =
              -profile.connectedLetterBehavior * fontSize * 0.012;
          }
        }

        const slowBaseline =
          Math.sin(glyphIndex * 0.34 + lineVariation.baselinePhase) *
          profile.baselineDrift *
          fontSize *
          0.045 *
          profile.matchStrength;
        const glyphBaseline =
          baselineY + v.baselineWobblePx + slowBaseline;
        const proportionScale = verticalProportionForChar(char, profile);
        const scaleY =
          v.scaleY * proportionScale * lineVariation.heightScale;
        const slantRadians =
          (-(profile.slantDegrees +
            (profile.isCursive ? profile.writingSpeed * 1.5 : 0)) *
            Math.PI) /
          180;

        ctx.save();
        ctx.font = paintFont;
        ctx.globalAlpha = v.alpha;
        ctx.translate(x, glyphBaseline);
        ctx.rotate((v.rotationDeg * Math.PI) / 180);
        // Slant changes glyph posture without rotating its baseline.
        ctx.transform(1, 0, Math.tan(slantRadians), 1, 0, 0);
        ctx.scale(v.scaleX, scaleY);
        ctx.fillStyle = inkHex;
        ctx.strokeStyle = inkHex;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(
          0.12,
          (v.strokeThickness - 0.55) * 0.42,
        );
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        if (ctx.lineWidth > 0.14) {
          ctx.strokeText(char, 0, 0);
        }
        ctx.fillText(char, 0, 0);

        // A faint displaced pass simulates paper/pen drag while preserving
        // legibility. Offsets are deterministic for this glyph.
        if (profile.strokeRoughness > 0.08 && char !== ' ') {
          ctx.globalAlpha =
            v.alpha * Math.min(0.2, profile.strokeRoughness * 0.22);
          ctx.fillText(char, v.roughOffsetX, v.roughOffsetY);
        }
        ctx.restore();

        ctx.font = paintFont;
        const measured = ctx.measureText(char).width;
        const baseWidth =
          Number.isFinite(measured) && measured > 0
            ? measured
            : fontSize * 0.55;

        let advance =
          baseWidth * v.scaleX +
          trackingEmPx +
          contextualKerning +
          v.spacingPx;

        if (isWordGap) {
          advance +=
            fontSize * profile.wordSpacingEm +
            seededWordGapPx(profile, wi);
        }

        if (!Number.isFinite(advance) || advance <= 0) {
          advance = baseWidth + Math.max(0, trackingEmPx);
        }

        const safeAdvance = Math.max(fontSize * 0.12, advance);

        // Profile-driven entry/exit strokes make cursive connectivity
        // perceptible even when the selected font's native joins are subtle.
        if (
          char !== ' ' &&
          isLetter(char) &&
          isLetter(nextChar) &&
          variation.shouldConnect(
            glyphIndex,
            charCode,
            nextChar!.charCodeAt(0),
          )
        ) {
          const startX = x + Math.min(baseWidth * v.scaleX * 0.72, safeAdvance * 0.7);
          const endX = x + safeAdvance + fontSize * 0.04;
          const rise =
            fontSize *
            0.075 *
            profile.entryExitCurvature *
            v.connectorCurve;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(startX, glyphBaseline - fontSize * 0.035);
          ctx.bezierCurveTo(
            startX + (endX - startX) * 0.32,
            glyphBaseline - rise,
            startX + (endX - startX) * 0.72,
            glyphBaseline + rise * 0.35,
            endX,
            glyphBaseline,
          );
          ctx.strokeStyle = inkHex;
          ctx.globalAlpha = Math.max(0.58, v.alpha * 0.86);
          ctx.lineWidth = Math.max(0.45, v.strokeThickness * 0.38);
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        x += safeAdvance;
        if (x > widthPx + fontSize) break;
      }
    }

    row += 1;
  }

  if (!paintLive()) return { ok: false, token };

  canvas.dataset.profileSeed = String(profile.seed);
  canvas.dataset.profileRevision = String(profile.revision);
  canvas.dataset.renderToken = String(token);

  return { ok: true, token };
}
