import { isSupabaseConfigured, supabase } from './utils/supabase';
import {
  SOURCE_APP,
  PAYMENT_STATUS_KEY,
  type SourceAppId,
} from './sourceApp';
import type { BillingTier } from './billing';
import { getPaymentReceipt, type PaymentReceipt } from './paymentGateway';
import {
  isValidIndianMobile,
  validateLeadFields,
} from './leadValidation';

export const STUDENT_PROFILE_KEY = `${SOURCE_APP}_student_profile`;

/** Append-only mock lead log for local / zero-infra development. */
export const LOCAL_LEADS_LOG_KEY = `${SOURCE_APP}_local_leads_log`;

export type PaymentStatus = 'unpaid' | 'paid';

export type StudentProfile = {
  fullName: string;
  email: string;
  mobileNumber: string;
  /** Optional — hidden in the simplified modal. */
  collegeName?: string;
  /** Optional — hidden in the simplified modal. */
  graduationYear?: number;
  dpdpConsent: boolean;
  sourceApp: SourceAppId;
  capturedAt: string;
  /** Conversion funnel: unpaid until mock/real UPI success. */
  paymentStatus: PaymentStatus;
  /** ISO timestamp when status flipped to paid; null while unpaid. */
  paidAt: string | null;
  /** standard (₹19 fonts) | premium (₹49 matched style) */
  tierType: BillingTier;
  /** Amount charged in INR at payment time (0 while unpaid). */
  amountInr: number;
};

/** Payload written to Supabase `student_profiles` (snake_case columns). */
export type StudentProfileInsert = {
  full_name: string;
  email: string;
  mobile_number: string;
  college_name: string | null;
  graduation_year: number | null;
  dpdp_consent: boolean;
  source_app: string;
  captured_at: string;
  payment_status: PaymentStatus;
  paid_at: string | null;
  tier_type: BillingTier;
  amount_inr: number;
};

export function getStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentProfile;
    if (
      typeof parsed.fullName !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.mobileNumber !== 'string' ||
      parsed.dpdpConsent !== true
    ) {
      return null;
    }
    return {
      ...parsed,
      sourceApp: parsed.sourceApp || SOURCE_APP,
      paymentStatus: parsed.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      paidAt: parsed.paidAt ?? null,
      tierType: parsed.tierType === 'premium' ? 'premium' : 'standard',
      amountInr: typeof parsed.amountInr === 'number' ? parsed.amountInr : 0,
    };
  } catch {
    return null;
  }
}

export function saveStudentProfileLocal(
  profile: Omit<
    StudentProfile,
    'capturedAt' | 'sourceApp' | 'paymentStatus' | 'paidAt' | 'tierType' | 'amountInr'
  > & {
    sourceApp?: SourceAppId;
    paymentStatus?: PaymentStatus;
    paidAt?: string | null;
    tierType?: BillingTier;
    amountInr?: number;
  },
): StudentProfile {
  const stored: StudentProfile = {
    ...profile,
    sourceApp: profile.sourceApp ?? SOURCE_APP,
    paymentStatus: profile.paymentStatus ?? 'unpaid',
    paidAt: profile.paidAt ?? null,
    tierType: profile.tierType ?? 'standard',
    amountInr: profile.amountInr ?? 0,
    capturedAt: new Date().toISOString(),
  };
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(stored));
  return stored;
}

/** @deprecated Prefer isValidIndianMobile from leadValidation. */
export function isValidMobileNumber(value: string): boolean {
  return isValidIndianMobile(value);
}

function toInsertRow(
  profile: Omit<
    StudentProfile,
    'capturedAt' | 'sourceApp' | 'paymentStatus' | 'paidAt' | 'tierType' | 'amountInr'
  > & {
    sourceApp?: SourceAppId;
    paymentStatus?: PaymentStatus;
    paidAt?: string | null;
    tierType?: BillingTier;
    amountInr?: number;
  },
  capturedAt: string,
  sourceApp: string,
): StudentProfileInsert {
  const college = profile.collegeName?.trim()
    ? profile.collegeName.trim()
    : null;
  const year =
    typeof profile.graduationYear === 'number' ? profile.graduationYear : null;
  const paymentStatus: PaymentStatus =
    profile.paymentStatus === 'paid' ? 'paid' : 'unpaid';
  const tierType: BillingTier =
    profile.tierType === 'premium' ? 'premium' : 'standard';

  return {
    full_name: profile.fullName.trim(),
    email: profile.email.trim().toLowerCase(),
    mobile_number: profile.mobileNumber.trim(),
    college_name: college,
    graduation_year: year,
    dpdp_consent: true,
    source_app: sourceApp,
    captured_at: capturedAt,
    payment_status: paymentStatus,
    paid_at: paymentStatus === 'paid' ? (profile.paidAt ?? capturedAt) : null,
    tier_type: tierType,
    amount_inr: profile.amountInr ?? 0,
  };
}

function toStoredProfile(
  row: StudentProfileInsert,
  sourceApp: string,
): StudentProfile {
  return {
    fullName: row.full_name,
    email: row.email,
    mobileNumber: row.mobile_number,
    collegeName: row.college_name ?? undefined,
    graduationYear: row.graduation_year ?? undefined,
    dpdpConsent: true,
    sourceApp,
    capturedAt: row.captured_at,
    paymentStatus: row.payment_status === 'paid' ? 'paid' : 'unpaid',
    paidAt: row.paid_at,
    tierType: row.tier_type === 'premium' ? 'premium' : 'standard',
    amountInr: row.amount_inr ?? 0,
  };
}

/**
 * Zero-infra mock: append lead to a local log + cache the session receipt.
 * Used when Supabase env keys are missing so local preview stays interactive.
 */
function saveLeadToLocalMock(
  row: StudentProfileInsert,
  sourceApp: string,
): StudentProfile {
  const stored = toStoredProfile(row, sourceApp);
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(stored));

  try {
    const raw = localStorage.getItem(LOCAL_LEADS_LOG_KEY);
    const log: StudentProfileInsert[] = raw
      ? (JSON.parse(raw) as StudentProfileInsert[])
      : [];
    log.push(row);
    localStorage.setItem(LOCAL_LEADS_LOG_KEY, JSON.stringify(log));
  } catch (err) {
    console.warn('[NakalAI] Could not append local leads log:', err);
  }

  if (import.meta.env.DEV) {
    console.info('[NakalAI] Lead saved to localStorage mock:', stored);
  }

  return stored;
}

/**
 * When mock UPI flips to Paid / Unpaid, stamp payment_status, paid_at,
 * tier_type, and amount_inr on the cached profile + local leads log.
 */
export function syncLocalPaymentStatus(
  paid: boolean,
  receipt?: PaymentReceipt | null,
): StudentProfile | null {
  const now = new Date().toISOString();
  const paymentStatus: PaymentStatus = paid ? 'paid' : 'unpaid';
  const tierType: BillingTier =
    receipt?.tier_type === 'premium' ? 'premium' : 'standard';
  const amountInr = paid ? (receipt?.amount_inr ?? 0) : 0;
  let updatedProfile: StudentProfile | null = null;

  try {
    const existing = getStudentProfile();
    if (existing) {
      updatedProfile = {
        ...existing,
        paymentStatus,
        paidAt: paid
          ? existing.paymentStatus === 'paid' && existing.paidAt
            ? existing.paidAt
            : receipt?.paid_at ?? now
          : null,
        tierType,
        amountInr,
      };
      localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(updatedProfile));
    }
  } catch (err) {
    console.warn('[NakalAI] Could not update local student profile payment:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_LEADS_LOG_KEY);
    if (raw) {
      const log = JSON.parse(raw) as StudentProfileInsert[];
      const email = updatedProfile?.email?.toLowerCase();
      const mobile = updatedProfile?.mobileNumber;

      const next = log.map((row, index) => {
        const matchesProfile =
          Boolean(email) &&
          Boolean(mobile) &&
          row.email?.toLowerCase() === email &&
          row.mobile_number === mobile;

        const isLastWithoutProfile =
          !updatedProfile && index === log.length - 1;

        if (!matchesProfile && !isLastWithoutProfile) return row;

        return {
          ...row,
          payment_status: paymentStatus,
          paid_at: paid
            ? row.payment_status === 'paid' && row.paid_at
              ? row.paid_at
              : receipt?.paid_at ?? now
            : null,
          tier_type: tierType,
          amount_inr: amountInr,
        };
      });

      localStorage.setItem(LOCAL_LEADS_LOG_KEY, JSON.stringify(next));
    }
  } catch (err) {
    console.warn('[NakalAI] Could not update local leads log payment:', err);
  }

  // Best-effort remote sync when Supabase is configured
  if (isSupabaseConfigured && updatedProfile) {
    void supabase
      .from('student_profiles')
      .update({
        payment_status: paymentStatus,
        paid_at: updatedProfile.paidAt,
        tier_type: tierType,
        amount_inr: amountInr,
      })
      .eq('email', updatedProfile.email)
      .eq('mobile_number', updatedProfile.mobileNumber)
      .eq('source_app', updatedProfile.sourceApp)
      .then(({ error }) => {
        if (error) {
          console.warn('[NakalAI] Supabase payment_status update failed:', error);
        }
      });
  }

  if (import.meta.env.DEV) {
    console.info('[NakalAI] Payment status synced:', {
      paymentStatus,
      tierType,
      amountInr,
      paidAt: updatedProfile?.paidAt ?? (paid ? now : null),
    });
  }

  return updatedProfile;
}

/**
 * Inserts a consenting student profile into Supabase `student_profiles`
 * when configured; otherwise persists via localStorage mock (dev-friendly).
 * Always re-validates client-side before any write.
 */
export async function submitStudentProfile(
  profile: Omit<
    StudentProfile,
    'capturedAt' | 'sourceApp' | 'paymentStatus' | 'paidAt' | 'tierType' | 'amountInr'
  > & {
    sourceApp?: SourceAppId;
    paymentStatus?: PaymentStatus;
    paidAt?: string | null;
    tierType?: BillingTier;
    amountInr?: number;
  },
): Promise<StudentProfile> {
  const fieldErrors = validateLeadFields({
    fullName: profile.fullName,
    email: profile.email,
    mobileNumber: profile.mobileNumber,
    dpdpConsent: profile.dpdpConsent,
  });
  if (Object.keys(fieldErrors).length > 0) {
    throw new Error(Object.values(fieldErrors)[0] ?? 'Invalid profile data.');
  }

  const sourceApp = profile.sourceApp ?? SOURCE_APP;
  const capturedAt = new Date().toISOString();

  // Inherit current mock payment state if user paid before submitting the lead
  let paymentStatus: PaymentStatus = profile.paymentStatus ?? 'unpaid';
  let paidAt: string | null = profile.paidAt ?? null;
  let tierType: BillingTier = profile.tierType ?? 'standard';
  let amountInr = profile.amountInr ?? 0;
  try {
    if (localStorage.getItem(PAYMENT_STATUS_KEY) === 'true') {
      paymentStatus = 'paid';
      paidAt = paidAt ?? new Date().toISOString();
    }
    const receipt = getPaymentReceipt();
    if (receipt) {
      tierType = receipt.tier_type;
      amountInr = receipt.payment_status === 'paid' ? receipt.amount_inr : amountInr;
      if (receipt.paid_at) paidAt = paidAt ?? receipt.paid_at;
    }
  } catch {
    // ignore
  }

  const row = toInsertRow(
    { ...profile, paymentStatus, paidAt, tierType, amountInr },
    capturedAt,
    sourceApp,
  );

  // Local / unconfigured: mock storage — no blocking alert
  if (!isSupabaseConfigured) {
    return saveLeadToLocalMock(row, sourceApp);
  }

  try {
    const { error } = await supabase.from('student_profiles').insert(row);

    if (error) {
      console.error('Supabase student_profiles insert failed:', error);
      // Soft fallback so local demos still work if the remote table isn't ready
      if (import.meta.env.DEV) {
        console.warn(
          '[NakalAI] Falling back to localStorage mock after Supabase error.',
        );
        return saveLeadToLocalMock(row, sourceApp);
      }
      throw new Error(error.message || 'Failed to save profile. Please try again.');
    }

    const stored = toStoredProfile(row, sourceApp);
    localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(stored));
    return stored;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[NakalAI] Supabase unreachable — using localStorage mock.',
        err,
      );
      return saveLeadToLocalMock(row, sourceApp);
    }
    throw err instanceof Error
      ? err
      : new Error('Failed to save profile. Please try again.');
  }
}
