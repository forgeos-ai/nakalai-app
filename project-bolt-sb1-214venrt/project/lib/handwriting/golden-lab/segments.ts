/**
 * Text → PageSegment[] for golden lab (no full pagination import).
 */

import type { PageSegment } from '../../../src/pagination';

export function textToSegments(text: string): PageSegment[] {
  const lines = text.split('\n');
  const segments: PageSegment[] = [];
  let globalIndex = 0;

  for (let li = 0; li < lines.length; li++) {
    if (li > 0) segments.push({ type: 'break' });
    const words = lines[li]!.split(/(\s+)/).filter((w) => w.length > 0);
    const renderedWords = words.map((word) => ({
      chars: [...word].map((char) => ({
        char,
        globalIndex: globalIndex++,
      })),
    }));
    segments.push({ type: 'line', words: renderedWords });
  }

  return segments;
}
