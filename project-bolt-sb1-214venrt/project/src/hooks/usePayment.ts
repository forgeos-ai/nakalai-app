/**
 * Premium checkout hook — dev mock path + production Razorpay verification.
 */

import { useCallback, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
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
import { syncLocalPaymentStatus, getStudentProfile } from '../studentProfile';
import { allowMockPayments } from '../security/runtimeMode';
import { fingerprintAssignment } from '../security/contentFingerprint';
import { setServerEntitlement } from '../security/serverEntitlement';
import { openRazorpayCheckout } from '../security/razorpayCheckout';

const GATEWAY_DELAY_MS = 1500;

export type PremiumCheckoutResult = {
  ok: boolean;
  receipt: PaymentReceipt | null;
  quote: CheckoutQuote;
  activation: CheckoutActivationPayload;
  ledgerSynced: boolean;
  error?: string;
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

export function resolveCheckoutUserId(): string {
  const profile = getStudentProfile();
  if (profile?.email) return profile.email.trim().toLowerCase();
  try {
    const key = 'nakalai_anon_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now()}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

/**
 * Dev-only ledger upsert. Production premium access must be written server-side
 * after Razorpay signature verification (service role).
 */
export async function upsertPremiumSubscription(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!allowMockPayments()) {
    return { ok: true };
  }

  if (!isSupabaseConfigured) {
    if (import.meta.env.DEV) {
      console.info(
        '[NakalAI] Supabase unconfigured — skipping user_subscriptions upsert (local unlock still applied).',
      );
    }
    return { ok: true };
  }

  try {
    const { error } = await supabase.from('user_subscriptions').upsert(
      {
        user_id: userId,
        premium_access: true,
        downloaded_passes: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.warn('[NakalAI] user_subscriptions upsert failed:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ledger-upsert-failed';
    console.warn('[NakalAI] user_subscriptions upsert exception:', message);
    return { ok: false, error: message };
  }
}

async function initiateProductionCheckout(
  activation: CheckoutActivationPayload,
  quote: CheckoutQuote,
  layoutPageCount: number,
  assignmentText: string,
  userId: string,
): Promise<PremiumCheckoutResult> {
  const contentHash = await fingerprintAssignment(
    assignmentText,
    layoutPageCount,
    activation.id,
  );

  const orderRes = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageId: activation.id,
      contentHash,
    }),
    cache: 'no-store',
  });

  const orderData = (await orderRes.json().catch(() => ({}))) as {
    ok?: boolean;
    orderId?: string;
    keyId?: string;
    amountPaise?: number;
    error?: string;
  };

  if (!orderRes.ok || !orderData.ok || !orderData.orderId || !orderData.keyId) {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error: orderData.error ?? 'Payment gateway is not available.',
    };
  }

  const razorpayResponse = await openRazorpayCheckout({
    keyId: orderData.keyId,
    orderId: orderData.orderId,
    amountPaise: orderData.amountPaise ?? Math.round(quote.amountInr * 100),
    description: quote.ctaLabel,
  });

  const verifyRes = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      packageId: activation.id,
      contentHash,
      userId,
      email: getStudentProfile()?.email,
      mobileNumber: getStudentProfile()?.mobileNumber,
    }),
    cache: 'no-store',
  });

  const verifyData = (await verifyRes.json().catch(() => ({}))) as {
    ok?: boolean;
    paymentVerificationToken?: string;
    maxPages?: number;
    error?: string;
  };

  if (!verifyRes.ok || !verifyData.ok || !verifyData.paymentVerificationToken) {
    return {
      ok: false,
      receipt: null,
      quote,
      activation,
      ledgerSynced: false,
      error: verifyData.error ?? 'Payment verification failed.',
    };
  }

  const expiresAt = Date.now() + (verifyData.maxPages ? 5 * 60 * 1000 : 5 * 60 * 1000);
  setServerEntitlement({
    paid: true,
    paymentVerificationToken: verifyData.paymentVerificationToken,
    packageId: activation.id,
    contentHash,
    maxPages: verifyData.maxPages ?? activation.pageCount,
    expiresAt,
  });

  const receipt: PaymentReceipt = {
    payment_status: 'paid',
    tier_type: quote.tier_type,
    amount_inr: quote.amountInr,
    paid_at: new Date().toISOString(),
    source_app: 'nakalai',
  };

  syncLocalPaymentStatus(true, receipt);

  return {
    ok: true,
    receipt,
    quote,
    activation,
    ledgerSynced: true,
  };
}

export async function initiatePremiumCheckout(
  userId: string,
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
      userId,
    );
  }

  if (import.meta.env.DEV) {
    console.info('[NakalAI] checkout activation', activation);
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, GATEWAY_DELAY_MS);
  });

  const ledger = await upsertPremiumSubscription(userId);
  const receipt = completeMockPayment(quote);
  syncLocalPaymentStatus(true, receipt);

  return {
    ok: true,
    receipt,
    quote,
    activation,
    ledgerSynced: ledger.ok,
    error: ledger.error,
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
      userIdOverride?: string,
      activationOverride?: CheckoutActivationPayload | null,
      assignmentText = '',
    ) => {
      if (isProcessingPayment) return null;

      setIsProcessingPayment(true);
      setPaymentError(null);

      try {
        const userId =
          (userIdOverride?.trim() || resolveCheckoutUserId()).toLowerCase();
        const result = await initiatePremiumCheckout(
          userId,
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
