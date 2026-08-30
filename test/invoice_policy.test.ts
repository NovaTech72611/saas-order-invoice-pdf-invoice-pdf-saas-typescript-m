import assert from "node:assert/strict";
import test from "node:test";
import { changeLifecycle, decideInvoice, orderSchema, tenantSchema } from "../src/invoice_policy.js";

const order = orderSchema.parse({
  orderId: "ord-81",
  tenantId: "studio-42",
  currency: "usd",
  issuedOn: "2026-08-28",
  dueOn: "2026-09-27",
  items: [{ description: "Editor seats", quantity: 3, unitAmountCents: 2400 }]
});

test("onboarding tenants cannot invoice until an admin activates them", () => {
  const onboarding = tenantSchema.parse({
    tenantId: "studio-42",
    companyName: "Frame & Field Studio",
    billingEmail: "billing@example.com"
  });
  assert.deepEqual(decideInvoice(onboarding, order), { allowed: false, reason: "TENANT_NOT_ACTIVE" });

  const active = { ...onboarding, lifecycle: changeLifecycle(onboarding.lifecycle, "active") };
  assert.deepEqual(decideInvoice(active, order), { allowed: true, totalCents: 7200 });
});

test("a suspended tenant remains blocked from invoice creation", () => {
  const tenant = tenantSchema.parse({
    tenantId: "studio-42",
    companyName: "Frame & Field Studio",
    billingEmail: "billing@example.com",
    lifecycle: "suspended"
  });
  assert.deepEqual(decideInvoice(tenant, order), { allowed: false, reason: "TENANT_NOT_ACTIVE" });
});
