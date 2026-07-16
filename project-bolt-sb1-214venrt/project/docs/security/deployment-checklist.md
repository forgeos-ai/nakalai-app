# Production Deployment Checklist

Run this checklist **before every production deployment**. Security is not optional.

## Build and type safety

- [ ] `npm run build` passes (project root: `project-bolt-sb1-214venrt/project`)
- [ ] TypeScript passes (`tsc -p tsconfig.app.json && tsc -p tsconfig.node.json`)
- [ ] No new linter errors in touched files

## Secrets and environment

- [ ] No secrets committed to git (`git log -p` spot check if unsure)
- [ ] `.env.local` is gitignored and not staged
- [ ] `.env.production` is gitignored and not staged
- [ ] Vercel Production env vars exist:
  - [ ] `RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
  - [ ] `DOWNLOAD_TOKEN_SECRET`
- [ ] `VITE_ALLOW_MOCK_PAYMENTS` is **not** set in Production
- [ ] `DOWNLOAD_TOKEN_SECRET` is unique (not copied from Razorpay secret)

## Payment security

- [ ] Razorpay verification enabled (live/test keys match environment)
- [ ] `POST /api/payments/verify` rejects invalid signatures (manual negative test)
- [ ] Download token expiration verified (tokens expire ~5 minutes)
- [ ] Failed payment never unlocks watermark or paid export
- [ ] Real Razorpay test payment succeeds end-to-end
- [ ] Payment replay returns `409 PAYMENT_REPLAY`

## Mobile browser verification

Test on real devices or accurate emulators:

- [ ] Samsung Internet — preview, checkout, download
- [ ] Safari (iOS) — preview, PDF upload, checkout, download
- [ ] Chrome (Android) — preview, checkout, download
- [ ] Edge — smoke test

## Functional regression (no UI redesign expected)

- [ ] Handwriting preview renders correctly (Standard + Match unchanged)
- [ ] Watermark visible on unpaid preview
- [ ] Watermark removed only after server verification
- [ ] Free download capped at 3 pages
- [ ] PDF export works client-side
- [ ] Existing upload flow (text, PDF, style photo) unchanged

## Operations

- [ ] Founder notifications tested (when implemented)
- [ ] Rate limiting active on `/api/payments/*` and `/api/downloads/*`
- [ ] `vercel.json` security headers present
- [ ] `public/robots.txt` and `sitemap.xml` unchanged unless intentional

## Post-deploy smoke test (5 minutes)

1. Open production URL on mobile Chrome
2. Generate preview with sample text
3. Confirm watermark on preview
4. Complete test payment (Razorpay test mode if staging)
5. Confirm watermark removed after verify
6. Download PDF once — success
7. Attempt second download with same grant — must fail or require re-pay
8. Edit assignment text — paid pass must void

## Rollback criteria

Rollback immediately if:

- Paid export works without `/verify` success
- Secrets appear in browser Network tab responses
- Build fails on Vercel
- Handwriting preview is blank or regressed

## Documentation

- [ ] Security docs in `docs/security/` reviewed if payment code changed
- [ ] `threat-model.md` updated for new endpoints

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineer | | |
| Reviewer | | |
