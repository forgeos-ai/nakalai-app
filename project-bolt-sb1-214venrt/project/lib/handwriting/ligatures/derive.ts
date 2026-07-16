import { metric, clamp, clamp01 } from '../types';
import type { LigatureDNA } from './types';

export function deriveLigatures(args: {
  isCursive: boolean;
  connectivity: number;
  vertical: number;
  confidence: number;
  matchStrength: number;
}): LigatureDNA {
  const { isCursive, connectivity, vertical, confidence, matchStrength } = args;

  const connectedLetterBehavior = clamp(
    isCursive ? connectivity * 0.9 + vertical * 0.16 : connectivity * 0.16,
    0,
    1,
  );
  const entryExitCurvature = clamp(
    (connectivity * 0.78 + vertical * 0.22) * matchStrength,
    0.04,
    1,
  );

  const joinPriorByClass = {
    vowelVowel: isCursive ? 0.55 * connectivity : 0.08,
    consonantVowel: isCursive ? 0.72 * connectivity : 0.1,
    doubleLetter: isCursive ? 0.85 * connectivity : 0.15,
  };

  const conf = clamp01(confidence * (isCursive ? 0.9 : 0.55));

  return {
    confidence: conf,
    connectedLetterBehavior: metric(
      connectedLetterBehavior,
      conf,
      'inferred',
    ),
    entryExitCurvature: metric(entryExitCurvature, conf, 'inferred'),
    joinPriorByClass: metric(joinPriorByClass, conf, 'inferred'),
    // No OCR in v1 — never invent pair observations.
    observedPairJoins: [],
  };
}

export type { LigatureDNA };
