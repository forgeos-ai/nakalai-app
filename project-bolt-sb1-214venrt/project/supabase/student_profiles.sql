-- NakalAI student lead capture (Path B)
-- Run in the Supabase SQL editor before enabling downloads in production.

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile_number text not null,
  college_name text not null,
  graduation_year integer not null,
  dpdp_consent boolean not null default false,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint student_profiles_mobile_len check (char_length(mobile_number) = 10),
  constraint student_profiles_dpdp_true check (dpdp_consent = true)
);

alter table public.student_profiles enable row level security;

-- Anonymous clients may INSERT consented profiles only (no SELECT/UPDATE/DELETE from browser).
drop policy if exists "anon_insert_student_profiles" on public.student_profiles;
create policy "anon_insert_student_profiles"
  on public.student_profiles
  for insert
  to anon
  with check (dpdp_consent = true);

-- Optional: authenticated service/admin reads (service role bypasses RLS anyway).
drop policy if exists "authenticated_read_student_profiles" on public.student_profiles;
create policy "authenticated_read_student_profiles"
  on public.student_profiles
  for select
  to authenticated
  using (true);
