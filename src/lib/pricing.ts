import { CartItemSelection, MenuItem } from "./types";

export function findItemIn(catalog: MenuItem[], itemId: string): MenuItem | undefined {
  return catalog.find((m) => m.itemId === itemId);
}

export function priceForSelections(item: MenuItem, selections: CartItemSelection[]): number {
  let total = item.basePrice;
  for (const group of item.modifierGroups) {
    const sel = selections.find((s) => s.groupId === group.groupId);
    if (!sel) continue;
    for (const optId of sel.optionIds) {
      const opt = group.options.find((o) => o.id === optId);
      if (opt) total += opt.price;
    }
  }
  return total;
}

export function formatGBP(amount: number): string {
  return amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

/** Validates a set of selections against an item's modifier group rules. Returns an error message, or null if valid. */
export function validateSelections(item: MenuItem, selections: CartItemSelection[]): string | null {
  for (const group of item.modifierGroups) {
    const sel = selections.find((s) => s.groupId === group.groupId);
    const count = sel?.optionIds.length ?? 0;
    if (group.required && count === 0) {
      return `${group.title} is required`;
    }
    if (count > group.maxSelections) {
      return `${group.title} allows up to ${group.maxSelections} selection${
        group.maxSelections === 1 ? "" : "s"
      }`;
    }
    const validIds = new Set(group.options.map((o) => o.id));
    if (sel?.optionIds.some((id) => !validIds.has(id))) {
      return `${group.title} has an invalid selection`;
    }
  }
  return null;
}
