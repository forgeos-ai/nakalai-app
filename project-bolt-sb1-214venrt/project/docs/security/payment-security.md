# Payment Security Architecture

NakalAI uses **guest checkout only** via **Razorpay Checkout**. The browser opens checkout; the server decides whether payment succeeded and whether download is authorized.

## Principle

```
No verification = No download
```

The browser must **never** decide:

- Payment success
- Watermark removal
- Premium activation
- Download authorization

## End-to-end flow

```
Client (Browser)
    │
    ▼
POST /api/payments/create-order
    │  Body: { packageId, contentHash }
    │  Server: resolve price, create Razorpay order
    ▼
Client opens Razorpay Checkout (Checkout.js)
    │  Uses public keyId + orderId from server
    ▼
Payment Success (Razorpay handler callback)
    │
    ▼
POST /api/payments/verify
    │  Body: razorpay_order_id, razorpay_payment_id,
    │         razorpay_signature, packageId, contentHash
    │
    │  Server verifies:
    │    ✓ Signature (HMAC-SHA256)
    │    ✓ Order ID exists at Razorpay
    │    ✓ Payment ID matches signature
    │    ✓ Amount matches server package price
    │    ✓ Currency is INR
    │    ✓ Package ID matches order notes
    │    ✓ Content hash matches order notes
    │    ✓ Payment ID not already processed (replay protection)
    ▼
Issue short-lived Payment Verification Token (HMAC, ~5 min TTL)
    │
    ▼
POST /api/downloads/authorize (mode: paid)
    │  Body: paymentVerificationToken, contentHash, layoutPageCount, packageId
    │  Server: validate token, issue Download Grant Token
    ▼
POST /api/downloads/consume (planned — one-time use)
    │  Body: grantToken, contentHash
    │  Server: atomically burn grant nonce
    ▼
Client exports PDF locally (watermark off per server grant)
    │
    ▼
Destroy session entitlement (no permanent premium)
```

## Token chain

| Token | Issued by | TTL | Binds |
|-------|-----------|-----|-------|
| Razorpay `order_id` | Razorpay via server | Order lifetime | `package_id`, `content_hash` in notes |
| Payment verification token | Server `/verify` | ~5 minutes | `paymentId`, `orderId`, `packageId`, `contentHash`, `amountPaise` |
| Download grant token | Server `/authorize` | ~5 minutes | `mode`, `maxPages`, `contentHash`, `packageId`, `paymentId`, `nonce` |

## Server responsibilities

| Action | Owner |
|--------|-------|
| Razorpay order creation | Server (`create-order`) |
| Amount / currency validation | Server (`verify` + Razorpay order fetch) |
| Package validation | Server (canonical `PRICING_PACKAGES` mirror) |
| Signature verification | Server (`RAZORPAY_KEY_SECRET`) |
| Download token signing | Server (`DOWNLOAD_TOKEN_SECRET`) |
| Replay protection | Server (persistent `payment_id` + grant `nonce`) |
| Rate limiting | Server / Edge middleware |

## Client responsibilities

| Action | Allowed |
|--------|---------|
| Compute `contentHash` from assignment text + page count + package | Yes |
| Call `create-order`, `verify`, `authorize`, `consume` | Yes |
| Open Razorpay Checkout with server `orderId` | Yes |
| Set UI `isPaid` **only after** `/verify` returns `ok: true` | Yes |
| Export PDF locally after server grants `skipWatermark` | Yes |
| Set `isPaid` from `localStorage` in production | **No** |
| Skip verify and export as paid | **No** |
| Send client-computed `amountPaise` as authoritative | **No** |

## Content binding

`contentHash` fingerprints the assignment at checkout time:

```
SHA-256({ text, layoutPageCount, packageId, v: 1 })
```

If the user edits text after payment, the hash changes and server tokens must reject authorization (content mismatch).

## Free vs paid downloads

| Mode | Watermark | Page cap | Server path |
|------|-----------|----------|-------------|
| `free` | On | 3 pages | `/authorize` with `mode: free` |
| `paid` | Off (after verify) | Package pages | `/verify` → `/authorize` → `/consume` |

## Existing implementation reference

| Module | Location |
|--------|----------|
| Create order route | `app/api/payments/create-order/route.ts` |
| Verify route | `app/api/payments/verify/route.ts` |
| Authorize route | `app/api/downloads/authorize/route.ts` |
| Razorpay client | `lib/security/razorpay.ts` |
| Token grants | `lib/security/downloadGrant.ts` |
| Client checkout hook | `src/hooks/usePayment.ts` |
| Client authorize wrapper | `src/security/downloadAuthorization.ts` |

> **Note:** Routes under `app/api/` must migrate to Vercel `api/` functions for pure Vite deployment. URLs remain `/api/payments/*` and `/api/downloads/*`.

## Failure modes

| Condition | Result |
|-----------|--------|
| Signature invalid | 403 — no token, no download |
| Amount mismatch | 403 — no unlock |
| Payment replay | 409 — no second download from same payment |
| Token expired | 403 — user must verify again or re-pay |
| Content changed | 403 — user must pay for new assignment |

## Privacy

Payment endpoints store **no assignment text**. Only `contentHash` (one-way fingerprint) and payment metadata.
