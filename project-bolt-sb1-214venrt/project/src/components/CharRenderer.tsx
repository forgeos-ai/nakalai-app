import { memo } from 'react';
import { getCharJitter } from '../jitter';
import type { FontStyle } from '../constants';

type CharRendererProps = {
  char: string;
  globalIndex: number;
  color: string;
  fontStyle: FontStyle;
  fontSizePx: number;
  /** Baseline slant from Match My Writing Style (degrees). */
  slantBiasDegrees?: number;
  /** 0–1 photo grain — scales baseline / slant / word-gap chaos. */
  noiseIntensity?: number;
};

/**
 * Single glyph in the A4 drawing loop.
 * Micro-variance (baseline, slant noise, word-gap slack) is applied per
 * character so the live preview reads as human handwriting, not a rigid font.
 */
function CharRendererBase({
  char,
  globalIndex,
  color,
  fontStyle,
  fontSizePx,
  slantBiasDegrees = 0,
  noiseIntensity = 0,
}: CharRendererProps) {
  const isWordGap = char === ' ';
  const jitter = getCharJitter(globalIndex, {
    noiseIntensity,
    slantBiasDegrees,
    isWordGap,
  });
  const displayChar = isWordGap ? '\u00A0' : char;

  return (
    <span
      className={`inline-block ${fontStyle.className}`}
      style={{
        color,
        fontFamily: fontStyle.fontFamily,
        fontSize: `${fontSizePx}px`,
        lineHeight: 1,
        letterSpacing: 'inherit',
        transformOrigin: '50% 100%',
        transform: `translateY(${jitter.translateY}px) rotate(${jitter.rotate}deg)`,
        marginRight: `${jitter.marginRight}px`,
        whiteSpace: 'pre',
        verticalAlign: 'bottom',
      }}
    >
      {displayChar}
    </span>
  );
}

const CharRenderer = memo(CharRendererBase);
export default CharRenderer;
