# Sprint 2B — Phase 1: Secure Order Creation

**Status:** Implemented (create-order only). Checkout popup is **not** implemented in this phase.

## Objective

Prepare NakalAI to securely create Razorpay Orders. The browser never calculates prices, never creates orders, and never receives `RAZORPAY_KEY_SECRET`.

## Endpoint

```
POST /api/payments/create-order
```

**Deploy surface:** `api/payments/create-order.ts` (Vercel Serverless, Node.js)

## Request

```json
{
  "packageId": "P3"
}
```

Optional (forward-compatible, stored in Razorpay order notes only):

```json
{
  "packageId": "P20",
  "contentHash": "sha256_hex_fingerprint"
}
```

### Rejected inputs

| Condition | HTTP | Code |
|-----------|------|------|
| Missing `packageId` | 400 | `VALIDATION_ERROR` |
| Unknown `packageId` | 400 | `VALIDATION_ERROR` |
| Client sends `amount`, `amountPaise`, `amountInr`, `price`, `currency` | 400 | `VALIDATION_ERROR` |
| Invalid JSON | 400 | `BAD_REQUEST` |
| Body > 4 KB | 413 | `VALIDATION_ERROR` |
| Rate limited | 429 | `RATE_LIMITED` |
| Razorpay not configured | 503 | `PAYMENT_NOT_CONFIGURED` |

## Response (success only)

```json
{
  "orderId": "order_xxxxxxxx",
  "currency": "INR",
  "amount": 1900,
  "publicKey": "rzp_test_xxxxxxxx",
  "packageId": "P3"
}
```

| Field | Meaning |
|-------|---------|
| `orderId` | Razorpay order ID |
| `currency` | Always `INR` |
| `amount` | Amount in **paise** (server-derived) |
| `publicKey` | `RAZORPAY_KEY_ID` (safe for Checkout.js later) |
| `packageId` | Canonical package echoed |

No stack traces. No Razorpay error bodies. No secrets.

## Canonical pricing (server-only)

Module: `lib/security/canonicalPricing.ts`

| Package | Price (INR) | Pages | Paise |
|---------|-------------|-------|-------|
| `P3` | ₹19 | 3 | 1900 |
| `P20` | ₹49 | 20 | 4900 |
| `P75` | ₹99 | 75 | 9900 |
| `P200` | ₹199 | 200 | 19900 |

Unknown packages return `400` — **no default fallback**.

> Client UI (`src/billing.ts`) is unchanged in Phase 1. Server pricing is authoritative for order creation.

## Module map

| File | Role |
|------|------|
| `api/payments/create-order.ts` | Vercel entrypoint |
| `lib/security/payments/createOrder.ts` | Handler orchestration |
| `lib/security/canonicalPricing.ts` | Authoritative price table |
| `lib/security/validation.ts` | Input + reject client amounts |
| `lib/security/rateLimit.ts` | Per-IP throttling |
| `lib/security/safeLogger.ts` | Redacted structured logs |
| `lib/security/razorpay.ts` | Razorpay REST (secret server-only) |

## Security guarantees (Phase 1)

- [x] Browser never computes price
- [x] Browser never creates Razorpay order
- [x] Browser never receives secret
- [x] Server owns pricing
- [x] Client amount fields rejected
- [x] Rate limiting on create-order
- [x] Safe logging (no secrets)
- [ ] Checkout popup (Phase 2)
- [ ] Payment verify (Phase 2+)
- [ ] Download authorize/consume (Phase 2+)

## Environment variables

| Variable | Required | Exposure |
|----------|----------|----------|
| `RAZORPAY_KEY_ID` | Yes | Returned as `publicKey` only |
| `RAZORPAY_KEY_SECRET` | Yes | Server only |
| `PAYMENT_RATE_LIMIT_MAX` | Optional | Default 10 for create-order |
| `PAYMENT_RATE_LIMIT_WINDOW_MS` | Optional | Default 60000 |

## Manual test (curl)

```bash
curl -s -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"packageId":"P3"}'
```

Expected with valid Razorpay test keys: `orderId`, `currency`, `amount`, `publicKey`, `packageId`.

## Next phase (blocked on review)

1. Razorpay Checkout.js integration (client opens modal with `orderId` + `publicKey`)
2. `POST /api/payments/verify` wired to canonical pricing
3. Align or migrate client package IDs when pricing UI updates

## Out of scope (this sprint)

- UI changes
- Handwriting / rendering engine
- Founder notifications
- Download token changes
- Checkout popup
