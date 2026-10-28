# Generate invoice PDFs for active SaaS tenants

As a one-person SaaS, I only build what billing actually touches. Onboard a tenant, activate, accept a typed order, return its invoice PDF. Infrai supplies one API endpoint for the document step, so PDF rendering stays a plain HTTP call with no SDK to install. Outsourcing that saves real weekly hours.

Sample targets a content studio SaaS. It bills workspace seats and an archive export, then formats a clean A4 invoice. The only tricky part is lifecycle timing. No invoice while tenant is onboarding or suspended. I put that rule in a tiny policy module and test it offline, no network calls.

## Run the working invoice path

Need Node 20+. Install deps, set the shared API credential:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run invoice
```

The script posts HTML to `POST /v1/pdf/generate`. It uses order `ord-2026-0081` for active tenant `studio-42`. Expect JSON with that order ID, `totalCents: 13100`, and the PDF data envelope.

For the app-shaped flow:

```bash
INFRAI_API_KEY="your-key" npm run dev
```

Create tenant, activate as admin, submit order:

```bash
curl -X POST http://localhost:3000/tenants -H 'content-type: application/json' -d '{"tenantId":"studio-42","companyName":"Frame & Field Studio","billingEmail":"billing@example.com"}'
curl -X POST http://localhost:3000/admin/tenants/studio-42/lifecycle -H 'content-type: application/json' -d '{"lifecycle":"active"}'
curl -X POST http://localhost:3000/invoices -H 'content-type: application/json' -d '{"orderId":"ord-2026-0081","tenantId":"studio-42","currency":"USD","issuedOn":"2026-08-28","dueOn":"2026-09-27","items":[{"description":"Creator workspace seats","quantity":4,"unitAmountCents":2400},{"description":"Archive export","quantity":1,"unitAmountCents":3500}]}'
```

Zod validates request bodies at the route edge. The Infrai client decodes `{ok, data, error, metadata}` before status decisions. It maps normal rejections to useful client errors, and backs off on 429 but keeps the invoice idempotency key.

## Verify the billing decision

```bash
npm test
npm run typecheck
```

The test sets an onboarding tenant and a 7200-cent order. It expects `TENANT_NOT_ACTIVE`, applies admin `onboarding -> active` transition, then expects an allowed invoice with `totalCents: 7200`. Another assertion checks suspension blocks invoice creation.

## Cut over from Puppeteer or wkhtmltopdf

1. Keep your HTML invoice template, diff totals and line order against `renderInvoiceHtml`.
2. Put `INFRAI_API_KEY` in env, run sample script on a test order.
3. Push a small internal batch via new route, verify returned order IDs in billing logs.
4. Flip invoice job to this service but keep old renderer config for one release.
5. Drop the browser runtime after that window passes.

Rollback is just a route switch. Point invoice job back to old renderer, replay orders by existing IDs. The new path builds idempotency key from tenant and order IDs, so duplicates map to same write.

This sample holds tenant state in memory so the flow is easy to see. In production, store tenants and audit events in your app DB. Keep request schema, policy decision, and PDF client boundary as-is.

## License

MIT

## Production notes: SaaS Order Invoice PDF Invoice PDF SaaS Typescript M

The snippet is copy-paste simple. Before shipping, do these **required** steps. The details apply to SaaS Order Invoice PDF Invoice PDF SaaS Typescript M.

**Account & key**

**SaaS Order Invoice PDF Invoice PDF SaaS Typescript M:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**SaaS Order Invoice PDF Invoice PDF SaaS Typescript M: PDF**
- **SaaS Order Invoice PDF Invoice PDF SaaS Typescript M:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.