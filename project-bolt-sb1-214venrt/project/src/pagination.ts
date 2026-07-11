import {
  MAX_LINES_PER_PAGE,
  TEXT_WRAP_WIDTH_PX,
  DEFAULT_FONT_SIZE_PX,
  LINE_SPACING_PX,
} from './pageGeometry';
import type { FontStyle } from './constants';

/** A single character with its global index for deterministic jitter. */
export type RenderedChar = {
  char: string;
  globalIndex: number;
};

/** A word token kept together on a line (trailing spaces included). */
export type RenderedWord = {
  chars: RenderedChar[];
};

/**
 * Page content is a sequence of ruled rows:
 * - `line`: one notebook row of words (may be empty for a blank row)
 * - Paragraph splits across pages by emitting lines independently
 */
export type PageSegment =
  | { type: 'line'; words: RenderedWord[] }
  | { type: 'break' };

export type Page = {
  segments: PageSegment[];
  pageNumber: number;
};

/**
 * Maps a font style id to a CSS font string usable by CanvasRenderingContext2D.
 */
function getCanvasFont(fontStyle: FontStyle, fontSizePx: number): string {
  // Prefer explicit fontFamily from typography config (Match My Style classes)
  const family = fontStyle.fontFamily || 'Caveat, cursive';
  return `${fontSizePx}px ${family}`;
}

/**
 * Splits a paragraph into word tokens (each with trailing spaces).
 * Characters are tagged with globalIndex for stable jitter.
 */
function tokenizeParagraph(
  paragraph: string,
  globalStartIndex: number,
): RenderedWord[] {
  const tokens: RenderedWord[] = [];
  let i = 0;
  let globalIdx = globalStartIndex;

  while (i < paragraph.length) {
    let wordStr = '';
    while (i < paragraph.length && paragraph[i] !== ' ') {
      wordStr += paragraph[i];
      i++;
    }
    let spaces = '';
    while (i < paragraph.length && paragraph[i] === ' ') {
      spaces += paragraph[i];
      i++;
    }
    const fullWord = wordStr + spaces;
    if (fullWord.length === 0) continue;

    const chars: RenderedChar[] = [];
    for (const ch of fullWord) {
      chars.push({ char: ch, globalIndex: globalIdx });
      globalIdx++;
    }
    tokens.push({ chars });
  }

  return tokens;
}

function wordText(word: RenderedWord): string {
  return word.chars.map((c) => c.char).join('');
}

/**
 * Hard-wrap an oversized word across multiple lines at character boundaries.
 */
function breakOversizedWord(
  ctx: CanvasRenderingContext2D,
  word: RenderedWord,
  maxWidthPx: number,
): RenderedWord[] {
  const lines: RenderedWord[] = [];
  let chunk: RenderedChar[] = [];
  let chunkWidth = 0;

  for (const rc of word.chars) {
    const chWidth = ctx.measureText(rc.char === ' ' ? ' ' : rc.char).width;
    if (chunk.length > 0 && chunkWidth + chWidth > maxWidthPx) {
      lines.push({ chars: chunk });
      chunk = [rc];
      chunkWidth = chWidth;
    } else {
      chunk.push(rc);
      chunkWidth += chWidth;
    }
  }

  if (chunk.length > 0) {
    lines.push({ chars: chunk });
  }

  return lines.length > 0 ? lines : [{ chars: word.chars }];
}

/**
 * Wrap a paragraph into visual lines at word boundaries.
 * Each returned array is exactly one ruled notebook row.
 */
function wrapParagraphIntoLines(
  ctx: CanvasRenderingContext2D,
  tokens: RenderedWord[],
  maxWidthPx: number,
): RenderedWord[][] {
  if (tokens.length === 0) return [];

  const lines: RenderedWord[][] = [];
  let currentLine: RenderedWord[] = [];
  let currentWidth = 0;

  const flushLine = () => {
    if (currentLine.length === 0) return;
    lines.push(currentLine);
    currentLine = [];
    currentWidth = 0;
  };

  for (const token of tokens) {
    const text = wordText(token);
    const wordWidth = ctx.measureText(text).width;

    if (wordWidth > maxWidthPx) {
      flushLine();
      const pieces = breakOversizedWord(ctx, token, maxWidthPx);
      for (let i = 0; i < pieces.length; i++) {
        if (i < pieces.length - 1) {
          lines.push([pieces[i]]);
        } else {
          currentLine = [pieces[i]];
          currentWidth = ctx.measureText(wordText(pieces[i])).width;
        }
      }
      continue;
    }

    if (currentLine.length > 0 && currentWidth + wordWidth > maxWidthPx) {
      flushLine();
    }

    currentLine.push(token);
    currentWidth += wordWidth;
  }

  flushLine();
  return lines;
}

/**
 * Pack text into A4 pages line-by-line.
 * Paragraphs split naturally across page boundaries — remaining rows on
 * page N stay filled; overflow lines continue at the top of page N+1.
 */
export function paginateText(
  text: string,
  fontStyle: FontStyle,
  fontSizePx: number = DEFAULT_FONT_SIZE_PX,
  maxWidthPx: number = TEXT_WRAP_WIDTH_PX,
  maxLinesPerPage: number = MAX_LINES_PER_PAGE,
): Page[] {
  if (!text || text.length === 0) {
    return [{ segments: [], pageNumber: 1 }];
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return fallbackPaginate(text, maxLinesPerPage);
  }
  ctx.font = getCanvasFont(fontStyle, fontSizePx);

  // maxWidthPx already includes TEXT_WIDTH_SAFETY from pageGeometry
  const usableWidth = maxWidthPx;
  const paragraphs = text.split('\n');
  const pages: Page[] = [];
  let currentSegments: PageSegment[] = [];
  let lineCount = 0;
  let pageNumber = 1;
  let globalCharIndex = 0;

  const flushPage = () => {
    if (currentSegments.length === 0) return;
    pages.push({ segments: currentSegments, pageNumber });
    currentSegments = [];
    lineCount = 0;
    pageNumber++;
  };

  /** Push one ruled row; start a new page only when the current one is full. */
  const pushRow = (segment: PageSegment) => {
    if (lineCount >= maxLinesPerPage) {
      flushPage();
    }
    currentSegments.push(segment);
    lineCount++;
  };

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    const tokens = tokenizeParagraph(paragraph, globalCharIndex);
    globalCharIndex += paragraph.length + 1;

    if (tokens.length === 0) {
      // Blank line from a lone newline
      pushRow({ type: 'break' });
      continue;
    }

    const wrappedLines = wrapParagraphIntoLines(ctx, tokens, usableWidth);

    // Emit each visual line independently so paragraphs can split mid-block
    for (const lineWords of wrappedLines) {
      pushRow({ type: 'line', words: lineWords });
    }

    // Single \n between two non-empty paragraphs → one blank ruled row
    const next = paragraphs[p + 1];
    if (next !== undefined && next.length > 0) {
      pushRow({ type: 'break' });
    }
  }

  if (currentSegments.length > 0) {
    flushPage();
  }

  if (pages.length === 0) {
    return [{ segments: [], pageNumber: 1 }];
  }

  return pages;
}

function fallbackPaginate(text: string, maxLinesPerPage: number): Page[] {
  const paragraphs = text.split('\n');
  const pages: Page[] = [];
  let currentSegments: PageSegment[] = [];
  let lineCount = 0;
  let pageNumber = 1;
  let globalCharIndex = 0;
  const CHARS_PER_LINE = 40;

  const flushPage = () => {
    if (currentSegments.length === 0) return;
    pages.push({ segments: currentSegments, pageNumber });
    currentSegments = [];
    lineCount = 0;
    pageNumber++;
  };

  const pushRow = (segment: PageSegment) => {
    if (lineCount >= maxLinesPerPage) flushPage();
    currentSegments.push(segment);
    lineCount++;
  };

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    if (paragraph.length === 0) {
      pushRow({ type: 'break' });
      globalCharIndex++;
      continue;
    }

    const words = tokenizeParagraph(paragraph, globalCharIndex);
    globalCharIndex += paragraph.length + 1;

    for (let i = 0; i < words.length; ) {
      const lineWords: RenderedWord[] = [];
      let chars = 0;
      while (i < words.length && chars < CHARS_PER_LINE) {
        lineWords.push(words[i]);
        chars += wordText(words[i]).length;
        i++;
      }
      pushRow({ type: 'line', words: lineWords });
    }

    if (p < paragraphs.length - 1 && paragraphs[p + 1].length > 0) {
      pushRow({ type: 'break' });
    }
  }

  if (currentSegments.length > 0) flushPage();
  return pages.length > 0 ? pages : [{ segments: [], pageNumber: 1 }];
}

export { LINE_SPACING_PX };
