import { generateInvoicePdf } from "../src/infrai_pdf.js";
import { decideInvoice, orderSchema, tenantSchema } from "../src/invoice_policy.js";
import { renderInvoiceHtml } from "../src/invoice_document.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the invoice script");

const tenant = tenantSchema.parse({
  tenantId: "studio-42",
  companyName: "Frame & Field Studio",
  billingEmail: "billing@example.com",
  lifecycle: "active"
});
const order = orderSchema.parse({
  orderId: "ord-2026-0081",
  tenantId: "studio-42",
  currency: "USD",
  issuedOn: "2026-08-28",
  dueOn: "2026-09-27",
  items: [
    { description: "Creator workspace seats", quantity: 4, unitAmountCents: 2400 },
    { description: "Archive export", quantity: 1, unitAmountCents: 3500 }
  ]
});

const decision = decideInvoice(tenant, order);
if (decision.allowed === false) throw new Error(decision.reason);
const html = renderInvoiceHtml(tenant, order, decision.totalCents);
const pdf = await generateInvoicePdf(apiKey, html, `invoice:${tenant.tenantId}:${order.orderId}`);
console.log(JSON.stringify({ orderId: order.orderId, totalCents: decision.totalCents, pdf }, null, 2));
