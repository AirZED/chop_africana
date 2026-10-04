"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useShopProductsStore } from "@/lib/shop-store";
import { useCartStore } from "@/lib/cart-store";
import { formatGBP } from "@/lib/pricing";
import { SHOP_PRODUCT_IMAGES } from "@/lib/shop-images";
import { AccordionSection } from "@/components/site/Accordion";
import ImagePlaceholder from "@/components/ImagePlaceholder";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const products = useShopProductsStore((s) => s.items);
  const loading = useShopProductsStore((s) => s.loading);
  const loaded = useShopProductsStore((s) => s.loaded);
  const fetchProducts = useShopProductsStore((s) => s.fetchProducts);
  const addShopItem = useCartStore((s) => s.addShopItem);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const product = products.find((p) => p.productId === id);

  if (loaded && !product) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-stone-500">We couldn&apos;t find that product.</p>
        <Link href="/shop" className="mt-3 inline-block font-semibold text-orange-600">
          Back to shop
        </Link>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-stone-200" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-1/2 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  const photo = product.image ?? SHOP_PRODUCT_IMAGES[product.productId];
  const gallery = photo ? [photo, photo, photo, photo] : [];
  const soldOut = product.stock === 0;
  const maxQuantity = product.stock !== undefined && product.stock !== null ? Math.min(20, product.stock) : 20;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 sm:items-start">
        <div>
          {photo ? (
            <>
              <div className="relative aspect-square bg-white">
                <Image
                  src={gallery[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-contain"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-square rounded-lg border bg-white ${
                      activeImage === i ? "border-[#A61400]" : "border-stone-200"
                    }`}
                  >
                    <Image src={src} alt="" fill sizes="120px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <ImagePlaceholder label={product.name} filename={`${product.productId}.jpg`} className="aspect-square" />
          )}
        </div>

        <div>
          <button
            onClick={() => router.push("/shop")}
            className="tap-press flex items-center gap-2 text-stone-700"
          >
            <span aria-hidden>←</span> Go Back
          </button>

          <h1 className="mt-6 font-serif text-5xl font-light tracking-[-0.03em] text-stone-900">{product.name}</h1>

          <p className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900">{formatGBP(product.price)}</span>
            {product.packSize && <span className="text-lg text-stone-400">/ {product.packSize}</span>}
          </p>

          <p className="mt-4 max-w-md capitalize text-stone-600">{product.description}</p>

          {soldOut ? (
            <p className="mt-4 inline-block rounded-full bg-stone-900 px-3 py-1 text-sm font-semibold text-white">Sold out</p>
          ) : (
            product.stock !== undefined && product.stock !== null && product.stock <= 5 && (
              <p className="mt-4 text-sm font-semibold text-amber-600">Only {product.stock} left</p>
            )
          )}

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3 rounded-full border border-stone-300 px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={soldOut}
                className="tap-press flex size-8 items-center justify-center rounded-full text-stone-700 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={soldOut}
                className="tap-press flex size-8 items-center justify-center rounded-full text-stone-700 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Total: <span className="text-stone-900">{formatGBP(product.price * quantity)}</span>
            </span>
          </div>

          <button
            onClick={() => {
              addShopItem(product.productId, quantity);
              setAdded(true);
            }}
            disabled={soldOut}
            className="tap-press mt-6 w-full rounded-full bg-[#A61400] px-6 py-4 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </button>
          {added && (
            <p className="mt-3 text-sm text-emerald-600">
              ✓ Added to your cart.{" "}
              <button onClick={() => router.push("/cart")} className="font-semibold underline">
                View Cart
              </button>
            </p>
          )}

          <div className="mt-8">
            <AccordionSection title="Ingredients">{product.ingredients}</AccordionSection>
            <AccordionSection title="Allergens">{product.allergens}</AccordionSection>
            <AccordionSection title="Baking instructions">
              <ol className="list-decimal space-y-1 pl-5">
                {product.bakingSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </AccordionSection>
          </div>
        </div>
      </div>
    </div>
  );
}
