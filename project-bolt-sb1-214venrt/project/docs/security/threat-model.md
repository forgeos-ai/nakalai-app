# NakalAI Threat Model

This document records known threats, current protections, and planned improvements. Update when adding API routes, payment logic, or file upload surfaces.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Payment API, download tokens, file uploads (client) | Handwriting engine internals |
| Vite SPA + Vercel serverless | Third-party Razorpay infrastructure |
| Supabase RLS (leads) | Physical device compromise |

---

## SQL Injection

| Field | Detail |
|-------|--------|
| **Threat** | Attacker injects SQL via API fields or Supabase client |
| **Impact** | Data breach, ledger tampering |
| **Protection** | Supabase parameterized queries; no raw SQL in API routes; RLS on client tables; service role server-only |
| **Future improvements** | Audit all server inserts; least-privilege DB roles |

---

## Cross-Site Scripting (XSS)

| Field | Detail |
|-------|--------|
| **Threat** | Malicious script in assignment text or uploaded content |
| **Impact** | Session theft, fake checkout UI, token exfiltration |
| **Protection** | React escapes text by default; CSP in `vercel.json`; no `dangerouslySetInnerHTML` on user content; canvas renders text, not HTML |
| **Future improvements** | Stricter CSP (`unsafe-inline` reduction); sanitize export filenames |

---

## Cross-Site Request Forgery (CSRF)

| Field | Detail |
|-------|--------|
| **Threat** | Third-party site triggers payment verify or download authorize |
| **Impact** | Unauthorized actions using victim session |
| **Protection** | Same-origin API calls; `Content-Type: application/json` POST; no cookie-based auth for payment; tokens are HMAC-signed bodies not cookies |
| **Future improvements** | Optional `Origin` header check on `/api/payments/*` |

---

## Path Traversal

| Field | Detail |
|-------|--------|
| **Threat** | Attacker requests `../../../etc/passwd` via API or static host |
| **Impact** | File disclosure |
| **Protection** | No server file reads from user paths; Vite SPA rewrite to `index.html`; API routes are fixed paths only |
| **Future improvements** | Audit any future file-serving endpoints |

---

## Replay Attacks (Payment)

| Field | Detail |
|-------|--------|
| **Threat** | Re-submit same `razorpay_payment_id` to `/verify` for multiple unlocks |
| **Impact** | One payment → unlimited downloads |
| **Protection** | `markPaymentProcessed(paymentId)` in `lib/security/idempotency.ts`; signature binds order+payment |
| **Future improvements** | Persist `payment_id` in Supabase with unique constraint (survives cold starts) |

---

## Replay Attacks (Download Grant)

| Field | Detail |
|-------|--------|
| **Threat** | Reuse `grantToken` for multiple PDF exports |
| **Impact** | One payment → many notebooks |
| **Protection** | Grant includes `nonce`; **planned** `/api/downloads/consume` atomic burn |
| **Future improvements** | Wire consume endpoint; store consumed nonces in ledger |

---

## Download Token Theft

| Field | Detail |
|-------|--------|
| **Threat** | Attacker copies `paymentVerificationToken` or `grantToken` from DevTools |
| **Impact** | Unauthorized download within TTL |
| **Protection** | Short TTL (~5 min); HMAC signed with server secret; `contentHash` binding; HTTPS only |
| **Future improvements** | Bind token to IP hash (optional); single-use consume |

---

## Payment Forgery

| Field | Detail |
|-------|--------|
| **Threat** | Client fakes Razorpay success callback without real payment |
| **Impact** | Free premium downloads |
| **Protection** | Server verifies HMAC signature with `RAZORPAY_KEY_SECRET`; fetches order from Razorpay API |
| **Future improvements** | Webhook verification as secondary confirmation |

---

## Price Manipulation

| Field | Detail |
|-------|--------|
| **Threat** | Client sends lower `amountPaise` or swaps `packageId` after order |
| **Impact** | Revenue loss |
| **Protection** | Server creates order with authoritative price; verify compares Razorpay order amount to `amountPaiseForPackage(packageId)`; order notes store `package_id` |
| **Future improvements** | Reject verify if order older than N minutes |

---

## API Abuse

| Field | Detail |
|-------|--------|
| **Threat** | Brute-force tokens, spam create-order, DoS |
| **Impact** | Cost, degraded service |
| **Protection** | Rate limiting in `middleware.ts`; Vercel Firewall (documented); 429 responses |
| **Future improvements** | Wire `lib/security/rateLimit.ts`; per-route budgets; WAF bot challenge |

---

## Rate-Limit Bypass

| Field | Detail |
|-------|--------|
| **Threat** | Rotate IPs, distributed requests |
| **Impact** | Abuse despite per-isolate limits |
| **Protection** | Vercel WAF global rules; edge middleware per IP |
| **Future improvements** | Supabase-backed sliding window; Cloudflare-style bot score |

---

## Secret Leakage

| Field | Detail |
|-------|--------|
| **Threat** | Secrets in git, client bundle, API responses, logs |
| **Impact** | Full payment system compromise |
| **Protection** | `.gitignore` for `.env*`; server-only env readers; `safeLogger` scaffolding; no secret in `VITE_*` |
| **Future improvements** | CI secret scan (gitleaks); bundle analyzer gate |

---

## File Upload Abuse

| Field | Detail |
|-------|--------|
| **Threat** | Oversized PDF/image, polyglot files, MIME spoofing |
| **Impact** | Client DoS, parser crashes |
| **Protection** | `assertPdfSize` (15 MB), `assertImageSize` (8 MB); magic-byte checks in `src/security/fileValidation.ts`; single-file PDF gate; client-side only (no server storage) |
| **Future improvements** | Timeout on PDF parse; stricter image dimension caps |

---

## Watermark Bypass

| Field | Detail |
|-------|--------|
| **Threat** | Set `isPaid=true` in DevTools or call export with `skipWatermark: true` |
| **Impact** | Unpaid clean PDF |
| **Protection** | Production requires `/api/downloads/authorize` for `skipWatermark`; mock bypass disabled when `VITE_ALLOW_MOCK_PAYMENTS` unset |
| **Future improvements** | Require `/consume` before export; never trust client `mode: paid` alone |

---

## QR / Payment Substitution

| Field | Detail |
|-------|--------|
| **Threat** | User pays different Razorpay order than server created |
| **Impact** | Wrong amount captured or verify mismatch |
| **Protection** | Signature ties `payment_id` to `order_id`; server validates order notes match checkout `packageId` and `contentHash` |
| **Future improvements** | Display order amount in UI from server response only |

---

## Client-Side Trust (Mock Payments)

| Field | Detail |
|-------|--------|
| **Threat** | `localStorage` mock payment flags in production |
| **Impact** | Free premium |
| **Protection** | `allowMockPayments()` false in production builds; `requiresServerPaymentVerification()` true |
| **Future improvements** | Remove mock path from production bundle entirely |

---

## Threat review schedule

| When | Action |
|------|--------|
| Every payment PR | Update this document |
| Quarterly | Full threat model review |
| After incident | Root cause + new row |

## Related documents

- [SECURITY.md](./SECURITY.md)
- [payment-security.md](./payment-security.md)
- [api-security.md](./api-security.md)
- [secret-management.md](./secret-management.md)
