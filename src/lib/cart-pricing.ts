import { CartLine, FulfillmentMode, MenuItem, ShopProduct } from "./types";
import { findItemIn, priceForSelections, validateSelections } from "./pricing";

export const DELIVERY_FEE = 3.5;

export function findProductIn(catalog: ShopProduct[], productId: string): ShopProduct | undefined {
  return catalog.find((p) => p.productId === productId);
}

export function lineUnitPrice(line: CartLine, menu: MenuItem[], shop: ShopProduct[]): number {
  if (line.kind === "restaurant") {
    const item = findItemIn(menu, line.refId);
    return item ? priceForSelections(item, line.selections) : 0;
  }
  const product = findProductIn(shop, line.refId);
  return product ? product.price : 0;
}

export function lineTotal(line: CartLine, menu: MenuItem[], shop: ShopProduct[]): number {
  return lineUnitPrice(line, menu, shop) * line.quantity;
}

export function cartSubtotal(items: CartLine[], menu: MenuItem[], shop: ShopProduct[]): number {
  return items.reduce((sum, ci) => sum + lineTotal(ci, menu, shop), 0);
}

export function deliveryFee(fulfillment: FulfillmentMode): number {
  return fulfillment === "delivery" ? DELIVERY_FEE : 0;
}

export function cartTotal(items: CartLine[], menu: MenuItem[], shop: ShopProduct[], fulfillment: FulfillmentMode): number {
  return cartSubtotal(items, menu, shop) + deliveryFee(fulfillment);
}

/** Recomputes the cart total server-side from trusted catalogs, ignoring any client-supplied prices. */
export function recomputeCartServerTotal(
  items: CartLine[],
  menu: MenuItem[],
  shop: ShopProduct[],
  fulfillment: FulfillmentMode
): { subtotal: number; delivery: number; total: number; error: string | null } {
  for (const line of items) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      return { subtotal: 0, delivery: 0, total: 0, error: "Invalid item quantity" };
    }
    if (line.kind === "restaurant") {
      const item = findItemIn(menu, line.refId);
      if (!item) return { subtotal: 0, delivery: 0, total: 0, error: `Unknown item: ${line.refId}` };
      const err = validateSelections(item, line.selections);
      if (err) return { subtotal: 0, delivery: 0, total: 0, error: `${item.name}: ${err}` };
    } else {
      const product = findProductIn(shop, line.refId);
      if (!product) return { subtotal: 0, delivery: 0, total: 0, error: `Unknown product: ${line.refId}` };
    }
  }
  const sub = cartSubtotal(items, menu, shop);
  const delivery = deliveryFee(fulfillment);
  return { subtotal: sub, delivery, total: sub + delivery, error: null };
}
