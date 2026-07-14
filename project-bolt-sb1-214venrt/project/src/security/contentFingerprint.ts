/**
 * Assignment content fingerprint — binds download grants to the current text/layout.
 */

export async function fingerprintAssignment(
  text: string,
  layoutPageCount: number,
  packageId?: string,
): Promise<string> {
  const payload = JSON.stringify({
    text: text.trim(),
    layoutPageCount,
    packageId: packageId ?? '',
    v: 1,
  });

  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const bytes = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for very old environments
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
  }
  return `fallback_${hash.toString(16)}_${layoutPageCount}`;
}
