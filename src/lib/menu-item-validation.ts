import { menuCategories } from "./menu-data";
import type { MenuItemInput } from "./menu-service";

export function validateMenuItemInput(body: unknown): { input?: MenuItemInput; error?: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request body" };
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return { error: "Name is required" };
  if (typeof b.description !== "string") return { error: "Description is required" };
  if (typeof b.basePrice !== "number" || !Number.isFinite(b.basePrice) || b.basePrice < 0) {
    return { error: "Base price must be a non-negative number" };
  }
  if (typeof b.category !== "string" || !menuCategories.includes(b.category as never)) {
    return { error: `Category must be one of: ${menuCategories.join(", ")}` };
  }
  if (typeof b.emoji !== "string" || !b.emoji.trim()) return { error: "Emoji is required" };
  if (b.image !== undefined && typeof b.image !== "string") return { error: "image must be a string" };
  if (
    b.prepMinutes !== undefined &&
    (typeof b.prepMinutes !== "number" || !Number.isFinite(b.prepMinutes) || b.prepMinutes < 0)
  ) {
    return { error: "prepMinutes must be a non-negative number" };
  }
  if (typeof b.popular !== "boolean") return { error: "popular must be a boolean" };
  if (typeof b.active !== "boolean") return { error: "active must be a boolean" };
  if (!Array.isArray(b.modifierGroups)) return { error: "modifierGroups must be an array" };

  for (const g of b.modifierGroups) {
    if (typeof g !== "object" || g === null) return { error: "Invalid modifier group" };
    const group = g as Record<string, unknown>;
    if (typeof group.title !== "string" || !group.title.trim()) return { error: "Modifier group title is required" };
    if (typeof group.required !== "boolean") return { error: "Modifier group required must be a boolean" };
    if (typeof group.maxSelections !== "number" || group.maxSelections < 1) {
      return { error: "Modifier group maxSelections must be at least 1" };
    }
    if (!Array.isArray(group.options) || group.options.length === 0) {
      return { error: `"${group.title}" needs at least one option` };
    }
    for (const o of group.options) {
      if (typeof o !== "object" || o === null) return { error: "Invalid modifier option" };
      const opt = o as Record<string, unknown>;
      if (typeof opt.name !== "string" || !opt.name.trim()) return { error: "Modifier option name is required" };
      if (typeof opt.price !== "number" || !Number.isFinite(opt.price) || opt.price < 0) {
        return { error: "Modifier option price must be a non-negative number" };
      }
    }
  }

  return {
    input: {
      name: b.name.trim(),
      description: (b.description as string).trim(),
      basePrice: b.basePrice,
      category: b.category as MenuItemInput["category"],
      emoji: b.emoji.trim(),
      image: typeof b.image === "string" ? b.image.trim() : undefined,
      prepMinutes: typeof b.prepMinutes === "number" ? b.prepMinutes : undefined,
      popular: b.popular,
      active: b.active,
      modifierGroups: (b.modifierGroups as Record<string, unknown>[]).map((g) => ({
        title: (g.title as string).trim(),
        required: g.required as boolean,
        maxSelections: g.maxSelections as number,
        options: (g.options as Record<string, unknown>[]).map((o) => ({
          name: (o.name as string).trim(),
          price: o.price as number,
        })),
      })),
    },
  };
}
