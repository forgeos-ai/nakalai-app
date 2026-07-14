-- Multi-tenant student lead capture (Path B) — conversion metrics
-- Required: full_name, email, mobile_number, dpdp_consent, source_app
-- Conversion: payment_status ('unpaid'|'paid'), paid_at (timestamptz)
-- Optional: college_name, graduation_year
-- Run in the Supabase SQL editor before enabling downloads in production.

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  mobile_number text not null,
  college_name text,
  graduation_year integer,
  dpdp_consent boolean not null default false,
  source_app text not null default 'nakalai',
  payment_status text not null default 'unpaid',
  paid_at timestamptz,
  tier_type text not null default 'standard',
  amount_inr integer not null default 0,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint student_profiles_mobile_indian check (mobile_number ~ '^[6-9][0-9]{9}$'),
  constraint student_profiles_dpdp_true check (dpdp_consent = true),
  constraint student_profiles_source_app_nonempty check (char_length(trim(source_app)) > 0),
  constraint student_profiles_email_nonempty check (char_length(trim(email)) > 3),
  constraint student_profiles_payment_status_check check (payment_status in ('unpaid', 'paid')),
  constraint student_profiles_tier_type_check check (tier_type in ('standard', 'premium'))
);

-- Safe upgrade paths for existing tables
alter table public.student_profiles
  add column if not exists source_app text not null default 'nakalai';

alter table public.student_profiles
  add column if not exists email text;

alter table public.student_profiles
  add column if not exists payment_status text not null default 'unpaid';

alter table public.student_profiles
  add column if not exists paid_at timestamptz;

alter table public.student_profiles
  add column if not exists tier_type text not null default 'standard';

alter table public.student_profiles
  add column if not exists amount_inr integer not null default 0;

-- Allow optional college / year on existing installs
do $$
begin
  alter table public.student_profiles alter column college_name drop not null;
exception
  when undefined_column then null;
  when others then null;
end $$;

do $$
begin
  alter table public.student_profiles alter column graduation_year drop not null;
exception
  when undefined_column then null;
  when others then null;
end $$;

create index if not exists student_profiles_source_app_idx
  on public.student_profiles (source_app);

create index if not exists student_profiles_email_idx
  on public.student_profiles (email);

create index if not exists student_profiles_payment_status_idx
  on public.student_profiles (source_app, payment_status);

alter table public.student_profiles enable row level security;

drop policy if exists "anon_insert_student_profiles" on public.student_profiles;
create policy "anon_insert_student_profiles"
  on public.student_profiles
  for insert
  to anon
  with check (
    dpdp_consent = true
    and char_length(trim(source_app)) > 0
    and char_length(trim(email)) > 3
    and mobile_number ~ '^[6-9][0-9]{9}$'
  );

-- Payment conversion is server-written only (see student_profiles_rls_hardening.sql).
-- Do NOT grant anon UPDATE on payment_status — browsers must not stamp paid rows.
drop policy if exists "anon_update_payment_status" on public.student_profiles;

drop policy if exists "authenticated_read_student_profiles" on public.student_profiles;
create policy "authenticated_read_student_profiles"
  on public.student_profiles
  for select
  to authenticated
  using (true);
