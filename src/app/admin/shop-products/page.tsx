"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShopProduct } from "@/lib/types";
import { formatGBP } from "@/lib/pricing";
import { createAsyncResource } from "@/lib/async-resource";

type AdminShopProduct = ShopProduct & { active: boolean };

async function fetchProducts(): Promise<AdminShopProduct[]> {
  const res = await fetch("/api/admin/shop-products");
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return data.products;
}

const useShopProductsResource = createAsyncResource(fetchProducts);

export default function AdminShopProductsPage() {
  const products = useShopProductsResource((s) => s.data) ?? [];
  const loading = useShopProductsResource((s) => s.loading);
  const loadError = useShopProductsResource((s) => s.error);
  const load = useShopProductsResource((s) => s.load);

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(product: AdminShopProduct) {
    setBusyId(product.productId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/shop-products/${product.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          packSize: product.packSize,
          emoji: product.emoji,
          image: product.image,
          ingredients: product.ingredients,
          allergens: product.allergens,
          bakingSteps: product.bakingSteps,
          active: !product.active,
        }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setActionError("Couldn't update that product.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(product: AdminShopProduct) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setBusyId(product.productId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/shop-products/${product.productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setActionError("Couldn't delete that product.");
    } finally {
      setBusyId(null);
    }
  }

  const error = actionError ?? loadError;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Shop Products</h1>
          <p className="mt-1 text-sm text-stone-500">Manage the frozen pies sold in the online shop.</p>
        </div>
        <Link
          href="/admin/shop-products/new"
          className="tap-press rounded-lg bg-[#A61400] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          + New Product
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Pack size</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    No products yet.
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.productId} className={busyId === product.productId ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                          <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F4DAD5] text-lg">
                          {product.emoji}
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-stone-900">{product.name}</div>
                        <div className="line-clamp-1 max-w-xs text-xs text-stone-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{product.packSize || "—"}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{formatGBP(product.price)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(product)}
                      disabled={busyId === product.productId}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {product.active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/shop-products/${product.productId}`}
                        className="text-sm font-medium text-[#A61400] hover:text-[#7d0f00]"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => remove(product)}
                        disabled={busyId === product.productId}
                        className="text-sm font-medium text-stone-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
