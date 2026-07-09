import { memo } from 'react';
import { getCharJitter } from '../jitter';
import type { FontStyle } from '../constants';

type CharRendererProps = {
  char: string;
  globalIndex: number;
  color: string;
  fontStyle: FontStyle;
  fontSizePx: number;
};

/**
 * Renders a single character as an inline-block with deterministic jitter.
 * Stays inside the native text stream so the browser handles wrapping;
 * line-height is inherited from the ruled-paper wrapper (--rule-line-height).
 */
function CharRendererBase({
  char,
  globalIndex,
  color,
  fontStyle,
  fontSizePx,
}: CharRendererProps) {
  const jitter = getCharJitter(globalIndex);

  // Keep spaces visible inside inline-block without collapsing
  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <span
      className={`inline-block ${fontStyle.className}`}
      style={{
        color,
        fontSize: `${fontSizePx}px`,
        lineHeight: 'inherit',
        transform: `translateY(${jitter.translateY}px) rotate(${jitter.rotate}deg)`,
        marginRight: `${jitter.marginRight}px`,
        whiteSpace: 'pre',
      }}
    >
      {displayChar}
    </span>
  );
}

const CharRenderer = memo(CharRendererBase);
export default CharRenderer;
