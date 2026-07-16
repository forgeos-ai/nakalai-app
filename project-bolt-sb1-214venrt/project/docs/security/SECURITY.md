# NakalAI Security Engineering Constitution

This document is the **permanent security standard** for NakalAI. Every sprint, pull request, and deployment must obey these rules. Security is part of the repository—not something developers remember ad hoc.

## Mission alignment

NakalAI is **browser-first**, **privacy-first**, and **near-zero infrastructure cost**. Security protects revenue, user trust, and the frozen handwriting engine without introducing server-side rendering, OCR, or permanent user data storage.

## Non-negotiable rules

### Payment trust

| Rule | Requirement |
|------|-------------|
| **Never trust client-side payment success** | `isPaid`, `localStorage`, `sessionStorage`, and Razorpay client callbacks are **hints only**. Premium unlock requires server verification. |
| **Razorpay signature MUST be verified server-side** | Use HMAC-SHA256 over `order_id\|payment_id` with `RAZORPAY_KEY_SECRET`. |
| **Downloads unlock ONLY after successful verification** | Paid export requires a server-issued, short-lived token chain. No verification → no download. |
| **Browser NEVER receives Razorpay Secret** | `RAZORPAY_KEY_SECRET` is server-only (Vercel env). |
| **Browser ONLY receives public key** | `NEXT_PUBLIC_RAZORPAY_KEY_ID` (or server-returned `keyId` from create-order). |
| **Browser never decides payment amount** | Client displays prices for UX; server computes `amountPaise` from the canonical package table. |
| **Server owns package pricing** | `packageId` → server price lookup. Reject client-supplied amounts. |

### Data lifecycle

```
Generate → Preview → Payment → Download → Destroy
```

| Rule | Requirement |
|------|-------------|
| **No permanent storage of user content** | Do not store assignment text, PDFs, photos, OCR output, or rendered handwriting on the server. |
| **Generated notebook files are temporary** | PDF export happens in the browser. Server never receives notebook bytes. |
| **Payment metadata only** | Server may store minimal audit fields: `payment_id`, `order_id`, `package_id`, `content_hash`, timestamps—for replay protection and fraud investigation. |

### Frozen subsystems

Do **not** modify these in security sprints unless explicitly instructed:

- CanvasRenderer
- VariationEngine
- FontRegistry
- Match My Writing rendering logic
- Standard rendering logic
- OCR / handwriting pipelines

Security changes must be **additive** at API boundaries and documentation—not rewrites of rendering.

### Architecture

| Layer | Responsibility |
|-------|----------------|
| **Browser** | Preview, OCR, rendering, PDF generation, opening Razorpay Checkout |
| **Server** | Order creation, signature verification, token signing, rate limits, abuse prevention |
| **Never on server** | OCR, handwriting rendering, AI inference, file storage |

## Secret exposure policy

See [secret-management.md](./secret-management.md).

**Never commit:** `.env`, `.env.local`, `.env.production`, or any file containing live secrets.

**Never expose to client bundles:** `RAZORPAY_KEY_SECRET`, `DOWNLOAD_TOKEN_SECRET`.

## API policy

See [api-security.md](./api-security.md).

Every `/api/*` route must validate input, use server-side pricing, rate-limit writes, sanitize errors, and never return stack traces.

## Payment policy

See [payment-security.md](./payment-security.md).

## Threat awareness

See [threat-model.md](./threat-model.md).

## Deployment

See [deployment-checklist.md](./deployment-checklist.md).

Run the checklist **before every production deployment**.

## Related files

| Document | Purpose |
|----------|---------|
| [payment-security.md](./payment-security.md) | Razorpay flow and token chain |
| [secret-management.md](./secret-management.md) | Env vars and `.gitignore` |
| [api-security.md](./api-security.md) | Endpoint requirements |
| [threat-model.md](./threat-model.md) | Threats and mitigations |
| [deployment-checklist.md](./deployment-checklist.md) | Pre-ship verification |

## Scaffolding (not yet wired)

Reusable helpers live under `lib/security/`:

- `validation.ts` — input/schema helpers
- `rateLimit.ts` — IP/path throttling primitive
- `safeLogger.ts` — secret-redacting logs
- `secureCompare.ts` — timing-safe comparison

These are **scaffolding only** until explicitly wired in a payment sprint.

## Change control

Any PR that touches `/api/*`, `lib/security/*`, `src/security/*`, payment flow, or download authorization must:

1. Reference this constitution
2. Update threat-model or payment-security docs if behavior changes
3. Pass `deployment-checklist.md` items relevant to the change
