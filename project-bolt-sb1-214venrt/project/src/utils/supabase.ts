import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Public anon client for Path B secure lead capture.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env` (keys provided later).
 *
 * RLS on `student_profiles` should allow INSERT for the anon role only;
 * never expose the service-role key in the browser.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_') &&
    !supabaseAnonKey.includes('YOUR_'),
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
