import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Public anon client for Path B secure lead capture (multi-tenant fleet).
 *
 * Local development: if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are
 * missing or still placeholders, `isSupabaseConfigured` is false and the
 * lead pipeline falls back to localStorage (see `submitStudentProfile`).
 * No hard crash — the preview stays fully interactive without a remote DB.
 *
 * Production: set real keys in `.env` (see `.env.example`). Never expose the
 * service-role key in the browser. RLS should allow anon INSERT only.
 */

function readEnv(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  try {
    const value = import.meta.env[key];
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY');

function looksConfigured(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes('YOUR_') || key.includes('YOUR_')) return false;
  if (url.includes('placeholder') || key.includes('placeholder')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = looksConfigured(supabaseUrl, supabaseAnonKey);

/**
 * Always construct a client so imports stay stable.
 * When unconfigured, callers must not hit the network — use the local mock path.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info(
    '[NakalAI] Supabase keys not set — lead capture uses localStorage mock. Copy .env.example → .env to connect a real project.',
  );
}
