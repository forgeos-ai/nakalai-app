/**
 * Razorpay Checkout.js loader — production payment path only.
 * Sprint 2B Phase 2 / Hotfix: open modal with server-created order.
 */

const CHECKOUT_TIMEOUT_MS = 15 * 60 * 1000;
const SCRIPT_LOAD_TIMEOUT_MS = 20_000;

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailedPayload = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
  theme?: { color?: string };
};

type RazorpayInstance = {
  open: () => void;
  on?: (
    event: string,
    handler: (response: RazorpayFailedPayload) => void,
  ) => void;
};

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export type RazorpayCheckoutSuccess = {
  status: 'success';
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutFailureCode =
  | 'load_failed'
  | 'popup_blocked'
  | 'cancelled'
  | 'payment_failed'
  | 'timeout'
  | 'network'
  | 'invalid_order'
  | 'unknown';

export type RazorpayCheckoutFailure = {
  status: 'failed';
  code: RazorpayCheckoutFailureCode;
  userMessage: string;
};

export type RazorpayCheckoutResult =
  | RazorpayCheckoutSuccess
  | RazorpayCheckoutFailure;

const USER_MESSAGES: Record<RazorpayCheckoutFailureCode, string> = {
  load_failed:
    'Could not load the payment window. Check your connection and try again.',
  popup_blocked:
    'Payment window was blocked. Allow pop-ups for this site and try again.',
  cancelled: 'Payment was cancelled.',
  payment_failed: 'Payment could not be completed. Please try again.',
  timeout: 'Payment timed out. Please try again.',
  network: 'Network error during payment. Check your connection and try again.',
  invalid_order:
    'Payment order is invalid or incomplete. Please try again.',
  unknown: 'Payment could not be completed. Please try again.',
};

function failure(
  code: RazorpayCheckoutFailureCode,
  overrideMessage?: string,
): RazorpayCheckoutFailure {
  return {
    status: 'failed',
    code,
    userMessage: overrideMessage ?? USER_MESSAGES[code],
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T,
): Promise<T> {
  return new Promise((resolve) => {
    const id = window.setTimeout(() => resolve(onTimeout()), ms);
    promise.then(
      (value) => {
        window.clearTimeout(id);
        resolve(value);
      },
      () => {
        window.clearTimeout(id);
        resolve(onTimeout());
      },
    );
  });
}

export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  const loadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nakalai-razorpay]',
    );

    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      // Script already finished (success or fail) — load event will never fire again.
      if (existing.dataset.nakalaiRazorpayState === 'ready') {
        resolve(Boolean(window.Razorpay));
        return;
      }
      if (existing.dataset.nakalaiRazorpayState === 'error') {
        resolve(false);
        return;
      }
      existing.addEventListener(
        'load',
        () => resolve(Boolean(window.Razorpay)),
        { once: true },
      );
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.nakalaiRazorpay = 'true';
    script.onload = () => {
      script.dataset.nakalaiRazorpayState = 'ready';
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => {
      script.dataset.nakalaiRazorpayState = 'error';
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return withTimeout(loadPromise, SCRIPT_LOAD_TIMEOUT_MS, () => false);
}

/**
 * Open Razorpay Checkout with a server-created order.
 * Amount and key come from the create-order response — never computed client-side.
 */
export async function openRazorpayCheckout(options: {
  publicKey: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  description: string;
}): Promise<RazorpayCheckoutResult> {
  if (!options.publicKey?.trim() || !options.orderId?.trim()) {
    return failure('invalid_order');
  }

  if (!Number.isFinite(options.amountPaise) || options.amountPaise <= 0) {
    return failure('invalid_order');
  }

  let loaded: boolean;
  try {
    loaded = await loadRazorpayCheckout();
  } catch {
    return failure('network');
  }

  if (!loaded || !window.Razorpay) {
    return failure('load_failed');
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: RazorpayCheckoutResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => {
      finish(failure('timeout'));
    }, CHECKOUT_TIMEOUT_MS);

    try {
      const instance = new window.Razorpay!({
        key: options.publicKey,
        amount: options.amountPaise,
        currency: options.currency || 'INR',
        name: 'NakalAI',
        description: options.description,
        order_id: options.orderId,
        handler: (response) => {
          if (
            !response?.razorpay_order_id ||
            !response?.razorpay_payment_id ||
            !response?.razorpay_signature
          ) {
            finish(failure('unknown'));
            return;
          }
          finish({
            status: 'success',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            finish(failure('cancelled'));
          },
          escape: true,
        },
        theme: { color: '#0ea5e9' },
      });

      try {
        instance.on?.('payment.failed', () => {
          finish(failure('payment_failed'));
        });
      } catch {
        // Optional event hook — never block open().
      }

      instance.open();
    } catch (err) {
      const blocked =
        err instanceof Error && /popup|blocked|prevented/i.test(err.message);
      finish(failure(blocked ? 'popup_blocked' : 'unknown'));
    }
  });
}
