/**
 * Typography registry — 12 irregular handwriting families across 5 style buckets.
 * Archetype layout profiles scale margins, line spacing, and baseline jitter.
 */

export type InkColor = {
  id: string;
  label: string;
  hex: string;
};

export type PaperType = {
  id: string;
  label: string;
};

/** Explicit visual style buckets for the handwriting asset ecosystem. */
export type HandwritingStyleBucket =
  | 'tight-cursive'
  | 'loose-scratch'
  | 'printed-block-caps'
  | 'rushed-slanted-script'
  | 'heavy-gel-pen-marker';

export const HANDWRITING_STYLE_BUCKETS: {
  id: HandwritingStyleBucket;
  label: string;
}[] = [
  { id: 'tight-cursive', label: 'Tight Cursive' },
  { id: 'loose-scratch', label: 'Loose Scratch' },
  { id: 'printed-block-caps', label: 'Printed Block Caps' },
  { id: 'rushed-slanted-script', label: 'Rushed Slanted Script' },
  { id: 'heavy-gel-pen-marker', label: 'Heavy Gel-Pen Marker' },
];

/**
 * Twelve distinct handwriting font family ids.
 * Legacy ids (messy-brush, cursive-neat, casual-print, rushed-student) retained.
 */
export type HandwritingFontClass =
  | 'cursive-neat'
  | 'cursive-loop'
  | 'cursive-ribbon'
  | 'messy-brush'
  | 'scratch-wild'
  | 'scratch-grain'
  | 'casual-print'
  | 'block-caps'
  | 'block-stencil'
  | 'rushed-student'
  | 'slant-dash'
  | 'marker-bold';

/** Structural layout knobs that scale with the chosen archetype. */
export type ArchetypeLayoutProfile = {
  /** Multiplier on left text-area inset / margin feel (0.85–1.2). */
  marginScale: number;
  /** Multiplier on ruled line spacing (0.9–1.2). */
  lineSpaceScale: number;
  /** Baseline jitter intensity (0–1) for micro-variance / AI temperature. */
  baselineJitter: number;
  /** Default stroke weight bias. */
  strokeWeight: number;
  /** Default slant degrees for the archetype. */
  slantDegrees: number;
  /** Letter-spacing em nudge. */
  trackingEm: number;
};

export type FontStyle = {
  id: HandwritingFontClass;
  label: string;
  className: string;
  /** CSS / Canvas font-family stack */
  fontFamily: string;
  bucket: HandwritingStyleBucket;
  layout: ArchetypeLayoutProfile;
};

export const INK_COLORS: InkColor[] = [
  { id: 'blue', label: 'Royal Blue', hex: '#1e40af' },
  { id: 'black', label: 'Jet Black', hex: '#1f2937' },
  { id: 'red', label: 'Ink Red', hex: '#b91c1c' },
];

export const PAPER_TYPES: PaperType[] = [
  { id: 'ruled', label: 'Ruled Notebook' },
  { id: 'plain', label: 'Plain Paper' },
  { id: 'grid', label: 'Grid Paper' },
];

/** Bucket-level defaults — families refine these slightly. */
const BUCKET_LAYOUT: Record<HandwritingStyleBucket, ArchetypeLayoutProfile> = {
  'tight-cursive': {
    marginScale: 0.92,
    lineSpaceScale: 0.94,
    baselineJitter: 0.28,
    strokeWeight: 1.15,
    slantDegrees: 6,
    trackingEm: 0.008,
  },
  'loose-scratch': {
    marginScale: 1.08,
    lineSpaceScale: 1.12,
    baselineJitter: 0.82,
    strokeWeight: 1.45,
    slantDegrees: 2,
    trackingEm: 0.028,
  },
  'printed-block-caps': {
    marginScale: 1.0,
    lineSpaceScale: 1.06,
    baselineJitter: 0.18,
    strokeWeight: 1.55,
    slantDegrees: 0,
    trackingEm: 0.04,
  },
  'rushed-slanted-script': {
    marginScale: 0.96,
    lineSpaceScale: 0.98,
    baselineJitter: 0.72,
    strokeWeight: 1.2,
    slantDegrees: 11,
    trackingEm: 0.012,
  },
  'heavy-gel-pen-marker': {
    marginScale: 1.05,
    lineSpaceScale: 1.1,
    baselineJitter: 0.48,
    strokeWeight: 2.15,
    slantDegrees: 3,
    trackingEm: 0.02,
  },
};

function layoutFor(
  bucket: HandwritingStyleBucket,
  tweak: Partial<ArchetypeLayoutProfile> = {},
): ArchetypeLayoutProfile {
  return { ...BUCKET_LAYOUT[bucket], ...tweak };
}

/**
 * Twelve pre-loaded irregular handwriting families, grouped by style bucket.
 */
export const FONT_STYLES: FontStyle[] = [
  // —— Tight Cursive ——
  {
    id: 'cursive-neat',
    label: 'Neat Loop Cursive',
    className: 'font-cursive-neat',
    fontFamily: '"Dancing Script", cursive',
    bucket: 'tight-cursive',
    layout: layoutFor('tight-cursive'),
  },
  {
    id: 'cursive-loop',
    label: 'Pacific Loop',
    className: 'font-cursive-loop',
    fontFamily: '"Pacifico", cursive',
    bucket: 'tight-cursive',
    layout: layoutFor('tight-cursive', {
      lineSpaceScale: 0.96,
      baselineJitter: 0.32,
      slantDegrees: 5,
    }),
  },
  {
    id: 'cursive-ribbon',
    label: 'Great Vibes Ribbon',
    className: 'font-cursive-ribbon',
    fontFamily: '"Great Vibes", cursive',
    bucket: 'tight-cursive',
    layout: layoutFor('tight-cursive', {
      marginScale: 0.9,
      trackingEm: 0.004,
      slantDegrees: 8,
    }),
  },

  // —— Loose Scratch ——
  {
    id: 'messy-brush',
    label: 'Messy Brush',
    className: 'font-messy-brush',
    fontFamily: '"Caveat", cursive',
    bucket: 'loose-scratch',
    layout: layoutFor('loose-scratch'),
  },
  {
    id: 'scratch-wild',
    label: 'Homemade Wild',
    className: 'font-scratch-wild',
    fontFamily: '"Homemade Apple", cursive',
    bucket: 'loose-scratch',
    layout: layoutFor('loose-scratch', {
      baselineJitter: 0.9,
      lineSpaceScale: 1.14,
      strokeWeight: 1.35,
    }),
  },
  {
    id: 'scratch-grain',
    label: 'Rock Salt Grain',
    className: 'font-scratch-grain',
    fontFamily: '"Rock Salt", cursive',
    bucket: 'loose-scratch',
    layout: layoutFor('loose-scratch', {
      baselineJitter: 0.78,
      marginScale: 1.1,
      trackingEm: 0.032,
    }),
  },

  // —— Printed Block Caps ——
  {
    id: 'casual-print',
    label: 'Casual Print',
    className: 'font-casual-print',
    fontFamily: '"Architects Daughter", cursive',
    bucket: 'printed-block-caps',
    layout: layoutFor('printed-block-caps', {
      strokeWeight: 1.35,
      trackingEm: 0.022,
    }),
  },
  {
    id: 'block-caps',
    label: 'Special Elite Caps',
    className: 'font-block-caps',
    fontFamily: '"Special Elite", cursive',
    bucket: 'printed-block-caps',
    layout: layoutFor('printed-block-caps'),
  },
  {
    id: 'block-stencil',
    label: 'Amatic Block',
    className: 'font-block-stencil',
    fontFamily: '"Amatic SC", cursive',
    bucket: 'printed-block-caps',
    layout: layoutFor('printed-block-caps', {
      lineSpaceScale: 1.08,
      trackingEm: 0.05,
      strokeWeight: 1.7,
    }),
  },

  // —— Rushed Slanted Script ——
  {
    id: 'rushed-student',
    label: 'Rushed Student',
    className: 'font-rushed-student',
    fontFamily: '"Shadows Into Light", cursive',
    bucket: 'rushed-slanted-script',
    layout: layoutFor('rushed-slanted-script'),
  },
  {
    id: 'slant-dash',
    label: 'Covered Slant',
    className: 'font-slant-dash',
    fontFamily: '"Covered By Your Grace", cursive',
    bucket: 'rushed-slanted-script',
    layout: layoutFor('rushed-slanted-script', {
      slantDegrees: 13,
      baselineJitter: 0.78,
      marginScale: 0.94,
    }),
  },

  // —— Heavy Gel-Pen Marker ——
  {
    id: 'marker-bold',
    label: 'Permanent Marker',
    className: 'font-marker-bold',
    fontFamily: '"Permanent Marker", cursive',
    bucket: 'heavy-gel-pen-marker',
    layout: layoutFor('heavy-gel-pen-marker'),
  },
];

export const DEFAULT_HANDWRITING_FONT_CLASS: HandwritingFontClass =
  'casual-print';

export function getFontStyleByClass(
  fontClass: HandwritingFontClass | string | null | undefined,
): FontStyle {
  const found = FONT_STYLES.find((f) => f.id === fontClass);
  return (
    found ??
    FONT_STYLES.find((f) => f.id === DEFAULT_HANDWRITING_FONT_CLASS)!
  );
}

export function getFontsByBucket(
  bucket: HandwritingStyleBucket,
): FontStyle[] {
  return FONT_STYLES.filter((f) => f.bucket === bucket);
}

export function getBucketLabel(bucket: HandwritingStyleBucket): string {
  return (
    HANDWRITING_STYLE_BUCKETS.find((b) => b.id === bucket)?.label ?? bucket
  );
}

/**
 * Archetype layout profile for a font class — drives margins, line space,
 * and baseline jitter when the user picks or matches a family.
 */
export function getArchetypeLayout(
  fontClass: HandwritingFontClass | string | null | undefined,
): ArchetypeLayoutProfile {
  return getFontStyleByClass(fontClass).layout;
}

export const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog.

Handwriting is the writing done with a writing instrument, such as a pen or pencil, in the hand. It includes both printing and cursive styles, and is distinct from formal calligraphy or typeface.

Each person's handwriting is unique and can be used to verify a document's writer. The study of handwriting is known as graphology, and it has been used in various fields including forensics, psychology, and historical analysis.

In the modern digital age, handwriting has become less common as a means of communication, but it remains an important skill. Many educators argue that handwriting helps with cognitive development, memory retention, and fine motor skills.

There are several styles of handwriting, including print, cursive, and a combination of both. Each style has its own characteristics and is suited to different purposes. Print writing is typically easier to read, while cursive writing is faster to produce.

The tools used for handwriting have evolved over time, from quills and inkwells to fountain pens, ballpoint pens, and pencils. Each tool produces a distinct line quality and texture on the page.

Handwriting analysis is also used in forensic science to authenticate documents and identify forgeries. Experts examine characteristics such as letter formation, spacing, slant, and pressure to determine the authenticity of a document.`;
