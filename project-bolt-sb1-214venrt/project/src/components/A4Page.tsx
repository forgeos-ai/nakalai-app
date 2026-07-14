import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { InkColor, FontStyle, PaperType } from '../constants';
import { isDisconnectedPrintStyle } from '../constants';
import type { PageSegment } from '../pagination';
import type { MatchedStyleOverrides } from '../pageGeometry';
import PreviewWatermark from './PreviewWatermark';
import VectorHandwritingCanvas from './VectorHandwritingCanvas';
import { useStrokeLayoutMetrics } from '../utils/useStrokeLayoutMetrics';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  MARGIN_LEFT_PX,
  LINE_SPACING_PX,
  PADDING_TOP_PX,
  TEXT_AREA_LEFT_PX,
  TEXT_AREA_WIDTH_PX,
  DEFAULT_FONT_SIZE_PX,
  MAX_LINES_PER_PAGE,
} from '../pageGeometry';

type A4PageProps = {
  segments: PageSegment[];
  pageNumber: number;
  inkColor: InkColor;
  paperType: PaperType;
  fontStyle: FontStyle;
  /** Exact Google Font from Match My Style image analysis. */
  matchedFontFamily: string;
  fontSizePx?: number;
  isPaid?: boolean;
  matchedStyle?: MatchedStyleOverrides | null;
  layoutRevision?: number;
  paintRevision?: number;
  /** Mobile — page fills container width; inner layout uses relative units. */
  fluidWidth?: boolean;
};

/**
 * A4 sheet. Ruled blue lines + pink margin only when paperType is
 * "Ruled Notebook"; Plain / Blank / Grid stay clean white.
 */
export default function A4Page({
  segments,
  pageNumber,
  inkColor,
  paperType,
  fontStyle,
  matchedFontFamily,
  fontSizePx = DEFAULT_FONT_SIZE_PX,
  isPaid = false,
  matchedStyle = null,
  layoutRevision = 0,
  paintRevision = 0,
  fluidWidth = false,
}: A4PageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [fluidPageWidth, setFluidPageWidth] = useState(A4_WIDTH_PX);

  useEffect(() => {
    if (!fluidWidth || !pageRef.current) return;
    const node = pageRef.current;
    const sync = (w: number) => {
      if (w > 0) setFluidPageWidth(w);
    };
    sync(node.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) sync(box.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [fluidWidth]);

  const layout = useStrokeLayoutMetrics(
    matchedStyle,
    layoutRevision,
    fontStyle,
  );
  const textAreaHeightPx =
    MAX_LINES_PER_PAGE * LINE_SPACING_PX * layout.lineHeightScale;
  const inkHex = matchedStyle?.inkHex ?? inkColor.hex;
  const slantBias = matchedStyle?.slantDegrees ?? layout.slantDegrees;
  const noise = matchedStyle?.noiseIntensity ?? layout.baselineJitter * 0.5;
  const ruleLineHeight = LINE_SPACING_PX * layout.lineHeightScale;
  const textLeft =
    TEXT_AREA_LEFT_PX +
    (layout.marginScale - 1) * (MARGIN_LEFT_PX * 0.35);
  const textWidth = Math.max(
    200,
    TEXT_AREA_WIDTH_PX - (textLeft - TEXT_AREA_LEFT_PX) * 1.2,
  );

  const showRuledLines =
    paperType.id === 'ruled' ||
    paperType.label === 'Ruled Notebook';

  /**
   * Fluid pages shrink via CSS width/aspect-ratio. Rule overlays must use
   * container-scaled *pixel* metrics — gradient color-stop % relative to a
   * percentage tile dissolves lines on mobile WebKit.
   */
  const fluidScale = fluidWidth
    ? Math.max(0.01, fluidPageWidth / A4_WIDTH_PX)
    : 1;
  const scaledRulePx = ruleLineHeight * fluidScale;
  const scaledPadTopPx = PADDING_TOP_PX * fluidScale;
  const scaledMarginLeftPx = MARGIN_LEFT_PX * fluidScale;

  const pageStyle = fluidWidth
    ? ({
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}`,
        flexShrink: 0,
        ['--rule-line-height' as string]: `${scaledRulePx}px`,
        ['--handwriting-size' as string]: `${fontSizePx}px`,
        ['--handwriting-tracking' as string]: `${layout.trackingEm}em`,
        ['--handwriting-font' as string]: fontStyle.fontFamily,
        ['--matched-slant' as string]: `${slantBias}deg`,
        ['--paper-noise' as string]: String(noise),
        ['--stroke-weight' as string]: String(layout.strokeWeight),
        ['--baseline-jitter' as string]: String(layout.baselineJitter),
        ['--margin-scale' as string]: String(layout.marginScale),
      } as CSSProperties)
    : ({
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        flexShrink: 0,
        ['--rule-line-height' as string]: `${ruleLineHeight}px`,
        ['--handwriting-size' as string]: `${fontSizePx}px`,
        ['--handwriting-tracking' as string]: `${layout.trackingEm}em`,
        ['--handwriting-font' as string]: fontStyle.fontFamily,
        ['--matched-slant' as string]: `${slantBias}deg`,
        ['--paper-noise' as string]: String(noise),
        ['--stroke-weight' as string]: String(layout.strokeWeight),
        ['--baseline-jitter' as string]: String(layout.baselineJitter),
        ['--margin-scale' as string]: String(layout.marginScale),
      } as CSSProperties);

  const textSurfaceStyle: CSSProperties = fluidWidth
    ? {
        left: `${(textLeft / A4_WIDTH_PX) * 100}%`,
        top: `${(PADDING_TOP_PX / A4_HEIGHT_PX) * 100}%`,
        width: `${(textWidth / A4_WIDTH_PX) * 100}%`,
        height: `${(textAreaHeightPx / A4_HEIGHT_PX) * 100}%`,
        margin: 0,
        padding: 0,
        textTransform: 'none',
        fontVariant: 'normal',
        fontFamily: isDisconnectedPrintStyle(
          matchedStyle?.fontClass ?? fontStyle.id,
          matchedStyle?.fontCategory,
        )
          ? "'Playpen Sans'"
          : "'Dancing Script'",
      }
    : {
        left: `${textLeft}px`,
        top: `${PADDING_TOP_PX}px`,
        width: `${textWidth}px`,
        height: `${textAreaHeightPx}px`,
        margin: 0,
        padding: 0,
        textTransform: 'none',
        fontVariant: 'normal',
        fontFamily: isDisconnectedPrintStyle(
          matchedStyle?.fontClass ?? fontStyle.id,
          matchedStyle?.fontCategory,
        )
          ? "'Playpen Sans'"
          : "'Dancing Script'",
      };

  return (
    <div
      ref={pageRef}
      data-a4-page
      data-paper-type={paperType.id}
      className={`relative bg-white shadow-paper ${fluidWidth ? 'w-full max-w-full' : ''}`}
      style={pageStyle}
    >
      {showRuledLines && (
        <>
          {/* Horizontal blue notebook rules — always use px tile metrics */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `linear-gradient(
                to bottom,
                transparent calc(var(--rule-line-height) - 1px),
                #a4c8f0 calc(var(--rule-line-height) - 1px),
                #a4c8f0 var(--rule-line-height)
              )`,
              backgroundSize: `100% ${fluidWidth ? scaledRulePx : ruleLineHeight}px`,
              backgroundPosition: `0 ${fluidWidth ? scaledPadTopPx : PADDING_TOP_PX}px`,
              backgroundRepeat: 'repeat-y',
              opacity: 0.55,
            }}
            aria-hidden
          />

          {/* Pink vertical margin */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-0"
            style={{
              left: `${fluidWidth ? scaledMarginLeftPx : MARGIN_LEFT_PX}px`,
              width: Math.max(1, fluidScale),
              backgroundColor: '#f9a8d4',
              opacity: 0.75,
            }}
            aria-hidden
          />
        </>
      )}

      {noise > 0.02 && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            opacity: Math.min(0.35, noise * 0.9),
            mixBlendMode: 'multiply',
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(40,30,20,0.12) 0.5px, transparent 1px),
              radial-gradient(circle at 70% 60%, rgba(30,25,15,0.1) 0.6px, transparent 1.2px),
              radial-gradient(circle at 40% 80%, rgba(50,40,30,0.08) 0.4px, transparent 1px)
            `,
            backgroundSize: '6px 6px, 9px 9px, 7px 7px',
          }}
          aria-hidden
        />
      )}

      <div
        className="absolute z-[1] overflow-hidden"
        data-handwriting-surface="true"
        style={textSurfaceStyle}
      >
        <VectorHandwritingCanvas
          key={`hw-${matchedFontFamily}-${paintRevision}-${layoutRevision}-${inkHex}`}
          segments={segments}
          inkHex={inkHex}
          fontStyle={fontStyle}
          matchedFontFamily={matchedFontFamily}
          fontSizePx={fontSizePx}
          paintRevision={paintRevision}
          matchedStyle={matchedStyle}
          pageNumber={pageNumber}
          layout={{
            ...layout,
            slantDegrees: isDisconnectedPrintStyle(
              matchedStyle?.fontClass ?? fontStyle.id,
              matchedStyle?.fontCategory,
            )
              ? Math.min(Math.abs(slantBias), 2)
              : slantBias,
          }}
          widthPx={textWidth}
          heightPx={textAreaHeightPx}
          fillContainer={fluidWidth}
        />
      </div>

      {!isPaid && <PreviewWatermark />}

      <div
        className="absolute bottom-3 right-4 z-10 select-none text-xs font-medium text-slate-400"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {pageNumber}
      </div>
    </div>
  );
}
