# Sprint 2B — Phase 2: Razorpay Checkout Integration

**Status:** Implemented (Checkout popup only). Verification is **not** implemented.

## Objective

Open Razorpay Checkout using the server-created Order. The browser never creates orders, never computes pricing, and never receives `RAZORPAY_KEY_SECRET`.

## Flow

```
User selects package (existing UI)
  → POST /api/payments/create-order
  → { orderId, amount, currency, publicKey, packageId }
  → Razorpay Checkout.js modal
  → success | failure | cancel | timeout | network error
  → STOP (no verify, no download unlock)
```

## Client modules

| File | Role |
|------|------|
| `src/hooks/usePayment.ts` | create-order → open checkout; Phase 2 stops before verify |
| `src/security/razorpayCheckout.ts` | Load Checkout.js; sanitized user-facing errors |
| `src/components/ControlPanel.tsx` | Existing Pay CTA — unchanged layout |

## Server package resolution

`lib/security/canonicalPricing.ts` accepts:

- Canonical ids: `P3`, `P20`, `P75`, `P200`
- Legacy UI ids: `std-10`, `match-10`, `std-75`, `match-75` (mirror of `billing.ts` amounts)

## Security guarantees (Phase 2)

- [x] Browser never creates Razorpay order
- [x] Browser never computes checkout amount (uses server `amount`)
- [x] Only `publicKey` from create-order used in Checkout.js
- [x] No `/api/payments/verify` call
- [x] No download entitlement before server verification
- [x] No download unlock on checkout success
- [x] Raw Razorpay error payloads not shown to users
- [ ] Payment verification (Phase 3)
- [ ] Download authorize/consume (Phase 3+)

## Checkout error handling

| Condition | User message |
|-----------|----------------|
| Script load failure | Could not load payment window |
| User dismisses modal | Payment was cancelled |
| `payment.failed` event | Payment could not be completed |
| 15 min timeout | Payment timed out |
| Network (create-order) | Network error |
| Unknown | Generic retry message |

## Next phase (blocked on approval)

1. `POST /api/payments/verify` with HMAC signature check
2. Server entitlement + download token issuance
3. Wire `onPaid` / `proceedToDownload('paid')` after verified payment only
