import type { Order, Tenant } from "./invoice_policy.js";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[character] ?? character));

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);

export function renderInvoiceHtml(tenant: Tenant, order: Order, totalCents: number): string {
  const rows = order.items.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${money(item.unitAmountCents, order.currency)}</td><td>${money(item.quantity * item.unitAmountCents, order.currency)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px Arial;color:#202124;padding:40px}header{display:flex;justify-content:space-between}table{width:100%;border-collapse:collapse;margin-top:32px}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}.total{text-align:right;font-size:20px;margin-top:24px}</style></head><body><header><div><h1>Invoice</h1><strong>${escapeHtml(tenant.companyName)}</strong><div>${escapeHtml(tenant.billingEmail)}</div></div><div><div>Order ${escapeHtml(order.orderId)}</div><div>Issued ${order.issuedOn}</div><div>Due ${order.dueOn}</div></div></header><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="total"><strong>Total ${money(totalCents, order.currency)}</strong></p></body></html>`;
}
