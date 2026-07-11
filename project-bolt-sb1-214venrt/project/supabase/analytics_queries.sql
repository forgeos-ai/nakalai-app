-- =============================================================================
-- NakalAI conversion analytics (run in Supabase SQL editor)
-- Filter: source_app = 'nakalai'
-- =============================================================================

-- Query 1: Total leads captured for NakalAI
select count(*) as total_leads
from public.student_profiles
where source_app = 'nakalai';

-- Query 2: Total paid users for NakalAI
select count(*) as total_paid_users
from public.student_profiles
where source_app = 'nakalai'
  and payment_status = 'paid';

-- Query 3: Conversion rate (Paid Users / Total Leads)
select
  count(*) filter (where payment_status = 'paid') as paid_users,
  count(*) as total_leads,
  round(
    100.0 * count(*) filter (where payment_status = 'paid')
    / nullif(count(*), 0),
    2
  ) as conversion_rate_pct
from public.student_profiles
where source_app = 'nakalai';

-- Bonus: Revenue split by tier_type (standard ₹29 vs premium ₹59)
select
  tier_type,
  count(*) filter (where payment_status = 'paid') as paid_users,
  coalesce(sum(amount_inr) filter (where payment_status = 'paid'), 0) as revenue_inr
from public.student_profiles
where source_app = 'nakalai'
group by tier_type
order by tier_type;
