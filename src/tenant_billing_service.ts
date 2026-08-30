import { createServer, type ServerResponse } from "node:http";
import { z, ZodError } from "zod";
import { changeLifecycle, decideInvoice, lifecycleSchema, orderSchema, tenantSchema, type Tenant } from "./invoice_policy.js";
import { renderInvoiceHtml } from "./invoice_document.js";
import { generateInvoicePdf, InfraiError } from "./infrai_pdf.js";

const tenants = new Map<string, Tenant>();
const lifecycleRequest = z.object({ lifecycle: lifecycleSchema });

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Buffer>): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/tenants") {
      const tenant = tenantSchema.parse(await readJson(request));
      tenants.set(tenant.tenantId, tenant);
      return send(response, 201, tenant);
    }

    const lifecycleMatch = request.url?.match(/^\/admin\/tenants\/([^/]+)\/lifecycle$/);
    if (request.method === "POST" && lifecycleMatch) {
      const tenant = tenants.get(decodeURIComponent(lifecycleMatch[1]));
      if (!tenant) return send(response, 404, { error: "Tenant not found" });
      const body = lifecycleRequest.parse(await readJson(request));
      const updated = { ...tenant, lifecycle: changeLifecycle(tenant.lifecycle, body.lifecycle) };
      tenants.set(updated.tenantId, updated);
      return send(response, 200, updated);
    }

    if (request.method === "POST" && request.url === "/invoices") {
      const order = orderSchema.parse(await readJson(request));
      const tenant = tenants.get(order.tenantId);
      if (!tenant) return send(response, 404, { error: "Tenant not found" });
      const decision = decideInvoice(tenant, order);
      if (decision.allowed === false) return send(response, 409, { error: decision.reason });
      const apiKey = process.env.INFRAI_API_KEY;
      if (!apiKey) return send(response, 503, { error: "INFRAI_API_KEY is required" });
      const html = renderInvoiceHtml(tenant, order, decision.totalCents);
      const pdf = await generateInvoicePdf(apiKey, html, `invoice:${tenant.tenantId}:${order.orderId}`);
      return send(response, 201, { orderId: order.orderId, totalCents: decision.totalCents, pdf });
    }

    return send(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof ZodError) return send(response, 400, { error: "Invalid request", details: error.issues });
    if (error instanceof InfraiError) return send(response, error.status >= 400 && error.status < 500 ? error.status : 502, { error: error.code, message: error.message });
    return send(response, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Tenant billing service listening on http://localhost:${port}`));
