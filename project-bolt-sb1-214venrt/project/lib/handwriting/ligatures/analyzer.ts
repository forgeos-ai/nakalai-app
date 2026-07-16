/**
 * Analyze adjacent glyph pairs into deterministic transition plans.
 * Writer Memory biases preference; DNA seed locks the result.
 */

import type { HandwritingDNA } from '../dna/types';
import { clamp, clamp01, hashDnaSeed, mixSeed } from '../types';
import { deriveContextWeights } from '../memory/habits';
import { lookupPairHabit } from './transitionMap';
import type { GlyphTransition } from './types';

function isLetter(char: string | undefined): boolean {
  return Boolean(char && /^[A-Za-z]$/.test(char));
}

function isVowel(char: string): boolean {
  return ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase());
}

function pairClassPrior(
  left: string,
  right: string,
  dna: HandwritingDNA,
): number {
  const priors = dna.ligatures.joinPriorByClass.value;
  if (left.toLowerCase() === right.toLowerCase()) return priors.doubleLetter;
  if (isVowel(left) && isVowel(right)) return priors.vowelVowel;
  if (!isVowel(left) && isVowel(right)) return priors.consonantVowel;
  return dna.ligatures.connectedLetterBehavior.value * 0.55;
}

/**
 * Build a single adjacent-pair transition from DNA + Writer Memory.
 */
export function analyzeGlyphTransition(args: {
  dna: HandwritingDNA;
  left: string;
  right: string;
  glyphIndex: number;
  leftVariantId?: number;
}): GlyphTransition {
  const { dna, left, right, glyphIndex, leftVariantId = 0 } = args;
  const pair = `${left.toLowerCase()}${right.toLowerCase()}`;
  const habit = lookupPairHabit(left, right);
  const classPrior = pairClassPrior(left, right, dna);

  const memoryKey = [
    left.toLowerCase(),
    '^',
    right.toLowerCase(),
    'middle',
    'middle',
    'low',
    '-',
    '-',
  ].join('|');
  const memoryWeights = deriveContextWeights(dna.seed, memoryKey);
  const memoryBias = memoryWeights[leftVariantId % memoryWeights.length] ?? 0.2;

  const seedMix = hashDnaSeed([
    dna.seed,
    'ligature-intel',
    pair,
    glyphIndex,
    leftVariantId,
  ]);
  const micro = ((seedMix % 1000) / 1000 - 0.5) * 0.06;

  const joinStrength = clamp01(
    (habit?.joinBias ?? classPrior) *
      (0.72 + dna.ligatures.connectedLetterBehavior.value * 0.28) *
      (0.85 + memoryBias * 0.3) +
      micro,
  );

  const preferredGapEm = clamp(
    (habit?.gapBiasEm ?? 0.01) *
      (dna.profileHints.isCursive ? 1 : 1.35) *
      (1.1 - joinStrength * 0.35) +
      (1 - dna.rhythm.writingSpeed.value) * 0.008,
    -0.08,
    0.06,
  );

  const exitDirection = clamp(
    (habit?.exit ?? 0) +
      ((mixSeed(seedMix, 0xe71) % 1000) / 1000 - 0.5) * 0.08,
    -1,
    1,
  );
  const entryDirection = clamp(
    (habit?.entry ?? 0) +
      ((mixSeed(seedMix, 0xe72) % 1000) / 1000 - 0.5) * 0.08,
    -1,
    1,
  );

  const overlapAmount = clamp01(
    (habit?.overlapBias ?? joinStrength * 0.08) *
      dna.ligatures.entryExitCurvature.value *
      (0.8 + memoryBias * 0.4),
  );

  const confidence = clamp01(
    dna.ligatures.confidence *
      (0.55 + joinStrength * 0.35) *
      (habit ? 0.95 : 0.72) *
      (0.9 + memoryBias * 0.15),
  );

  return {
    pair,
    left,
    right,
    joinStrength,
    preferredGapEm,
    exitDirection,
    entryDirection,
    overlapAmount,
    confidence,
  };
}

export function analyzeAdjacentPairOrNull(args: {
  dna: HandwritingDNA;
  left: string | undefined;
  right: string | undefined;
  glyphIndex: number;
  leftVariantId?: number;
}): GlyphTransition | null {
  if (!isLetter(args.left) || !isLetter(args.right)) return null;
  return analyzeGlyphTransition({
    dna: args.dna,
    left: args.left!,
    right: args.right!,
    glyphIndex: args.glyphIndex,
    leftVariantId: args.leftVariantId,
  });
}
