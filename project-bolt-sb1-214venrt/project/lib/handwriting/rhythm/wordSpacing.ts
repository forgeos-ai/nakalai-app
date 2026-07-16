/**
 * Word rhythm engine — deterministic writer-paced word gaps.
 *
 * Replaces fixed word spacing with a per-line rhythm curve driven by DNA.
 * No Math.random — all jitter comes from seeded RNG.
 */

import type { PageSegment } from '../../../src/pagination';
import type { HandwritingDNA } from '../dna/types';
import { clamp, createSeededRng, mixSeed } from '../types';

export type WordSpacingMode = 'fixed' | 'rhythm';

export type SentencePosition = 'start' | 'middle' | 'end' | 'only';

export type WordRhythmContext = {
  dna: HandwritingDNA;
  rootSeed: number;
  row: number;
  paragraphRow: number;
  totalParagraphRows: number;
  wordIndex: number;
  lineWordCount: number;
  sentencePosition: SentencePosition;
  trailingPunctuation?: string;
  previousWordWidthEm: number;
  nextWordWidthEm: number;
  fontSize: number;
  strength: number;
  randomness: number;
  isCursive: boolean;
  lineRhythmMultiplier: number;
};

const PUNCTUATION_PAUSE: Record<string, number> = {
  '.': 1.52,
  ',': 1.24,
  ';': 1.3,
  ':': 1.18,
  '!': 1.46,
  '?': 1.46,
};

function wordLetters(word: { chars: Array<{ char: string }> }): string {
  return word.chars
    .filter((c) => c.char !== ' ')
    .map((c) => c.char)
    .join('');
}

function trailingPunctuation(word: { chars: Array<{ char: string }> }): string | undefined {
  const letters = wordLetters(word);
  const last = letters[letters.length - 1];
  if (!last || !/[.,;:!?]/.test(last)) return undefined;
  return last;
}

function estimateWordWidthEm(
  word: { chars: Array<{ char: string }> },
  fontSize: number,
  meanAspect: number,
): number {
  const letterCount = word.chars.filter((c) => c.char !== ' ').length;
  if (letterCount === 0) return 0;
  const charWidth = fontSize * (0.42 + meanAspect * 0.22);
  return (letterCount * charWidth) / Math.max(1, fontSize);
}

export function resolveLineSentencePosition(
  wordIndex: number,
  lineWordCount: number,
): SentencePosition {
  if (lineWordCount <= 1) return 'only';
  if (wordIndex === 0) return 'start';
  if (wordIndex === lineWordCount - 1) return 'end';
  return 'middle';
}

/**
 * Build a per-line rhythm curve — writers accelerate mid-line and ease at edges.
 */
export function buildLineRhythmCurve(args: {
  dnaSeed: number;
  rootSeed: number;
  row: number;
  wordCount: number;
  writingSpeed: number;
  paragraphRow: number;
  totalParagraphRows: number;
  pagePhase: number;
}): number[] {
  const {
    wordCount,
    writingSpeed,
    paragraphRow,
    totalParagraphRows,
    pagePhase,
  } = args;
  if (wordCount <= 0) return [];

  const lineRng = createSeededRng(
    mixSeed(args.rootSeed, 0x5248594d ^ (args.row + 1)),
  );
  const paragraphT =
    totalParagraphRows <= 1 ? 0.5 : paragraphRow / Math.max(1, totalParagraphRows - 1);

  // Faster writers compress mid-line gaps; slower writers linger at line edges.
  const accelCenter = 0.42 + writingSpeed * 0.22;
  const curve: number[] = [];

  for (let wi = 0; wi < wordCount; wi++) {
    const t = wordCount === 1 ? 0.5 : wi / Math.max(1, wordCount - 1);
    const lineWave =
      Math.sin((t - 0.12) * Math.PI + pagePhase * 0.08) * 0.5 + 0.5;
    const edgeEase = 1 + (0.5 - Math.abs(t - 0.5)) * 0.22 * (1 - writingSpeed);
    const paragraphDrift = 1 + (paragraphT - 0.5) * 0.12;
    const micro = (lineRng() - 0.5) * 0.1;
    const multiplier =
      accelCenter * (0.68 + lineWave * 0.58) * edgeEase * paragraphDrift + micro;
    curve.push(multiplier);
  }

  // Mean-preserve so rhythm reshapes gaps without drifting total line length.
  const mean = curve.reduce((sum, value) => sum + value, 0) / curve.length;
  return curve.map((value) =>
    clamp(1 + (value / Math.max(mean, 0.01) - 1) * 0.95, 0.55, 1.55),
  );
}

/**
 * Rhythm-driven word gap in em units (before font-size scaling).
 */
export function computeRhythmWordGapEm(context: WordRhythmContext): number {
  const fixedGap = computeFixedWordGapEm({
    dna: context.dna,
    rootSeed: context.rootSeed,
    wordIndex: context.wordIndex,
    fontSize: context.fontSize,
    strength: context.strength,
    randomness: context.randomness,
    isCursive: context.isCursive,
  });
  const writingSpeed = context.dna.rhythm.writingSpeed.value;
  const base = context.dna.spacing.wordSpacingEm.value;

  let sentenceMod = 0;
  if (context.sentencePosition === 'start') sentenceMod = 0.04;
  if (context.sentencePosition === 'end' || context.sentencePosition === 'only') {
    sentenceMod = 0.08;
  }

  const punctMod = context.trailingPunctuation
    ? (PUNCTUATION_PAUSE[context.trailingPunctuation] ?? 1) - 1
    : 0;

  const prevWidth = context.previousWordWidthEm;
  const nextWidth = context.nextWordWidthEm;
  const widthBoost =
    (prevWidth - 0.42) * 0.05 + (nextWidth - 0.42) * 0.03;

  // Additive context + multiplicative curve around the fixed seed path.
  const rhythmOffset =
    Math.max(0.16, base * 1.35) *
    ((context.lineRhythmMultiplier - 1) * (1.05 + (1 - writingSpeed) * 0.35) +
      sentenceMod +
      punctMod +
      widthBoost);

  return Math.max(0.04, fixedGap + rhythmOffset);
}

export type LineRhythmPlan = {
  row: number;
  paragraphRow: number;
  wordCount: number;
  curve: number[];
  wordWidthsEm: number[];
  trailingPunctuation: Array<string | undefined>;
};

/**
 * Pre-compute rhythm metadata for every text line in a page.
 */
export function buildParagraphRhythmPlans(args: {
  dna: HandwritingDNA;
  segments: PageSegment[];
  rootSeed: number;
  fontSize: number;
}): Map<number, LineRhythmPlan> {
  const { dna, segments, rootSeed, fontSize } = args;
  const writingSpeed = dna.rhythm.writingSpeed.value;
  const pagePhase = dna.rhythm.pageRhythmPhase.value;
  const meanAspect = dna.glyphs.meanAspect.value;

  const lineSegments = segments.filter(
    (segment): segment is Extract<PageSegment, { type: 'line' }> =>
      segment.type === 'line',
  );
  const totalParagraphRows = lineSegments.length;

  const plans = new Map<number, LineRhythmPlan>();
  let paragraphRow = 0;

  for (let row = 0; row < segments.length; row++) {
    const segment = segments[row]!;
    if (segment.type === 'break') {
      paragraphRow += 1;
      continue;
    }

    const wordCount = segment.words.length;
    const wordWidthsEm = segment.words.map((word) =>
      estimateWordWidthEm(word, fontSize, meanAspect),
    );
    const trailing = segment.words.map((word) => trailingPunctuation(word));
    const curve = buildLineRhythmCurve({
      dnaSeed: dna.seed,
      rootSeed,
      row,
      wordCount,
      writingSpeed,
      paragraphRow,
      totalParagraphRows,
      pagePhase,
    });

    plans.set(row, {
      row,
      paragraphRow,
      wordCount,
      curve,
      wordWidthsEm,
      trailingPunctuation: trailing,
    });
    paragraphRow += 1;
  }

  return plans;
}

export function computeFixedWordGapEm(context: {
  dna: HandwritingDNA;
  rootSeed: number;
  wordIndex: number;
  fontSize: number;
  strength: number;
  randomness: number;
  isCursive: boolean;
}): number {
  const gapRng = createSeededRng(
    mixSeed(context.dna.seed, 0xa11ce ^ context.wordIndex),
  );
  const base = context.dna.spacing.wordSpacingEm.value;
  const microPx =
    (gapRng() - 0.35) *
    (context.isCursive ? 2.4 : 1.6) *
    context.randomness *
    context.strength;
  return base + microPx / Math.max(1, context.fontSize);
}
