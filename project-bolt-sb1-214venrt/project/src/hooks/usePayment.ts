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
import { getCheckoutQuote, type CheckoutQuote } from '../billing';
import { syncLocalPaymentStatus, getStudentProfile } from '../studentProfile';

const GATEWAY_DELAY_MS = 1500;

export type PremiumCheckoutResult = {
  ok: boolean;
  receipt: PaymentReceipt | null;
  quote: CheckoutQuote;
  ledgerSynced: boolean;
  error?: string;
};

export type UsePaymentOptions = {
  /** When true, quote is premium ₹49 (Match My Style active). */
  hasMatchedStyle: boolean;
  /** Called after a successful simulated gateway + local unlock. */
  onPaid?: (receipt: PaymentReceipt, quote: CheckoutQuote) => void;
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
 * Mock payment gate — simulates Razorpay/Stripe checkout for the premium tier.
 *
 * Step A: isProcessingPayment = true
 * Step B: 1.5s network delay
 * Step C: Supabase ledger upsert + local paid receipt
 */
export async function initiatePremiumCheckout(
  userId: string,
  hasMatchedStyle = true,
): Promise<PremiumCheckoutResult> {
  const quote = getCheckoutQuote(hasMatchedStyle);

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
    ledgerSynced: ledger.ok,
    error: ledger.error,
  };
}

/**
 * React hook wrapping the mock premium checkout lifecycle.
 */
export function usePayment({ hasMatchedStyle, onPaid }: UsePaymentOptions) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PremiumCheckoutResult | null>(
    null,
  );

  const startPremiumCheckout = useCallback(
    async (userIdOverride?: string) => {
      if (isProcessingPayment) return null;

      setIsProcessingPayment(true);
      setPaymentError(null);

      try {
        const userId =
          (userIdOverride?.trim() || resolveCheckoutUserId()).toLowerCase();
        const result = await initiatePremiumCheckout(userId, hasMatchedStyle);
        setLastResult(result);

        if (result.ok && result.receipt) {
          onPaid?.(result.receipt, result.quote);
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
    [hasMatchedStyle, isProcessingPayment, onPaid],
  );

  return {
    isProcessingPayment,
    paymentError,
    lastResult,
    initiatePremiumCheckout: startPremiumCheckout,
  };
}
