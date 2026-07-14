/**
 * Additive premium checkout hook — mock Razorpay/Stripe lifecycle +
 * Supabase `user_subscriptions` ledger upsert.
 *
 * Does not touch canvas / typography rendering.
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
  /** Explicit tier selected in the page-bundle matrix. */
  selectedTier?: PricingTier | null;
  onPaid?: (
    receipt: PaymentReceipt,
    quote: CheckoutQuote,
    activation: CheckoutActivationPayload,
  ) => void;
};

/**
 * Resolve a stable user id for the subscriptions ledger.
 * Prefers captured lead email; falls back to a local anonymous id.
 */
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
 * Upsert premium access into Supabase `user_subscriptions`.
 * Soft-fails when Supabase is unconfigured (local demo still unlocks).
 */
export async function upsertPremiumSubscription(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
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

/**
 * Mock payment gate — simulates Razorpay/Stripe checkout for a selected page bundle.
 * Prefer passing `activation` from the Pay CTA (`id`, `priceINR`, `pageCount`).
 */
export async function initiatePremiumCheckout(
  userId: string,
  hasMatchedStyle = true,
  layoutPageCount = 1,
  selectedTier?: PricingTier | null,
  activationOverride?: CheckoutActivationPayload | null,
): Promise<PremiumCheckoutResult> {
  const tier =
    selectedTier ?? resolveDefaultTier(hasMatchedStyle, layoutPageCount);
  const activation =
    activationOverride ??
    toCheckoutActivationPayload(tier, layoutPageCount);
  const quote = quoteFromTier(tier);

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

/**
 * React hook wrapping the mock premium checkout lifecycle.
 */
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
