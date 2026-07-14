/**
 * Razorpay Checkout.js loader — production payment path only.
 */

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

type RazorpayCtor = new (options: RazorpayOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nakalai-razorpay]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.nakalaiRazorpay = 'true';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  description: string;
}): Promise<RazorpayHandlerResponse> {
  const loaded = await loadRazorpayCheckout();
  if (!loaded || !window.Razorpay) {
    throw new Error('Could not load Razorpay checkout.');
  }

  return new Promise((resolve, reject) => {
    const instance = new window.Razorpay!({
      key: options.keyId,
      amount: options.amountPaise,
      currency: 'INR',
      name: 'NakalAI',
      description: options.description,
      order_id: options.orderId,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
      theme: { color: '#0ea5e9' },
    });
    instance.open();
  });
}
