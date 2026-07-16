import {
  resolvePaymentMode,
  type PaymentMode,
} from '../../runtimeMode';

const paymentMode = resolvePaymentMode(import.meta.env.VITE_PAYMENT_MODE);

/** Client payment mode; all payment decisions flow through this accessor. */
export function getPaymentMode(): PaymentMode {
  return paymentMode;
}

export function allowMockPayments(): boolean {
  return getPaymentMode() === 'MOCK';
}

/** Production builds must use server-verified entitlements for paid exports. */
export function requiresServerPaymentVerification(): boolean {
  return getPaymentMode() !== 'MOCK';
}

function showRuntimeDiagnostics(): void {
  if (paymentMode === 'LIVE' || typeof window === 'undefined') return;

  const api = paymentMode === 'TEST' ? 'Local Vercel API' : 'Disabled';
  const payment = paymentMode === 'TEST' ? 'Razorpay Test' : 'Mock';
  const environment = import.meta.env.MODE;

  console.info(
    [
      '========================================',
      'NakalAI Runtime',
      `Mode: ${paymentMode}`,
      `Payment: ${payment}`,
      `API: ${api}`,
      `Environment: ${environment}`,
      '========================================',
    ].join('\n'),
  );

  const mountBadge = () => {
    if (document.querySelector('[data-nakalai-runtime-badge]')) return;
    const badge = document.createElement('div');
    badge.dataset.nakalaiRuntimeBadge = paymentMode;
    badge.setAttribute('aria-label', `Payment mode ${paymentMode}`);
    badge.textContent = `PAYMENT MODE · ${paymentMode}`;
    Object.assign(badge.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      zIndex: '2147483647',
      padding: '6px 10px',
      borderRadius: '6px',
      background: paymentMode === 'TEST' ? '#92400e' : '#334155',
      color: '#fff',
      font: '600 11px/1.2 system-ui, sans-serif',
      letterSpacing: '0.05em',
      boxShadow: '0 2px 8px rgb(0 0 0 / 25%)',
      pointerEvents: 'none',
    });
    document.body.appendChild(badge);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBadge, { once: true });
  } else {
    mountBadge();
  }
}

showRuntimeDiagnostics();
