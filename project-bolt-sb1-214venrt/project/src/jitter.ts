// Deterministic hash-based jitter utilities.
// Each character's transform is seeded by its global index in the full text,
// so adding/removing text at the end never shifts earlier characters.

export type CharJitter = {
  translateY: number; // -0.5px to +0.5px
  marginRight: number; // -0.8px to +1.2px (slight tracking inconsistency)
  rotate: number; // -1.5deg to +1.5deg
};

/**
 * xmur3 string hash — produces a 32-bit seed from a string.
 * Deterministic: same input always yields same output.
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/**
 * mulberry32 PRNG — fast, deterministic seeded pseudo-random generator.
 * Returns a function that produces floats in [0, 1) on each call.
 */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cache: globalCharIndex -> CharJitter. Prevents recompute on every render.
const jitterCache = new Map<number, CharJitter>();

/**
 * Returns deterministic jitter values for a character at the given global index.
 * The same index always produces the same jitter, regardless of what text
 * surrounds it — so existing characters never shift when new text is appended.
 */
export function getCharJitter(globalIndex: number): CharJitter {
  const cached = jitterCache.get(globalIndex);
  if (cached) return cached;

  // Seed the PRNG from the global index
  const seedFn = xmur3(`char-${globalIndex}`);
  const seed = seedFn();
  const rand = mulberry32(seed);

  const jitter: CharJitter = {
    translateY: (rand() - 0.5) * 1.0, // -0.5 to +0.5
    marginRight: rand() * 2.0 - 0.8, // -0.8 to +1.2
    rotate: (rand() - 0.5) * 3.0, // -1.5 to +1.5
  };

  jitterCache.set(globalIndex, jitter);
  return jitter;
}
