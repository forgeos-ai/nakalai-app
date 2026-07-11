import { useEffect, useMemo, useRef } from 'react';
import type { PageSegment } from '../pagination';
import type { FontStyle } from '../constants';
import type { StrokeLayoutMetrics } from '../utils/strokeLayout';
import { googleFontNameForClass } from '../utils/styleExtractor';
import {
  TEXT_AREA_WIDTH_PX,
  LINE_SPACING_PX,
  DEFAULT_FONT_SIZE_PX,
  BASELINE_NUDGE_PX,
} from '../pageGeometry';

type VectorHandwritingCanvasProps = {
  segments: PageSegment[];
  inkHex: string;
  /** Manual dropdown / Match My Style — source of Google Font family. */
  fontStyle: FontStyle;
  fontSizePx?: number;
  layout: StrokeLayoutMetrics;
  widthPx?: number;
  heightPx: number;
};

/** Companion handwriting faces for poly-glyph alternation (loaded in index.html). */
const POLY_GLYPH_COMPANIONS = [
  'Architects Daughter',
  'Shadows Into Light',
] as const;

/**
 * Normalize any CSS stack or bare name to the exact Google Fonts family string.
 */
function resolveActiveFontFamily(fontStyle: FontStyle): string {
  const fromId = googleFontNameForClass(fontStyle.id);
  if (fromId) return fromId;
  const raw = fontStyle.fontFamily.split(',')[0]?.trim() ?? fontStyle.fontFamily;
  return raw.replace(/^["']|["']$/g, '');
}

/**
 * Build 3 stylistically related variants: active + two companions (deduped).
 */
function buildFontVariants(activeFontFamily: string): string[] {
  const variants = [activeFontFamily];
  for (const companion of POLY_GLYPH_COMPANIONS) {
    if (
      companion.toLowerCase() !== activeFontFamily.toLowerCase() &&
      !variants.some((v) => v.toLowerCase() === companion.toLowerCase())
    ) {
      variants.push(companion);
    }
  }
  // Ensure at least 3 slots when active already matches a companion
  while (variants.length < 3) {
    const fallback =
      variants.length === 1 ? 'Caveat' : 'Covered By Your Grace';
    if (!variants.some((v) => v.toLowerCase() === fallback.toLowerCase())) {
      variants.push(fallback);
    } else {
      break;
    }
  }
  return variants;
}

/**
 * Handwriting band with poly-glyph font alternation + micro-imperfections.
 */
export default function VectorHandwritingCanvas({
  segments,
  inkHex,
  fontStyle,
  fontSizePx = DEFAULT_FONT_SIZE_PX,
  layout,
  widthPx = TEXT_AREA_WIDTH_PX,
  heightPx,
}: VectorHandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeFontFamily = resolveActiveFontFamily(fontStyle);
  const fontVariants = useMemo(
    () => buildFontVariants(activeFontFamily),
    [activeFontFamily],
  );

  const trackingEmPx = fontStyle.layout.trackingEm * fontSizePx;
  const slantDegrees = layout.slantDegrees;
  const paintSizePx = fontSizePx || 24;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    const paint = () => {
      if (cancelled) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(widthPx * dpr);
      canvas.height = Math.round(heightPx * dpr);
      canvas.style.width = `${widthPx}px`;
      canvas.style.height = `${heightPx}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, widthPx, heightPx);

      const lineHeight = LINE_SPACING_PX * fontStyle.layout.lineSpaceScale;
      ctx.fillStyle = inkHex;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      let row = 0;

      for (const segment of segments) {
        const baselineY =
          row * lineHeight + lineHeight - BASELINE_NUDGE_PX;

        if (segment.type === 'break') {
          row += 1;
          continue;
        }

        let x = 0;

        for (let wi = 0; wi < segment.words.length; wi++) {
          const word = segment.words[wi];
          for (let ci = 0; ci < word.chars.length; ci++) {
            const rc = word.chars[ci];
            const char = rc.char;
            const finalX = x;
            const finalY = baselineY;
            const isWordGap = char === ' ';

            // Peek next glyph for contextual kerning (same word, else next word)
            let nextChar: string | undefined = word.chars[ci + 1]?.char;
            if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
              nextChar = segment.words[wi + 1].chars[0].char;
            }

            // Dynamically alternate font families so repeated letters look unique
            const charCodeSum = char.charCodeAt(0) + finalX + rc.globalIndex;
            const targetFontVariant =
              fontVariants[
                Math.abs(Math.floor(charCodeSum)) % fontVariants.length
              ];

            ctx.font = `${paintSizePx}px "${targetFontVariant}", cursive, sans-serif`;

            // Safe, additive character tracking refinement based on letter context
            let contextualKerning = 0;
            if (char !== ' ' && nextChar && nextChar !== ' ') {
              // Naturally tighten common double-letter pairs slightly
              if (char.toLowerCase() === nextChar.toLowerCase()) {
                contextualKerning = -0.6; // Micro-pull for 'pp', 'll', etc.
              } else if (['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase())) {
                contextualKerning = 0.3; // Subtle breathing room after vowels
              }
            }

            // Base advance + word-gap slack + contextual kerning
            let advance =
              ctx.measureText(char).width + trackingEmPx + contextualKerning;
            if (isWordGap) {
              advance += (Math.random() - 0.35) * 2.4;
            }

            ctx.save();

            // Structural slant jitter (±0.7° wrist shift on extracted slant)
            const localSlantOffset = (Math.random() - 0.5) * 1.4;
            const radians =
              ((slantDegrees + localSlantOffset) * Math.PI) / 180;

            // Baseline drift (±0.75px)
            const verticalDrift = (Math.random() - 0.5) * 1.5;

            // Ink density / pen pressure (91%–100%)
            ctx.globalAlpha = 0.91 + Math.random() * 0.09;

            ctx.translate(finalX, finalY + verticalDrift);
            ctx.rotate(radians);

            // Simulate micro ink bleed into paper fibers
            ctx.shadowColor = inkHex || '#000000';
            ctx.shadowBlur = 0.3 + Math.random() * 0.4;

            ctx.fillText(char, 0, 0);

            ctx.restore();

            x += advance;

            if (x > widthPx + paintSizePx) break;
          }
        }

        row += 1;
      }
    };

    // Preload all poly-glyph variants before paint
    const fontsApi = document.fonts;
    const loadAll = fontVariants.map((family) =>
      fontsApi?.load
        ? fontsApi.load(`${paintSizePx}px "${family}"`)
        : Promise.resolve(),
    );

    Promise.all(loadAll)
      .then(() => fontsApi?.ready ?? Promise.resolve())
      .then(() => {
        if (!cancelled) paint();
      })
      .catch(() => {
        if (!cancelled) paint();
      });

    return () => {
      cancelled = true;
    };
  }, [
    segments,
    inkHex,
    activeFontFamily,
    fontVariants,
    paintSizePx,
    trackingEmPx,
    slantDegrees,
    fontStyle.layout.lineSpaceScale,
    widthPx,
    heightPx,
  ]);

  return (
    <canvas
      key={activeFontFamily}
      ref={canvasRef}
      className="absolute left-0 top-0 block"
      style={{ width: widthPx, height: heightPx }}
      aria-hidden
    />
  );
}
