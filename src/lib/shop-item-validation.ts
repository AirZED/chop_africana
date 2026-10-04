import type { ShopProductInput } from "./shop-service";

export function validateShopProductInput(body: unknown): { input?: ShopProductInput; error?: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body" };
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return { error: "Name is required" };
  if (typeof b.description !== "string") return { error: "Description is required" };
  if (typeof b.price !== "number" || !Number.isFinite(b.price) || b.price < 0) {
    return { error: "Price must be a non-negative number" };
  }
  if (typeof b.packSize !== "string") return { error: "Pack size is required" };
  if (typeof b.emoji !== "string" || !b.emoji.trim()) return { error: "Emoji is required" };
  if (b.image !== undefined && typeof b.image !== "string") return { error: "image must be a string" };
  if (typeof b.ingredients !== "string") return { error: "Ingredients is required" };
  if (typeof b.allergens !== "string") return { error: "Allergens is required" };
  if (typeof b.active !== "boolean") return { error: "active must be a boolean" };
  if (!Array.isArray(b.bakingSteps) || b.bakingSteps.some((s) => typeof s !== "string")) {
    return { error: "bakingSteps must be an array of strings" };
  }
  if (
    b.stock !== undefined &&
    b.stock !== null &&
    (typeof b.stock !== "number" || !Number.isInteger(b.stock) || b.stock < 0)
  ) {
    return { error: "stock must be a non-negative whole number, or left blank for unlimited" };
  }

  return {
    input: {
      name: b.name.trim(),
      description: (b.description as string).trim(),
      price: b.price,
      packSize: (b.packSize as string).trim(),
      emoji: b.emoji.trim(),
      image: typeof b.image === "string" ? b.image.trim() || undefined : undefined,
      ingredients: (b.ingredients as string).trim(),
      allergens: (b.allergens as string).trim(),
      bakingSteps: (b.bakingSteps as string[]).map((s) => s.trim()).filter(Boolean),
      active: b.active,
      stock: typeof b.stock === "number" ? b.stock : null,
    },
  };
}
