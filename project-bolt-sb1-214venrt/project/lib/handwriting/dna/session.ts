/**
 * Session-only DNA store — never written to disk / localStorage / IndexedDB.
 */

import type { HandwritingDNA } from './types';

let activeDna: HandwritingDNA | null = null;
let dnaRevision = 0;

export function getActiveHandwritingDNA(): HandwritingDNA | null {
  return activeDna;
}

export function getHandwritingDnaRevision(): number {
  return dnaRevision;
}

export function setActiveHandwritingDNA(dna: HandwritingDNA | null): void {
  dnaRevision += 1;
  activeDna = dna;
}

/**
 * Zeroize references. HandwritingDNA holds no pixel buffers —
 * segmentation pixel matrices live in glyphSlicer session and are cleared separately.
 */
export function clearHandwritingDNA(): void {
  activeDna = null;
  dnaRevision += 1;
}

export function isHandwritingDnaActive(): boolean {
  return activeDna != null;
}
