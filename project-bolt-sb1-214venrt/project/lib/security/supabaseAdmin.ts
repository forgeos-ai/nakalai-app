/**
 * Supabase service-role client — server routes only.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

let adminClient: SupabaseClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  return Boolean(url && key && !key.includes('YOUR_'));
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function recordVerifiedPayment(params: {
  userId?: string;
  paymentId: string;
  orderId: string;
  packageId: string;
  amountInr: number;
  email?: string;
  mobileNumber?: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  if (params.userId) {
    await admin.from('user_subscriptions').upsert(
      {
        user_id: params.userId,
        premium_access: true,
        downloaded_passes: 1,
        razorpay_payment_id: params.paymentId,
        razorpay_order_id: params.orderId,
        package_id: params.packageId,
        amount_inr: params.amountInr,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  if (params.email && params.mobileNumber) {
    await admin
      .from('student_profiles')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        tier_type: params.packageId.startsWith('match') ? 'premium' : 'standard',
        amount_inr: params.amountInr,
      })
      .eq('email', params.email)
      .eq('mobile_number', params.mobileNumber)
      .eq('source_app', 'nakalai');
  }
}
