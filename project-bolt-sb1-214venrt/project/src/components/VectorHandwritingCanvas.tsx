import { useEffect, useRef, useState } from 'react';
import type { PageSegment } from '../pagination';
import type { FontStyle } from '../constants';
import {
  HANDWRITING_GLYPH_SAMPLE,
  isDisconnectedPrintStyle,
} from '../constants';
import type { StrokeLayoutMetrics } from '../utils/strokeLayout';
import {
  TEXT_AREA_WIDTH_PX,
  LINE_SPACING_PX,
  DEFAULT_FONT_SIZE_PX,
  BASELINE_NUDGE_PX,
} from '../pageGeometry';
import {
  CUSTOM_PATCH_TRACKING_CUSHION_PX,
  drawCustomStylePatch,
  getCustomStyleMap,
  getCustomStyleRevision,
  isCustomStyleActive,
} from '../utils/customStyleMap';

type VectorHandwritingCanvasProps = {
  segments: PageSegment[];
  inkHex: string;
  fontStyle: FontStyle;
  /** Analysis hint — remapped to permanent Dancing Script / Playpen Sans layer. */
  matchedFontFamily: string;
  fontSizePx?: number;
  layout: StrokeLayoutMetrics;
  widthPx?: number;
  heightPx: number;
  paintRevision?: number;
  /** Size canvas to parent box (mobile fluid A4 text area). */
  fillContainer?: boolean;
};

/** Module-level lock — survives component remounts after image uploads. */
let fontsLockPromise: Promise<void> | null = null;

/**
 * Strict FontFace guard — re-loads both baked families into the document font set
 * so uploads / remounts cannot evict them into system fallbacks.
 */
async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return;
  }

  if (!fontsLockPromise) {
    fontsLockPromise = (async () => {
      await document.fonts.load('16px "Dancing Script"', HANDWRITING_GLYPH_SAMPLE);
      await document.fonts.load('16px "Playpen Sans"', HANDWRITING_GLYPH_SAMPLE);
      // Also pin the paint-size descriptors used by ctx.font
      await document.fonts.load(
        '400 24px "Dancing Script"',
        HANDWRITING_GLYPH_SAMPLE,
      );
      await document.fonts.load(
        '400 24px "Playpen Sans"',
        HANDWRITING_GLYPH_SAMPLE,
      );
      await document.fonts.ready;
    })().catch((err) => {
      // Allow a single retry on the next paint if the first lock fails
      fontsLockPromise = null;
      throw err;
    });
  }

  await fontsLockPromise;
}

/**
 * Permanent mapping: cursive match → Dancing Script, else → Playpen Sans.
 * Defaults to cursive so uploads never drop to a system block face.
 */
function resolveCursiveMatch(
  fontStyle: FontStyle,
  matchedFontFamily: string,
): boolean {
  const hint = `${matchedFontFamily} ${fontStyle.id} ${fontStyle.bucket}`.toLowerCase();
  const isPrint =
    isDisconnectedPrintStyle(fontStyle.id, fontStyle.bucket) ||
    hint.includes('print') ||
    hint.includes('playpen') ||
    hint.includes('block') ||
    hint.includes('marker');
  return !isPrint;
}

/**
 * Production canvas — font assets locked via ensureFontsLoaded() before any fillText.
 */
export default function VectorHandwritingCanvas({
  segments,
  inkHex,
  fontStyle,
  matchedFontFamily,
  fontSizePx = DEFAULT_FONT_SIZE_PX,
  layout,
  widthPx = TEXT_AREA_WIDTH_PX,
  heightPx,
  paintRevision = 0,
  fillContainer = false,
}: VectorHandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    if (!fillContainer || !shellRef.current) return;
    const node = shellRef.current;
    const sync = (width: number, height: number) => {
      if (width > 0 && height > 0) {
        setContainerSize({ w: Math.round(width), h: Math.round(height) });
      }
    };
    sync(node.clientWidth, node.clientHeight);
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) sync(box.width, box.height);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [fillContainer]);

  const designWidth = widthPx;
  const designHeight = heightPx;
  const renderWidth =
    fillContainer && containerSize ? containerSize.w : designWidth;
  const renderHeight =
    fillContainer && containerSize ? containerSize.h : designHeight;
  const layoutScale =
    fillContainer && containerSize ? containerSize.w / designWidth : 1;

  const isCursiveMatch = resolveCursiveMatch(fontStyle, matchedFontFamily);
  const fontSize = (fontSizePx || 24) * layoutScale;
  const trackingEmPx = fontStyle.layout.trackingEm * fontSize;
  const slantDegrees = isCursiveMatch
    ? layout.slantDegrees
    : Math.min(Math.abs(layout.slantDegrees), 2);
  const lineSpaceScale = fontStyle.layout.lineSpaceScale;
  const familyName = isCursiveMatch ? 'Dancing Script' : 'Playpen Sans';
  const lockedFont = isCursiveMatch
    ? '400 24px "Dancing Script"'
    : '400 24px "Playpen Sans"';
  // Prefer explicit 24px lock string; scale only when fontSize differs meaningfully
  const paintFont =
    Math.abs(fontSize - 24) < 0.5
      ? lockedFont
      : isCursiveMatch
        ? `400 ${fontSize}px "Dancing Script"`
        : `400 ${fontSize}px "Playpen Sans"`;
  const customStyleRevision = getCustomStyleRevision();
  const patchMode = isCustomStyleActive();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    const runCoreCanvasDrawing = async () => {
      // 1) Lock fonts in memory before any measureText / fillText
      await ensureFontsLoaded();
      if (cancelled) return;

      // 2) Flush texture memory, then size the buffer for this paint
      // Assignment to self clears the backing store per HTML canvas spec
      // eslint-disable-next-line no-self-assign
      canvas.width = canvas.width;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(renderWidth * dpr);
      canvas.height = Math.round(renderHeight * dpr);
      canvas.style.width = fillContainer ? '100%' : `${renderWidth}px`;
      canvas.style.height = fillContainer ? '100%' : `${renderHeight}px`;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, renderWidth, renderHeight);

      const lineHeight = LINE_SPACING_PX * lineSpaceScale * layoutScale;
      const customStyleMap = patchMode ? getCustomStyleMap() : null;
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
            const isWordGap = char === ' ';

            let nextChar: string | undefined = word.chars[ci + 1]?.char;
            if (nextChar == null && segment.words[wi + 1]?.chars[0]) {
              nextChar = segment.words[wi + 1].chars[0].char;
            }

            // Measure + draw under the locked face
            ctx.save();
            ctx.font = paintFont;
            let contextualKerning = 0;
            if (char !== ' ' && nextChar && nextChar !== ' ') {
              if (!isCursiveMatch) {
                contextualKerning = 0.35;
              } else if (char.toLowerCase() === nextChar.toLowerCase()) {
                contextualKerning = -0.6;
              } else if (
                ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase())
              ) {
                contextualKerning = 0.3;
              }
            }

            const hasPatch =
              Boolean(customStyleMap) &&
              !isWordGap &&
              customStyleMap!.has(char) &&
              !!customStyleMap!.get(char);

            let charWidth: number | undefined;
            let usedPatch = false;

            const localSlantOffset = isCursiveMatch
              ? (Math.random() - 0.5) * 1.4
              : (Math.random() - 0.5) * 0.4;
            const radians =
              ((slantDegrees + localSlantOffset) * Math.PI) / 180;
            const verticalDrift =
              (Math.random() - 0.5) * (isCursiveMatch ? 1.5 : 0.9);

            ctx.globalAlpha = 0.91 + Math.random() * 0.09;
            ctx.translate(x, baselineY + verticalDrift);
            ctx.rotate(radians);
            ctx.shadowColor = inkHex || '#000000';
            ctx.shadowBlur = 0.25 + Math.random() * 0.3;
            ctx.fillStyle = inkHex;
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.font = paintFont;

            if (hasPatch) {
              const patch = customStyleMap!.get(char)!;
              // Require real canvas structure before bypassing fillText
              if (
                patch.width > 2 &&
                patch.height > 2 &&
                typeof patch.getContext === 'function'
              ) {
                const drawn = drawCustomStylePatch(
                  ctx,
                  patch,
                  char,
                  fontSize,
                );
                if (
                  Number.isFinite(drawn.width) &&
                  drawn.width > 2 &&
                  Number.isFinite(drawn.height) &&
                  drawn.height > 2
                ) {
                  charWidth = drawn.width;
                  usedPatch = true;
                }
              }
            }

            if (!usedPatch) {
              ctx.font = paintFont;
              ctx.fillStyle = inkHex;
              ctx.textBaseline = 'alphabetic';
              ctx.textAlign = 'left';
              ctx.fillText(char, 0, 0);
            }

            ctx.restore();

            // Re-assert baseline measurement parameters explicitly
            ctx.font = paintFont;
            const contextTextWidth = ctx.measureText(char).width;
            const stableFallbackWidth =
              contextTextWidth &&
              !isNaN(contextTextWidth) &&
              contextTextWidth > 0
                ? contextTextWidth
                : fontSize * 0.55;

            // Calculate a bulletproof character width value
            const safeAdvanceWidth =
              typeof charWidth === 'undefined' ||
              isNaN(charWidth) ||
              charWidth <= 2
                ? stableFallbackWidth
                : charWidth;

            // Generate rigid layout padding
            const spacing =
              trackingEmPx +
              (usedPatch ? CUSTOM_PATCH_TRACKING_CUSHION_PX : 0) +
              contextualKerning;

            let advance = safeAdvanceWidth + spacing;

            // Force physical progression bounds to prevent character overlapping
            if (!Number.isFinite(advance) || advance <= 3) {
              advance = stableFallbackWidth + Math.max(0, spacing);
            }

            if (isWordGap) {
              advance +=
                (Math.random() - 0.35) * (isCursiveMatch ? 2.4 : 1.6);
            }

            // Ensure physical space cannot collapse
            x += Math.max(4, advance);
            if (x > renderWidth + fontSize) break;
          }
        }

        row += 1;
      }
    };

    void (async () => {
      try {
        await ensureFontsLoaded();
        if (cancelled) return;
        await runCoreCanvasDrawing();
      } catch (err) {
        console.warn('[NakalAI] Font lock / canvas paint failed:', err);
        // One retry after clearing the module lock
        fontsLockPromise = null;
        if (!cancelled) {
          try {
            await ensureFontsLoaded();
            if (!cancelled) await runCoreCanvasDrawing();
          } catch (retryErr) {
            console.warn('[NakalAI] Font lock retry failed:', retryErr);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    segments,
    inkHex,
    isCursiveMatch,
    fontSize,
    paintFont,
    trackingEmPx,
    slantDegrees,
    lineSpaceScale,
    widthPx,
    heightPx,
    renderWidth,
    renderHeight,
    layoutScale,
    paintRevision,
    customStyleRevision,
    patchMode,
  ]);

  const canvasEl = (
    <canvas
      ref={canvasRef}
      className={
        fillContainer
          ? 'block h-full w-full max-w-full object-contain'
          : 'absolute left-0 top-0 block'
      }
      style={
        fillContainer
          ? {
              textTransform: 'none',
              fontVariant: 'normal',
              fontFamily: isCursiveMatch
                ? '"Dancing Script"'
                : '"Playpen Sans"',
            }
          : {
              width: renderWidth,
              height: renderHeight,
              textTransform: 'none',
              fontVariant: 'normal',
              fontFamily: isCursiveMatch
                ? '"Dancing Script"'
                : '"Playpen Sans"',
            }
      }
      aria-hidden
      data-matched-font={familyName}
      data-handwriting-surface="true"
      data-paint-revision={paintRevision}
      data-patch-revision={customStyleRevision}
    />
  );

  if (fillContainer) {
    return (
      <div
        ref={shellRef}
        className="absolute inset-0 h-full w-full max-w-full overflow-hidden"
      >
        {canvasEl}
      </div>
    );
  }

  return canvasEl;
}
