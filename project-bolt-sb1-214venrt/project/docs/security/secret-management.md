# Secret Management

NakalAI secrets must never reach the browser bundle, git history, or client-side logs.

## Never commit

| File | Reason |
|------|--------|
| `.env` | Local development secrets |
| `.env.local` | Local overrides |
| `.env.production` | Production values |
| `.env.development.local` | Local dev overrides |
| `.env.test.local` | Test overrides |
| Any file with live API keys | Irreversible exposure |

## Git ignore rules (required)

The project `.gitignore` must contain:

```gitignore
.env
.env.*
!.env.example
```

Current status: **configured** in `project/.gitignore`.

The repository root `.gitignore` also ignores `.env*`. Never remove `!.env.example` from the project ignore file.

## Never expose to the browser

| Secret | Purpose |
|--------|---------|
| `RAZORPAY_KEY_SECRET` | Razorpay API + signature verification |
| `DOWNLOAD_TOKEN_SECRET` | HMAC signing for payment/download tokens |

### Safe for browser (public)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Checkout.js public key |

> Prefer returning `keyId` from `POST /api/payments/create-order` so the client never hardcodes keys.

## Server-only variables

Set in **Vercel → Project → Settings → Environment Variables** (Production, Preview, Development as needed).

| Variable | Required | Notes |
|----------|----------|-------|
| `RAZORPAY_KEY_ID` | Production | Live or test key ID |
| `RAZORPAY_KEY_SECRET` | Production | **Server only** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Public key if not returned from API |
| `DOWNLOAD_TOKEN_SECRET` | Production | `openssl rand -base64 32` |
| `PAYMENT_RATE_LIMIT_MAX` | Recommended | Default `10` |
| `PAYMENT_RATE_LIMIT_WINDOW_MS` | Recommended | Default `60000` |

## Never prefix server secrets with

- `VITE_` — bundled into client
- `NEXT_PUBLIC_` — exposed to browser (except Razorpay **key ID**)

## Local development

1. Copy `project/.env.example` → `project/.env`
2. Fill values locally; file is gitignored
3. Use Razorpay **test** keys for development
4. `VITE_ALLOW_MOCK_PAYMENTS=true` — **dev only**, never production

## Secret rotation

| Secret | When to rotate |
|--------|----------------|
| `RAZORPAY_KEY_SECRET` | Compromise suspicion, team offboarding |
| `DOWNLOAD_TOKEN_SECRET` | Compromise suspicion; invalidates outstanding tokens |

After rotation: redeploy Vercel, verify payment + download flow.

## Code review checklist

- [ ] No `import.meta.env` reads of secret keys in `src/`
- [ ] No `console.log` of payment signatures or tokens
- [ ] `lib/security/env.ts` only imported from server routes
- [ ] `.env.example` contains placeholders only, no real values

## Reference

See `project/.env.example` for the canonical variable list.
