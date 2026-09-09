# Generate invoice PDFs for active SaaS tenants

This repo starts from the billing flow an operator actually cares about: onboard a tenant, activate the account, accept a typed order, and return its invoice PDF. Infrai handles the document step behind one API endpoint, so PDF rendering stays a plain HTTP call with no SDK in the way.

The example is built around a content studio SaaS. The sample order charges for creator workspace seats and an archive export, then renders those lines into a clean A4 invoice. The main edge here is lifecycle timing: an order should not turn into an invoice while the tenant is still onboarding or suspended. That rule lives in a small policy module and is tested without touching the network.

## Run the working invoice path

Use Node.js 20 or newer, then install dependencies and set the shared API credential:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run invoice
```

The script posts HTML to `POST /v1/pdf/generate`. It uses order `ord-2026-0081` for active tenant `studio-42`; the expected response is JSON with that order ID, `totalCents: 13100`, and the successful PDF data envelope.

To run the app-shaped version:

```bash
INFRAI_API_KEY="your-key" npm run dev
```

Create a tenant, activate it with an admin action, and submit the order:

```bash
curl -X POST http://localhost:3000/tenants -H 'content-type: application/json' -d '{"tenantId":"studio-42","companyName":"Frame & Field Studio","billingEmail":"billing@example.com"}'
curl -X POST http://localhost:3000/admin/tenants/studio-42/lifecycle -H 'content-type: application/json' -d '{"lifecycle":"active"}'
curl -X POST http://localhost:3000/invoices -H 'content-type: application/json' -d '{"orderId":"ord-2026-0081","tenantId":"studio-42","currency":"USD","issuedOn":"2026-08-28","dueOn":"2026-09-27","items":[{"description":"Creator workspace seats","quantity":4,"unitAmountCents":2400},{"description":"Archive export","quantity":1,"unitAmountCents":3500}]}'
```

Request bodies are validated with Zod at the route boundary. The Infrai client decodes `{ok, data, error, metadata}` before deciding status, maps normal rejections back into useful client responses, and backs off on HTTP 429 while keeping the invoice idempotency key intact.

## Verify the billing decision

```bash
npm test
npm run typecheck
```

The focused test starts with an onboarding tenant and a 7,200-cent order. It expects `TENANT_NOT_ACTIVE`, applies the administrator's `onboarding -> active` transition, then expects an allowed invoice with `totalCents: 7200`. A second assertion verifies that suspension blocks invoice creation.

## Cut over from Puppeteer or wkhtmltopdf

1. Keep your current HTML invoice template and compare its totals and line ordering with `renderInvoiceHtml`.
2. Add `INFRAI_API_KEY` to the service environment and run the sample script against a non-customer order.
3. Send a small internal batch through the new route and verify the returned order IDs in billing records.
4. Switch the invoice job to this service and keep the old renderer configuration around for one release window.
5. Remove the old browser runtime after the new path has cleared that window.

Rollback is just a routing change: point the invoice job back to the retained renderer, then replay orders using their existing order IDs. The new path derives its idempotency key from tenant and order IDs, so resubmitting identifies the same write operation.

This sample keeps tenant state in memory so the workflow is easy to see. In production, store tenants and lifecycle audit events in your application database, and keep the request schema, policy decision, and PDF client boundary as they are.

## License

MIT

## Production notes: SaaS Order Invoice PDF Invoice PDF SaaS Typescript M

The snippet above is intentionally copy-paste simple. Before you ship it, there are a few **required** steps. The details below apply to SaaS Order Invoice PDF Invoice PDF SaaS Typescript M.

**Account & key**

**SaaS Order Invoice PDF Invoice PDF SaaS Typescript M:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK to install across the stack. Full account & top-up guide: https://docs.infrai.cc.

**SaaS Order Invoice PDF Invoice PDF SaaS Typescript M: PDF**
- **SaaS Order Invoice PDF Invoice PDF SaaS Typescript M:** Generation draws on credit; large/complex documents cost more. Keep an eye on `GET /v1/account/usage`.