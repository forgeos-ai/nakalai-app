/**
 * Server-only environment readers. Never import from client bundles.
 */

function read(key: string): string {
  if (typeof process === 'undefined') return '';
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function getDownloadTokenSecret(): string {
  return (
    read('DOWNLOAD_TOKEN_SECRET') ||
    read('RAZORPAY_KEY_SECRET') ||
    ''
  );
}

export function getRazorpayKeyId(): string {
  return read('RAZORPAY_KEY_ID') || read('NEXT_PUBLIC_RAZORPAY_KEY_ID');
}

export function getRazorpayKeySecret(): string {
  return read('RAZORPAY_KEY_SECRET');
}

export function isRazorpayConfigured(): boolean {
  const id = getRazorpayKeyId();
  const secret = getRazorpayKeySecret();
  return Boolean(id && secret && !id.includes('YOUR_') && !secret.includes('YOUR_'));
}
