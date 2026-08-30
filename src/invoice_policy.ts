import { z } from "zod";

export const lifecycleSchema = z.enum(["onboarding", "active", "suspended", "closed"]);
export type Lifecycle = z.infer<typeof lifecycleSchema>;

export const tenantSchema = z.object({
  tenantId: z.string().min(1),
  companyName: z.string().min(1),
  billingEmail: z.string().email(),
  lifecycle: lifecycleSchema.default("onboarding")
});

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitAmountCents: z.number().int().nonnegative()
});

export const orderSchema = z.object({
  orderId: z.string().min(1),
  tenantId: z.string().min(1),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  issuedOn: z.string().date(),
  dueOn: z.string().date(),
  items: z.array(lineItemSchema).min(1)
});

export type Tenant = z.infer<typeof tenantSchema>;
export type Order = z.infer<typeof orderSchema>;

export type InvoiceDecision =
  | { allowed: true; totalCents: number }
  | { allowed: false; reason: "TENANT_NOT_ACTIVE" | "TENANT_MISMATCH" };

export function decideInvoice(tenant: Tenant, order: Order): InvoiceDecision {
  if (tenant.tenantId !== order.tenantId) return { allowed: false, reason: "TENANT_MISMATCH" };
  if (tenant.lifecycle !== "active") return { allowed: false, reason: "TENANT_NOT_ACTIVE" };
  return {
    allowed: true,
    totalCents: order.items.reduce((sum, item) => sum + item.quantity * item.unitAmountCents, 0)
  };
}

const transitions: Record<Lifecycle, readonly Lifecycle[]> = {
  onboarding: ["active", "closed"],
  active: ["suspended", "closed"],
  suspended: ["active", "closed"],
  closed: []
};

export function changeLifecycle(current: Lifecycle, next: Lifecycle): Lifecycle {
  if (!transitions[current].includes(next)) {
    throw new Error(`Invalid lifecycle transition: ${current} -> ${next}`);
  }
  return next;
}
