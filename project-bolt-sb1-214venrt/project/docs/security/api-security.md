# API Security Standards

Every NakalAI `/api/*` endpoint must satisfy this checklist before shipping to production.

## Mandatory requirements

| Requirement | Description |
|-------------|-------------|
| **Input validation** | Reject missing, malformed, or out-of-range fields with `400` + stable `code` |
| **Schema validation** | Define explicit request body types; validate before business logic |
| **Server-side pricing** | Never trust client `amount`, `amountPaise`, or `price` fields |
| **Rate limiting** | Throttle write endpoints (`POST`, `PUT`, `PATCH`) per IP + path |
| **Authentication** | Where applicable (admin routes); guest payment routes use token/signature proof instead |
| **Authorization** | Paid download requires verified payment token + matching `contentHash` |
| **Error sanitization** | User-facing `error` string; no internal paths or secrets |
| **Secret-safe logging** | Never log secrets, signatures, full tokens, or PII |
| **No stack traces** | Never return `stack`, `cause`, or raw `Error.message` from infrastructure |
| **Secure HTTP status codes** | `400` validation, `402` payment required, `403` forbidden, `409` replay, `429` rate limit, `502` upstream |

## Response shape

All JSON API responses should use:

```json
{
  "ok": true,
  "..."
}
```

Or on error:

```json
{
  "error": "Human-readable message",
  "code": "STABLE_MACHINE_CODE"
}
```

Use `lib/security/apiResponse.ts` → `jsonResponse(status, body)`.

Headers on every API response:

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```

## Endpoint inventory

| Method | Path | Auth model |
|--------|------|------------|
| `POST` | `/api/payments/create-order` | Rate limit; validates `packageId`, `contentHash` |
| `POST` | `/api/payments/verify` | Rate limit; Razorpay signature + server price |
| `POST` | `/api/downloads/authorize` | Free cap or payment verification token |
| `POST` | `/api/downloads/consume` | Download grant token (planned) |

## Input validation patterns

Use scaffolding in `lib/security/validation.ts` (when wired):

- Trim strings before validation
- Reject empty `packageId`, short `contentHash` (< 8 chars)
- `layoutPageCount` must be finite and ≥ 1
- Enum fields (`mode`) must match allowlist

## Rate limiting

Create-order uses `lib/security/rateLimit.ts`.

Defaults: `PAYMENT_RATE_LIMIT_MAX=10`, `PAYMENT_RATE_LIMIT_WINDOW_MS=60000`.

Production fleets should add **Vercel Firewall** rules (see `docs/vercel-edge-security.md`).

## Logging

Use `lib/security/safeLogger.ts` (when wired):

```ts
safeLog('info', 'order-created', { packageId, orderId }); // OK
safeLog('info', 'debug', { secret: process.env.RAZORPAY_KEY_SECRET }); // REDACTED
```

Never log:

- `RAZORPAY_KEY_SECRET`
- `razorpay_signature`
- Full `paymentVerificationToken` or `grantToken`
- Assignment text

## CORS and origin

API routes are same-origin (SPA on same Vercel domain). Do not add permissive `Access-Control-Allow-Origin: *` on payment routes.

## Security headers

Configured in `vercel.json`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (includes `checkout.razorpay.com`)
- `Referrer-Policy: strict-origin-when-cross-origin`

## Error code registry

| Code | HTTP | Meaning |
|------|------|---------|
| `BAD_REQUEST` | 400 | Malformed JSON |
| `VALIDATION_ERROR` | 400 | Missing/invalid fields |
| `PAYMENT_REQUIRED` | 402 | Paid download without token |
| `SIGNATURE_INVALID` | 403 | Razorpay verify failed |
| `AMOUNT_MISMATCH` | 403 | Tampered amount |
| `PACKAGE_MISMATCH` | 403 | Wrong package |
| `CONTENT_MISMATCH` | 403 | Assignment changed |
| `INVALID_PAYMENT_TOKEN` | 403 | Expired/invalid token |
| `PAYMENT_REPLAY` | 409 | Payment already used |
| `GRANT_REPLAY` | 409 | Download grant reused |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYMENT_NOT_CONFIGURED` | 503 | Missing env vars |
| `ORDER_FAILED` | 502 | Razorpay upstream error |

## PR checklist

Before merging API changes:

- [ ] Input validated
- [ ] Server-side pricing unchanged
- [ ] Errors sanitized
- [ ] Rate limit considered
- [ ] threat-model.md updated if new attack surface
- [ ] No secrets in client bundle
