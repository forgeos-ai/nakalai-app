import type { CSSProperties } from 'react';
import type { InkColor, FontStyle, PaperType } from '../constants';
import type { PageSegment } from '../pagination';
import type { MatchedStyleOverrides } from '../pageGeometry';
import PreviewWatermark from './PreviewWatermark';
import VectorHandwritingCanvas from './VectorHandwritingCanvas';
import { useStrokeLayoutMetrics } from '../utils/useStrokeLayoutMetrics';
import { googleFontNameForClass } from '../utils/styleExtractor';
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
  fontSizePx?: number;
  isPaid?: boolean;
  matchedStyle?: MatchedStyleOverrides | null;
  layoutRevision?: number;
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
  fontSizePx = DEFAULT_FONT_SIZE_PX,
  isPaid = false,
  matchedStyle = null,
  layoutRevision = 0,
}: A4PageProps) {
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

  const pageStyle = {
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
  } as CSSProperties;

  return (
    <div
      data-a4-page
      data-paper-type={paperType.id}
      className="relative bg-white shadow-paper"
      style={pageStyle}
    >
      {showRuledLines && (
        <>
          {/* Horizontal blue notebook rules */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(
                to bottom,
                transparent calc(var(--rule-line-height) - 1px),
                #a4c8f0 calc(var(--rule-line-height) - 1px),
                #a4c8f0 var(--rule-line-height)
              )`,
              backgroundSize: `100% ${ruleLineHeight}px`,
              backgroundPosition: `0 ${PADDING_TOP_PX}px`,
              backgroundRepeat: 'repeat-y',
              opacity: 0.55,
            }}
            aria-hidden
          />

          {/* Pink vertical margin */}
          <div
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: `${MARGIN_LEFT_PX}px`,
              width: '1px',
              backgroundColor: '#f9a8d4',
              opacity: 0.75,
            }}
            aria-hidden
          />
        </>
      )}

      {noise > 0.02 && (
        <div
          className="pointer-events-none absolute inset-0"
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
        className="absolute overflow-hidden"
        style={{
          left: `${textLeft}px`,
          top: `${PADDING_TOP_PX}px`,
          width: `${textWidth}px`,
          height: `${textAreaHeightPx}px`,
          margin: 0,
          padding: 0,
        }}
      >
        <VectorHandwritingCanvas
          key={googleFontNameForClass(fontStyle.id)}
          segments={segments}
          inkHex={inkHex}
          fontStyle={fontStyle}
          fontSizePx={fontSizePx}
          layout={{
            ...layout,
            // Photo slant only — never bleed noise into character advance
            slantDegrees: slantBias,
          }}
          widthPx={textWidth}
          heightPx={textAreaHeightPx}
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
