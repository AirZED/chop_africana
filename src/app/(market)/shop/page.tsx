"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useShopProductsStore } from "@/lib/shop-store";
import { formatGBP } from "@/lib/pricing";
import { SHOP_PRODUCT_IMAGES } from "@/lib/shop-images";
import ImagePlaceholder from "@/components/ImagePlaceholder";

export default function ShopPage() {
  const products = useShopProductsStore((s) => s.items);
  const loading = useShopProductsStore((s) => s.loading);
  const error = useShopProductsStore((s) => s.error);
  const fetchProducts = useShopProductsStore((s) => s.fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-semibold text-stone-900">Shop Our Pies</h1>
        <p className="mt-3 text-stone-500">Ready to go from freezer to oven. Shipped to your door.</p>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {loading && products.length === 0 && (
          <>
            <div className="h-80 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-80 animate-pulse rounded-2xl bg-stone-200" />
          </>
        )}
        {products.map((product) => (
          <Link
            key={product.productId}
            href={`/shop/${product.productId}`}
            className="tap-press group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            {product.image ?? SHOP_PRODUCT_IMAGES[product.productId] ? (
              <div className="relative aspect-square bg-stone-50">
                <Image
                  src={product.image ?? SHOP_PRODUCT_IMAGES[product.productId]}
                  alt={product.name}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <ImagePlaceholder
                label={product.name}
                filename={`${product.productId}.jpg`}
                className="aspect-square"
                rounded="rounded-none"
                bordered={false}
              />
            )}
            <div className="p-5">
              <h2 className="text-lg font-semibold text-stone-900">{product.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">{product.description}</p>
              <p className="mt-3 font-semibold text-stone-900">
                {formatGBP(product.price)}
                {product.packSize && <span className="ml-1 font-normal text-stone-400">/ {product.packSize}</span>}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
