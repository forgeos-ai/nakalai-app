/**
 * FontRegistry — verifies / reloads handwriting FontFaces before paint.
 * Never silently relies on a stale module-level load promise.
 */

const GLYPH_SAMPLE = 'AaBbCcXxYyZz0123456789';

/** Per-family load generation — invalidated on session reset. */
let registryGeneration = 0;
const inFlightLoads = new Map<string, Promise<boolean>>();

function normalizedFamily(family: string): string {
  return family.replace(/^['"]|['"]$/g, '').trim().toLowerCase();
}

/** `document.fonts.check` alone returns true for some generic substitutions. */
function familyIsRegistered(family: string): boolean {
  if (typeof document === 'undefined' || !document.fonts) return true;
  const wanted = normalizedFamily(family);
  try {
    for (const face of document.fonts) {
      if (normalizedFamily(face.family) === wanted) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function invalidateFontRegistry(): void {
  registryGeneration += 1;
  inFlightLoads.clear();
}

export function getFontRegistryGeneration(): number {
  return registryGeneration;
}

function familyCheck(family: string, sizePx: number): boolean {
  if (typeof document === 'undefined' || !document.fonts?.check) {
    return true;
  }
  try {
    return (
      familyIsRegistered(family) &&
      document.fonts.check(`400 ${sizePx}px "${family}"`)
    );
  } catch {
    return false;
  }
}

async function loadFamilyOnce(
  family: string,
  sizePx: number,
  generation: number,
): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return false;
  }

  const key = `${generation}|${family}|${sizePx}`;
  const existing = inFlightLoads.get(key);
  if (existing) return existing;

  const job = (async () => {
    if (generation !== registryGeneration) return false;
    try {
      await document.fonts.load(`400 ${sizePx}px "${family}"`, GLYPH_SAMPLE);
      await document.fonts.load(`16px "${family}"`, GLYPH_SAMPLE);
      if (document.fonts.ready) {
        await document.fonts.ready;
      }
      if (generation !== registryGeneration) return false;
      return familyCheck(family, sizePx);
    } catch (err) {
      console.warn('[NakalAI] Font load failed:', family, err);
      return false;
    } finally {
      inFlightLoads.delete(key);
    }
  })();

  inFlightLoads.set(key, job);
  return job;
}

/**
 * Ensure every requested family is actually usable in canvas fillText.
 * Returns the list of families that verified successfully (primary first).
 */
export async function ensureHandwritingFonts(
  families: readonly string[],
  sizePx: number,
): Promise<string[]> {
  if (typeof document === 'undefined') {
    return [...families];
  }

  const generation = registryGeneration;
  const paintSize = Math.max(8, Math.round(sizePx));

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  if (generation !== registryGeneration) return [];

  const verified: string[] = [];

  for (const family of families) {
    if (!family) continue;
    if (generation !== registryGeneration) return verified;

    let ok = familyCheck(family, paintSize);
    if (!ok) {
      ok = await loadFamilyOnce(family, paintSize, generation);
    }
    // Second chance — rebuild load after a failed check
    if (!ok) {
      ok = await loadFamilyOnce(family, paintSize, generation);
    }
    if (ok) {
      verified.push(family);
    } else {
      console.warn(
        '[NakalAI] Handwriting font unavailable after reload:',
        family,
      );
    }
  }

  return verified;
}

/**
 * Probe whether ctx.font actually resolved to a loaded face (approx).
 * measureText width of a sample should be > tiny for real handwriting faces.
 */
export function probeFontUsable(
  ctx: CanvasRenderingContext2D,
  family: string,
  sizePx: number,
): boolean {
  try {
    ctx.save();
    ctx.font = `400 ${sizePx}px "${family}"`;
    const w = ctx.measureText('W').width;
    ctx.restore();
    // System fallback for missing fonts is usually narrower / still > 0;
    // reject only absurd zeros / NaN.
    return Number.isFinite(w) && w > sizePx * 0.15;
  } catch {
    return false;
  }
}
