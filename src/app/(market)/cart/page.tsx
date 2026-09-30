"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useMenuStore } from "@/lib/menu-store";
import { useShopProductsStore } from "@/lib/shop-store";
import { SHOP_PRODUCT_IMAGES } from "@/lib/shop-images";
import { cartSubtotal, findProductIn, lineTotal, lineUnitPrice } from "@/lib/cart-pricing";
import { findItemIn, formatGBP } from "@/lib/pricing";
import { CartLine, MenuItem } from "@/lib/types";
import CustomizerSheet from "@/components/CustomizerSheet";

function selectionSummary(item: MenuItem, line: Extract<CartLine, { kind: "restaurant" }>): string {
  const parts: string[] = [];
  for (const group of item.modifierGroups) {
    const sel = line.selections.find((s) => s.groupId === group.groupId);
    if (!sel || sel.optionIds.length === 0) continue;
    const names = sel.optionIds.map((id) => group.options.find((o) => o.id === id)?.name).filter(Boolean);
    parts.push(names.join(", "));
  }
  return parts.join(" · ");
}

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateRestaurantItem = useCartStore((s) => s.updateRestaurantItem);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  const menu = useMenuStore((s) => s.items);
  const fetchMenu = useMenuStore((s) => s.fetchMenu);
  const shop = useShopProductsStore((s) => s.items);
  const fetchShop = useShopProductsStore((s) => s.fetchProducts);

  const [editing, setEditing] = useState<Extract<CartLine, { kind: "restaurant" }> | null>(null);

  useEffect(() => {
    fetchMenu();
    fetchShop();
  }, [fetchMenu, fetchShop]);

  const subtotal = useMemo(() => cartSubtotal(items, menu, shop), [items, menu, shop]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-stone-900">Your Order</h1>

      {!hasHydrated ? null : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center text-stone-500">
          <span className="text-4xl">🛒</span>
          <p>Your cart is empty.</p>
          <div className="flex gap-4">
            <Link href="/menu" className="font-semibold text-orange-600">
              Browse the menu →
            </Link>
            <Link href="/shop" className="font-semibold text-orange-600">
              Shop pies →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3">
            {items.map((line) => {
              if (line.kind === "restaurant") {
                const item = findItemIn(menu, line.refId);
                if (!item) return null;
                return (
                  <div key={line.cartItemId} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-2xl">{item.emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-stone-900">{item.name}</h3>
                      <p className="text-sm text-stone-500">
                        Restaurant{selectionSummary(item, line) && ` · ${selectionSummary(item, line)}`}
                      </p>
                      {line.specialInstructions && (
                        <p className="text-sm italic text-stone-400">&ldquo;{line.specialInstructions}&rdquo;</p>
                      )}
                      <div className="mt-2 flex gap-4">
                        {item.modifierGroups.length > 0 && (
                          <button onClick={() => setEditing(line)} className="text-sm font-medium text-orange-600">
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => removeItem(line.cartItemId)}
                          className="text-sm font-medium text-stone-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <QuantityCol
                      quantity={line.quantity}
                      total={formatGBP(lineTotal(line, menu, shop))}
                      onDec={() => setQuantity(line.cartItemId, line.quantity - 1)}
                      onInc={() => setQuantity(line.cartItemId, line.quantity + 1)}
                    />
                  </div>
                );
              }

              const product = findProductIn(shop, line.refId);
              if (!product) return null;
              const photo = SHOP_PRODUCT_IMAGES[product.productId];
              return (
                <div key={line.cartItemId} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {photo ? (
                      <Image src={photo} alt={product.name} fill sizes="64px" className="object-contain p-1" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-2xl">{product.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-stone-900">{product.name}</h3>
                    <p className="text-sm text-stone-500">{product.packSize || "Shop"}</p>
                    <button
                      onClick={() => removeItem(line.cartItemId)}
                      className="mt-2 text-sm font-medium text-stone-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <QuantityCol
                    quantity={line.quantity}
                    total={formatGBP(lineUnitPrice(line, menu, shop) * line.quantity)}
                    onDec={() => setQuantity(line.cartItemId, line.quantity - 1)}
                    onInc={() => setQuantity(line.cartItemId, line.quantity + 1)}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex justify-between font-bold text-stone-900">
              <span>Subtotal</span>
              <span>{formatGBP(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-stone-400">Delivery fee (if applicable) is calculated at checkout.</p>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="tap-press mt-6 w-full rounded-full bg-[#A61400] px-6 py-4 font-semibold text-white shadow-lg"
          >
            Checkout · {formatGBP(subtotal)}
          </button>
        </>
      )}

      {editing &&
        (() => {
          const item = findItemIn(menu, editing.refId);
          if (!item) return null;
          return (
            <CustomizerSheet
              item={item}
              existing={{
                quantity: editing.quantity,
                selections: editing.selections,
                specialInstructions: editing.specialInstructions,
              }}
              onClose={() => setEditing(null)}
              onSubmit={(selections, quantity, notes) => {
                updateRestaurantItem(editing.cartItemId, selections, quantity, notes);
                setEditing(null);
              }}
            />
          );
        })()}
    </div>
  );
}

function QuantityCol({
  quantity,
  total,
  onDec,
  onInc,
}: {
  quantity: number;
  total: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex flex-col items-end justify-between gap-2">
      <span className="font-semibold text-stone-900">{total}</span>
      <div className="flex items-center gap-2">
        <button onClick={onDec} className="tap-press flex size-8 items-center justify-center rounded-full border border-stone-300 text-stone-700">
          −
        </button>
        <span className="w-5 text-center text-sm font-medium">{quantity}</span>
        <button onClick={onInc} className="tap-press flex size-8 items-center justify-center rounded-full border border-stone-300 text-stone-700">
          +
        </button>
      </div>
    </div>
  );
}
