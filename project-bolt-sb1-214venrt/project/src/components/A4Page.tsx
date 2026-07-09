import type { CSSProperties } from 'react';
import type { InkColor, FontStyle } from '../constants';
import type { PageSegment } from '../pagination';
import CharRenderer from './CharRenderer';
import PreviewWatermark from './PreviewWatermark';
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
  fontStyle: FontStyle;
  fontSizePx?: number;
};

/**
 * Ruled A4 sheet. Each paginated segment is one notebook row with
 * line-height locked to LINE_SPACING_PX so glyphs sit on the printed rules.
 * Paragraphs may split across pages; rows simply continue on the next sheet.
 */
export default function A4Page({
  segments,
  pageNumber,
  inkColor,
  fontStyle,
  fontSizePx = DEFAULT_FONT_SIZE_PX,
}: A4PageProps) {
  const textAreaHeightPx = MAX_LINES_PER_PAGE * LINE_SPACING_PX;

  return (
    <div
      data-a4-page
      className="relative shrink-0 bg-white shadow-paper"
      style={
        {
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          maxWidth: '100%',
          ['--rule-line-height']: `${LINE_SPACING_PX}px`,
        } as CSSProperties
      }
    >
      {/* Horizontal ruled lines — light blue, spaced at 8mm */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${LINE_SPACING_PX - 1}px,
            #a4c8f0 ${LINE_SPACING_PX - 1}px,
            #a4c8f0 ${LINE_SPACING_PX}px
          )`,
          backgroundPositionY: `${PADDING_TOP_PX - LINE_SPACING_PX}px`,
          opacity: 0.6,
        }}
      />

      {/* Pink left margin line at 30mm */}
      <div
        className="pointer-events-none absolute top-0 bottom-0"
        style={{
          left: `${MARGIN_LEFT_PX}px`,
          width: '1px',
          backgroundColor: '#f9a8d4',
          opacity: 0.75,
        }}
      />

      {/* One block row per paginated line — height === rule spacing */}
      <div
        className={`absolute overflow-hidden ${fontStyle.className}`}
        style={{
          left: `${TEXT_AREA_LEFT_PX}px`,
          top: `${PADDING_TOP_PX}px`,
          width: `${TEXT_AREA_WIDTH_PX}px`,
          height: `${textAreaHeightPx}px`,
          fontSize: `${fontSizePx}px`,
          lineHeight: 'var(--rule-line-height)',
        }}
      >
        {segments.map((segment, segmentIndex) => {
          if (segment.type === 'break') {
            return (
              <div
                key={`break-${segmentIndex}`}
                style={{
                  height: 'var(--rule-line-height)',
                  lineHeight: 'var(--rule-line-height)',
                }}
                aria-hidden
              />
            );
          }

          return (
            <div
              key={`line-${segmentIndex}`}
              style={{
                height: 'var(--rule-line-height)',
                lineHeight: 'var(--rule-line-height)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {segment.words.map((word, wordIndex) => (
                <span
                  key={`w-${segmentIndex}-${wordIndex}`}
                  className="inline-block"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {word.chars.map((rc, charIndex) => (
                    <CharRenderer
                      key={`c-${segmentIndex}-${wordIndex}-${charIndex}`}
                      char={rc.char}
                      globalIndex={rc.globalIndex}
                      color={inkColor.hex}
                      fontStyle={fontStyle}
                      fontSizePx={fontSizePx}
                    />
                  ))}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Preview-only watermark — stripped from PDF capture via data-pdf-ignore */}
      <PreviewWatermark />

      {/* Page number badge */}
      <div
        className="absolute bottom-3 right-4 z-10 select-none text-xs font-medium text-slate-400"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {pageNumber}
      </div>
    </div>
  );
}
