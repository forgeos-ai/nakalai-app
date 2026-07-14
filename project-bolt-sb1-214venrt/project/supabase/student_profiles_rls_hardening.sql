-- Harden student_profiles RLS — remove anon payment_status updates.
-- Payment conversion must be written server-side (service role) after Razorpay verification.
-- Run in Supabase SQL editor before production payment go-live.

drop policy if exists "anon_update_payment_status" on public.student_profiles;

-- Explicit deny: anon cannot mutate payment fields (default deny when no policy matches).
-- Inserts remain allowed via anon_insert_student_profiles.

-- Service role bypasses RLS — use only in trusted server routes after signature verification.
-- Example server update (not runnable here):
--   update student_profiles set payment_status='paid', paid_at=now(), ...
--   where email = $1 and mobile_number = $2 and source_app = 'nakalai';
