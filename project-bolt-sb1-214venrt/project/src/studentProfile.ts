import { isSupabaseConfigured, supabase } from './utils/supabase';

export const STUDENT_PROFILE_KEY = 'nakalai_student_profile';

export const GRADUATION_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export type GraduationYear = (typeof GRADUATION_YEARS)[number];

export type StudentProfile = {
  fullName: string;
  mobileNumber: string;
  collegeName: string;
  graduationYear: GraduationYear;
  dpdpConsent: boolean;
  capturedAt: string;
};

/** Payload written to Supabase `student_profiles` (snake_case columns). */
export type StudentProfileInsert = {
  full_name: string;
  mobile_number: string;
  college_name: string;
  graduation_year: number;
  dpdp_consent: boolean;
  captured_at: string;
};

export function getStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentProfile;
    if (
      typeof parsed.fullName !== 'string' ||
      typeof parsed.mobileNumber !== 'string' ||
      typeof parsed.collegeName !== 'string' ||
      typeof parsed.graduationYear !== 'number' ||
      parsed.dpdpConsent !== true
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStudentProfileLocal(
  profile: Omit<StudentProfile, 'capturedAt'>,
): StudentProfile {
  const stored: StudentProfile = {
    ...profile,
    capturedAt: new Date().toISOString(),
  };
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(stored));
  return stored;
}

export function isValidMobileNumber(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/**
 * Inserts a consenting student profile into Supabase `student_profiles`
 * (RLS: anon INSERT only), then caches a local receipt so the modal
 * does not re-prompt on subsequent downloads in this browser.
 */
export async function submitStudentProfile(
  profile: Omit<StudentProfile, 'capturedAt'>,
): Promise<StudentProfile> {
  if (!profile.dpdpConsent) {
    throw new Error('DPDP consent is required before we can store your profile.');
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    );
  }

  const capturedAt = new Date().toISOString();
  const row: StudentProfileInsert = {
    full_name: profile.fullName.trim(),
    mobile_number: profile.mobileNumber.trim(),
    college_name: profile.collegeName.trim(),
    graduation_year: profile.graduationYear,
    dpdp_consent: true,
    captured_at: capturedAt,
  };

  const { error } = await supabase.from('student_profiles').insert(row);

  if (error) {
    console.error('Supabase student_profiles insert failed:', error);
    throw new Error(error.message || 'Failed to save profile. Please try again.');
  }

  const stored: StudentProfile = {
    ...profile,
    fullName: row.full_name,
    mobileNumber: row.mobile_number,
    collegeName: row.college_name,
    capturedAt,
  };
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(stored));
  return stored;
}
