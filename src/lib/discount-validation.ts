import type { DiscountCodeInput } from "./discount-service";

export function validateDiscountCodeInput(body: unknown): { input?: DiscountCodeInput; error?: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body" };
  const b = body as Record<string, unknown>;

  if (typeof b.code !== "string" || !b.code.trim()) return { error: "Code is required" };
  if (b.type !== "percent" && b.type !== "fixed") return { error: "Type must be 'percent' or 'fixed'" };
  if (typeof b.value !== "number" || !Number.isFinite(b.value) || b.value <= 0) {
    return { error: "Value must be a positive number" };
  }
  if (b.type === "percent" && b.value > 100) return { error: "Percent value can't exceed 100" };
  if (typeof b.active !== "boolean") return { error: "active must be a boolean" };
  if (
    b.minSubtotal !== undefined &&
    (typeof b.minSubtotal !== "number" || !Number.isFinite(b.minSubtotal) || b.minSubtotal < 0)
  ) {
    return { error: "minSubtotal must be a non-negative number" };
  }
  if (
    b.usageLimit !== undefined &&
    b.usageLimit !== null &&
    (typeof b.usageLimit !== "number" || !Number.isInteger(b.usageLimit) || b.usageLimit < 1)
  ) {
    return { error: "usageLimit must be a positive integer" };
  }
  if (b.expiresAt !== undefined && b.expiresAt !== null && typeof b.expiresAt !== "string") {
    return { error: "expiresAt must be a date string" };
  }

  return {
    input: {
      code: b.code.trim(),
      type: b.type,
      value: b.value,
      active: b.active,
      minSubtotal: typeof b.minSubtotal === "number" ? b.minSubtotal : 0,
      usageLimit: typeof b.usageLimit === "number" ? b.usageLimit : null,
      expiresAt: typeof b.expiresAt === "string" ? b.expiresAt : null,
    },
  };
}
