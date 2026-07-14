/**
 * HMAC-SHA256 sign/verify for short-lived server-issued tokens (Edge + Node).
 */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signPayload(payload: string, secret: string): Promise<string> {
  if (!secret) throw new Error('HMAC secret is not configured');
  const key = await importHmacKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const sigB64 = toBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySignedPayload(
  token: string,
  secret: string,
): Promise<string | null> {
  if (!secret || !token.includes('.')) return null;
  const [payloadB64, sigB64] = token.split('.', 2);
  if (!payloadB64 || !sigB64) return null;

  try {
    const payloadBytes = fromBase64Url(payloadB64);
    const payload = new TextDecoder().decode(payloadBytes);
    const key = await importHmacKey(secret);
    const expectedSig = fromBase64Url(sigB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      expectedSig,
      payloadBytes,
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}
