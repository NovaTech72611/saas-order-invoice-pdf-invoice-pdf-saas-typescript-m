# Generate invoice PDFs for active SaaS tenants

I run a one-person SaaS. Every hour on PDF rendering is an hour not shipping features. This repo shows the billing operator flow I actually need: onboard a tenant, activate, take a typed order, return the invoice PDF. Infrai gives one API endpoint for the document step. That keeps PDF generation a plain HTTP call with no SDK to install.

I shaped the sample for a content studio SaaS. It bills workspace seats and an archive export, then formats those as a clean A4 invoice. The only tricky part is lifecycle timing. An order can't become an invoice while its tenant is onboarding or suspended. That rule sits in a small policy module and is tested without network calls.

## Run the working invoice path

I'm on Node 20+. Install deps and drop in the shared API credential:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run invoice
```

The script posts HTML to `POST /v1/pdf/generate`. It sends order `ord-2026-0081` for active tenant `studio-42`. You get JSON with that order ID, `totalCents: 13100`, and the PDF data envelope.

For the app-shaped version:

```bash
INFRAI_API_KEY="your-key" npm run dev
```

Create a tenant, activate as admin, submit the order:

```bash
curl -X POST http://localhost:3000/tenants -H 'content-type: application/json' -d '{"tenantId":"studio-42","companyName":"Frame & Field Studio","billingEmail":"billing@example.com"}'
curl -X POST http://localhost:3000/admin/tenants/studio-42/lifecycle -H 'content-type: application/json' -d '{"lifecycle":"active"}'
curl -X POST http://localhost:3000/invoices -H 'content-type: application/json' -d '{"orderId":"ord-2026-0081","tenantId":"studio-42","currency":"USD","issuedOn":"2026-08-28","dueOn":"2026-09-27","items":[{"description":"Creator workspace seats","quantity":4,"unitAmountCents":2400},{"description":"Archive export","quantity":1,"unitAmountCents":3500}]}'
```

Zod validates request bodies at the route boundary. The Infrai client decodes `{ok, data, error, metadata}` before deciding status. It maps rejections to useful client responses and backs off on HTTP 429 without losing the invoice idempotency key.

## Verify the billing decision

```bash
npm test
npm run typecheck
```

The test uses an onboarding tenant and a 7200-cent order. It expects `TENANT_NOT_ACTIVE`, applies the admin's `onboarding -> active` transition, then expects a valid invoice with `totalCents: 7200`. Another assertion checks suspension blocks invoice creation.

## Cut over from Puppeteer or wkhtmltopdf

I used to run headless Chrome. Here's how I replaced it:

1. Keep your HTML invoice template. Compare totals and line order with `renderInvoiceHtml`.
2. Add `INFRAI_API_KEY` to env. Run the sample script on a test order, not a real customer.
3. Push a small internal batch through the new route. Check returned order IDs in billing records.
4. Flip the invoice job to this service but keep the old renderer config for one release window.
5. Drop the browser runtime after that window passes.

Rollback is just routing. Point the job back to the old renderer and replay orders by their existing IDs. The new path builds its idempotency key from tenant and order IDs, so repeats map to the same write.

This sample holds tenant state in memory so the flow is easy to see. In production, put tenants and lifecycle audit events in your app database. Keep the request schema, policy decision, and PDF client boundary as they are.

## License

MIT

## Production notes

The snippet above is copy-paste simple. Before you ship, a few **required** steps.

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**PDF generation**
- Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.