-- Premium subscription ledger — server-written only.
-- Browser anon client must never upsert premium_access.

create table if not exists public.user_subscriptions (
  user_id text primary key,
  premium_access boolean not null default false,
  downloaded_passes integer not null default 0,
  razorpay_payment_id text,
  razorpay_order_id text,
  package_id text,
  amount_inr integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_subscriptions_payment_id_idx
  on public.user_subscriptions (razorpay_payment_id);

alter table public.user_subscriptions enable row level security;

-- No anon policies — all writes require service role from verified payment API routes.
drop policy if exists "anon_upsert_user_subscriptions" on public.user_subscriptions;

-- Optional: authenticated read for a future signed-in dashboard
drop policy if exists "authenticated_read_own_subscription" on public.user_subscriptions;
create policy "authenticated_read_own_subscription"
  on public.user_subscriptions
  for select
  to authenticated
  using (auth.uid()::text = user_id);
