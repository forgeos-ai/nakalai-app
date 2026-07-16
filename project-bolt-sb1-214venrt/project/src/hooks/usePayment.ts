/**
 * Premium checkout hook — mock path + Razorpay Checkout + server verification.
 * Download unlock remains a separate step (authorize/export).
 */

import { useCallback, useState } from 'react';
import {
  completeMockPayment,
  type PaymentReceipt,
} from '../paymentGateway';
import {
  quoteFromTier,
  resolveDefaultTier,
  toCheckoutActivationPayload,
  type CheckoutActivationPayload,
  type CheckoutQuote,
  type PricingTier,
} from '../billing';
import { allowMockPayments } from '../security/runtimeMode';
import { fingerprintAssignment } from '../security/contentFingerprint';
import { openRazorpayCheckout } from '../security/razorpayCheckout';
import { setServerEntitlement } from '../security/serverEntitlement';
import { SOURCE_APP } from '../sourceApp';

const GATEWAY_DELAY_MS = 1500;

export type PremiumCheckoutResult = {
  ok: boolean;
  receipt: PaymentReceipt | null;
  quote: CheckoutQuote;
  activation: CheckoutActivationPayload;
  ledgerSynced: boolean;
  error?: string;
  /**
   * Razorpay Checkout reported success (before or after server verification).
   */
  checkoutSucceeded?: boolean;
};

export type UsePaymentOptions = {
  hasMatchedStyle: boolean;
  layoutPageCount?: number;
  selectedTier?: PricingTier | null;
  onPaid?: (
    receipt: PaymentReceipt,
    quote: CheckoutQuote,
    activation: CheckoutActivationPayload,
  ) => void;
};

type CreateOrderResponse = {
  orderId?: string;
  currency?: string;
  amount?: number;
  publicKey?: string;
  packageId?: string;
  error?: string;
  code?: string;
};

type VerifyPaymentResponse = {
  ok?: boolean;
  paymentVerificationToken?: string;
  packageId?: string;
  maxPages?: number;
  amountInr?: number;
  paymentId?: string;
  orderId?: string;
  expiresInSeconds?: number;
  error?: string;
  code?: string;
};

async function initiateProductionCheckout(
  activation: CheckoutActivationPayload,
  quote: CheckoutQuote,
  layoutPageCount: number,
  assignmentText: string,
): Promise<PremiumCheckoutResult> {
  const contentHash = await fingerprintAssignment(
    assignmentText,
    layoutPageCount,
    activation.id,
  );

  let orderRes: Response;
  try {
    orderRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: activation.id,
        contentHash,
      }),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error: 'Network error. Check your connection and try again.',
    };
  }

  const orderData = (await orderRes.json().catch(() => ({}))) as CreateOrderResponse;

  if (!orderRes.ok) {
    const statusHint =
      orderRes.status === 503
        ? 'Payment gateway is not configured. Please try again later.'
        : orderRes.status === 429
          ? 'Too many payment attempts. Please wait and try again.'
          : orderRes.status === 404
            ? 'Payment service is unavailable. Please try again later.'
            : null;
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error:
        orderData.error ??
        statusHint ??
        'Payment gateway is not available.',
    };
  }

  if (!orderData.orderId || !orderData.publicKey || !orderData.amount) {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error: 'Payment order is incomplete. Please try again.',
    };
  }

  const checkoutResult = await openRazorpayCheckout({
    publicKey: orderData.publicKey,
    orderId: orderData.orderId,
    amountPaise: orderData.amount,
    currency: orderData.currency ?? 'INR',
    description: quote.ctaLabel,
  });

  if (checkoutResult.status === 'failed') {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error: checkoutResult.userMessage,
    };
  }

  let verifyRes: Response;
  try {
    verifyRes = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
        packageId: activation.id,
        contentHash,
      }),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      checkoutSucceeded: true,
      error: 'Payment received but verification network failed. Please retry.',
    };
  }

  const verifyData = (await verifyRes.json().catch(() => ({}))) as VerifyPaymentResponse;

  if (!verifyRes.ok || !verifyData.ok || !verifyData.paymentVerificationToken) {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      checkoutSucceeded: true,
      error:
        verifyData.error ??
        'Payment received but could not be verified. Please contact support.',
    };
  }

  const expiresInSeconds = verifyData.expiresInSeconds ?? 300;
  setServerEntitlement({
    paid: true,
    paymentVerificationToken: verifyData.paymentVerificationToken,
    packageId: verifyData.packageId ?? activation.id,
    contentHash,
    maxPages: verifyData.maxPages ?? quote.pages,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  const receipt: PaymentReceipt = {
    payment_status: 'paid',
    tier_type: quote.tier_type,
    amount_inr: verifyData.amountInr ?? quote.amountInr,
    paid_at: new Date().toISOString(),
    source_app: SOURCE_APP,
  };

  return {
    ok: true,
    receipt,
    quote,
    activation,
    ledgerSynced: false,
    checkoutSucceeded: true,
  };
}

export async function initiatePremiumCheckout(
  hasMatchedStyle = true,
  layoutPageCount = 1,
  selectedTier?: PricingTier | null,
  activationOverride?: CheckoutActivationPayload | null,
  assignmentText = '',
): Promise<PremiumCheckoutResult> {
  const tier =
    selectedTier ?? resolveDefaultTier(hasMatchedStyle, layoutPageCount);
  const activation =
    activationOverride ??
    toCheckoutActivationPayload(tier, layoutPageCount);
  const quote = quoteFromTier(tier);

  if (!allowMockPayments()) {
    return initiateProductionCheckout(
      activation,
      quote,
      layoutPageCount,
      assignmentText,
    );
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, GATEWAY_DELAY_MS);
  });

  const receipt = completeMockPayment(quote);

  return {
    ok: true,
    receipt,
    quote,
    activation,
    ledgerSynced: false,
  };
}

export function usePayment({
  hasMatchedStyle,
  layoutPageCount = 1,
  selectedTier = null,
  onPaid,
}: UsePaymentOptions) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PremiumCheckoutResult | null>(
    null,
  );

  const startPremiumCheckout = useCallback(
    async (
      activationOverride?: CheckoutActivationPayload | null,
      assignmentText = '',
    ) => {
      if (isProcessingPayment) return null;

      setIsProcessingPayment(true);
      setPaymentError(null);

      try {
        const result = await initiatePremiumCheckout(
          hasMatchedStyle,
          layoutPageCount,
          selectedTier,
          activationOverride,
          assignmentText,
        );
        setLastResult(result);

        if (result.ok && result.receipt) {
          onPaid?.(result.receipt, result.quote, result.activation);
        } else if (result.error) {
          setPaymentError(result.error);
        }

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Payment gateway failed';
        setPaymentError(message);
        return null;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [
      hasMatchedStyle,
      isProcessingPayment,
      layoutPageCount,
      onPaid,
      selectedTier,
    ],
  );

  return {
    isProcessingPayment,
    paymentError,
    lastResult,
    initiatePremiumCheckout: startPremiumCheckout,
  };
}
