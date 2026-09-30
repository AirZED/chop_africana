"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { useMenuStore } from "@/lib/menu-store";
import { useShopProductsStore } from "@/lib/shop-store";
import { SHOP_PRODUCT_IMAGES } from "@/lib/shop-images";
import { cartSubtotal, deliveryFee, findProductIn, lineTotal } from "@/lib/cart-pricing";
import { findItemIn, formatGBP } from "@/lib/pricing";
import { restaurant } from "@/lib/menu-data";
import { FulfillmentMode } from "@/lib/types";
import PaymentMethodSection from "@/components/checkout/PaymentMethodSection";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const fulfillment = useCartStore((s) => s.fulfillment);
  const table = useCartStore((s) => s.table);
  const address = useCartStore((s) => s.address);
  const fullName = useCartStore((s) => s.fullName);
  const phone = useCartStore((s) => s.phone);
  const email = useCartStore((s) => s.email);
  const setFulfillment = useCartStore((s) => s.setFulfillment);
  const setAddress = useCartStore((s) => s.setAddress);
  const setContact = useCartStore((s) => s.setContact);
  const clearCart = useCartStore((s) => s.clearCart);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  const menu = useMenuStore((s) => s.items);
  const fetchMenu = useMenuStore((s) => s.fetchMenu);
  const shop = useShopProductsStore((s) => s.items);
  const fetchShop = useShopProductsStore((s) => s.fetchProducts);

  const [localAddress, setLocalAddress] = useState(address);
  const [localName, setLocalName] = useState(fullName);
  const [localPhone, setLocalPhone] = useState(phone);
  const [localEmail, setLocalEmail] = useState(email);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const configMissing = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    fetchMenu();
    fetchShop();
  }, [fetchMenu, fetchShop]);

  useEffect(() => {
    if (hasHydrated && items.length === 0) router.replace("/cart");
  }, [hasHydrated, items.length, router]);

  const subtotal = useMemo(() => cartSubtotal(items, menu, shop), [items, menu, shop]);
  const delivery = deliveryFee(table ? "dine-in" : fulfillment);
  const total = subtotal + delivery;

  async function createIntent() {
    setFieldError(null);
    if (!table && fulfillment === "delivery" && !localAddress.trim()) {
      setFieldError("Please enter a delivery address.");
      return null;
    }
    if (!localName.trim() || !localPhone.trim() || !localEmail.trim()) {
      setFieldError("Please fill in your name, phone, and email.");
      return null;
    }
    setContact(localName.trim(), localPhone.trim(), localEmail.trim());
    setAddress(localAddress.trim());

    try {
      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment: table ? "dine-in" : fulfillment,
          table,
          address: localAddress.trim(),
          fullName: localName.trim(),
          phone: localPhone.trim(),
          email: localEmail.trim(),
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to start payment");
      return { clientSecret: data.clientSecret as string, total: data.total as number };
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <button onClick={() => router.push("/cart")} className="tap-press flex items-center gap-2 text-stone-700">
        <span aria-hidden>←</span> Go Back
      </button>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Checkout</h1>

          <section className="mt-8">
            <h2 className="font-semibold text-stone-900">1. How should we get it to you?</h2>
            {table ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                Dine-In · Table {table}
              </div>
            ) : (
              <>
                <div className="mt-3 flex rounded-full bg-stone-100 p-1">
                  {(["delivery", "pickup"] as FulfillmentMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setFulfillment(m)}
                      className={`flex-1 rounded-full py-2.5 text-sm font-semibold capitalize ${
                        fulfillment === m ? "bg-stone-900 text-white" : "text-stone-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {fulfillment === "delivery" ? (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium text-stone-600">Delivery address</label>
                    <input
                      value={localAddress}
                      onChange={(e) => setLocalAddress(e.target.value)}
                      placeholder="Street, area, city"
                      className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
                    />
                    <p className="mt-2 text-sm text-stone-500">
                      Delivery fee: {formatGBP(deliveryFee("delivery"))}. Arrives in 30–50 min
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-white px-4 py-3">
                    <p className="font-medium text-stone-900">Pick Up At The Restaurant</p>
                    <p className="text-sm text-stone-500">
                      {restaurant.address} · Ready in {restaurant.pickupMinutes} min
                    </p>
                  </div>
                )}
              </>
            )}
          </section>

          <div className="my-8 border-t border-stone-200" />

          <section>
            <h2 className="font-semibold text-stone-900">2. Your details</h2>
            <div className="mt-3 flex flex-col gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-600">Full name</span>
                <input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Enter fullname"
                  className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-600">Phone no</span>
                  <input
                    type="tel"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value)}
                    placeholder="Enter Phone no"
                    className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-600">Email address</span>
                  <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="Enter Email address"
                    className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="my-8 border-t border-stone-200" />

          <section>
            <h2 className="font-semibold text-stone-900">3. Payment</h2>
            {configMissing ? (
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Stripe isn&apos;t configured yet. Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and{" "}
                <code>STRIPE_SECRET_KEY</code> to <code>.env.local</code>.
              </div>
            ) : (
              <>
                {fieldError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fieldError}</p>
                )}
                <PaymentMethodSection
                  total={total}
                  disabled={false}
                  onCreateIntent={createIntent}
                  onSuccess={() => {
                    clearCart();
                    router.push("/confirmation");
                  }}
                />
              </>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-stone-900">Your Order</h2>
          <div className="mt-4 flex flex-col gap-4">
            {items.map((line) => {
              if (line.kind === "restaurant") {
                const item = findItemIn(menu, line.refId);
                if (!item) return null;
                return (
                  <div key={line.cartItemId} className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-lg">{item.emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500">Restaurant · Qty {line.quantity}</p>
                    </div>
                    <span className="font-medium text-stone-900">{formatGBP(lineTotal(line, menu, shop))}</span>
                  </div>
                );
              }
              const product = findProductIn(shop, line.refId);
              if (!product) return null;
              const photo = SHOP_PRODUCT_IMAGES[product.productId];
              return (
                <div key={line.cartItemId} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {photo ? (
                      <Image src={photo} alt="" fill sizes="48px" className="object-contain p-0.5" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-lg">{product.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{product.name}</p>
                    <p className="text-xs text-stone-500">{product.packSize || "Shop"} · Qty {line.quantity}</p>
                  </div>
                  <span className="font-medium text-stone-900">{formatGBP(lineTotal(line, menu, shop))}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-stone-200 pt-4">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatGBP(subtotal)}</span>
            </div>
            {delivery > 0 && (
              <div className="mt-1 flex justify-between text-stone-600">
                <span>Delivery</span>
                <span>{formatGBP(delivery)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900">
              <span>Total</span>
              <span>{formatGBP(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
