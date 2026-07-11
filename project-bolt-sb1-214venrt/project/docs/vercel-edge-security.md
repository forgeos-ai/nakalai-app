# =============================================================================
# Vercel Edge Security — rate limiting & WAF (NakalAI lead capture)
# =============================================================================
#
# Middleware (`middleware.ts`) throttles POST/PUT/PATCH to:
#   /api/leads, /api/student-profiles, /api/profiles
#
# Default threshold: 5 writes / IP / path / 60s (per Edge isolate).
# For global IP shielding across all regions, enable Vercel WAF / Firewall.
#
# -----------------------------------------------------------------------------
# 1) Project environment variables (Vercel Dashboard → Settings → Environment)
# -----------------------------------------------------------------------------

# Max lead-commit attempts per IP+path inside one sliding window
LEAD_RATE_LIMIT_MAX=5

# Window length in milliseconds (60000 = 1 minute)
LEAD_RATE_LIMIT_WINDOW_MS=60000

# Optional: custom secret if you later proxy leads through /api/leads
# LEAD_SUBMIT_SECRET=

# Existing Supabase keys (browser anon — keep RLS insert-only)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# -----------------------------------------------------------------------------
# 2) Vercel Firewall / WAF (Dashboard → Security → Firewall)
#    These are configured in the Vercel UI (not always as .env keys).
#    Documented names for ops checklists:
# -----------------------------------------------------------------------------
#
#   VERCEL_WAF_ENABLED=true
#     → Turn on Vercel Firewall for the project.
#
#   VERCEL_FIREWALL_RATE_LIMIT_RULE
#     → Create a custom rule: Rate Limit
#       Match: Path equals /api/leads  OR  Path starts with /api/leads
#              Method is POST
#       Action: Rate limit  (e.g. 10 requests / 60s / IP)
#       Then: Deny / Challenge
#
#   VERCEL_FIREWALL_BOT_MANAGEMENT
#     → Enable Bot Protection / Challenge on /api/* write routes.
#
#   VERCEL_FIREWALL_GEO_BLOCK (optional)
#     → Deny high-abuse regions if needed for the free DB tier.
#
# Official docs:
#   https://vercel.com/docs/vercel-firewall
#   https://vercel.com/docs/routing-middleware
# =============================================================================
