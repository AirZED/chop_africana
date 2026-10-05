"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShopProduct } from "@/lib/types";
import ImageUploadField from "./ImageUploadField";

interface ShopProductFormProps {
  productId?: string;
  initial?: ShopProduct & { active: boolean };
}

export default function ShopProductForm({ productId, initial }: ShopProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [packSize, setPackSize] = useState(initial?.packSize ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🥧");
  const [image, setImage] = useState(initial?.image ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [allergens, setAllergens] = useState(initial?.allergens ?? "");
  const [storageInstructions, setStorageInstructions] = useState(initial?.storageInstructions ?? "");
  const [bakingSteps, setBakingSteps] = useState(initial?.bakingSteps.join("\n") ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    if (!name.trim()) return setError("Name is required");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Price must be a valid number");
    if (stock.trim() && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      return setError("Stock must be a non-negative whole number, or left blank for unlimited");
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      packSize: packSize.trim(),
      emoji: emoji.trim() || "🥧",
      image: image.trim() || undefined,
      ingredients: ingredients.trim(),
      allergens: allergens.trim(),
      storageInstructions: storageInstructions.trim(),
      bakingSteps: bakingSteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      active,
      stock: stock.trim() ? Number(stock) : null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        productId ? `/api/admin/shop-products/${productId}` : "/api/admin/shop-products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/shop-products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900">Basics</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Beef Pie"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Minced beef slow-cooked with onions, carrots and a warm mix of spices..."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Price (GBP)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="12.00"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Pack size</span>
            <input
              value={packSize}
              onChange={(e) => setPackSize(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="4 fzn pk"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Emoji (fallback)</span>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-center text-lg outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="🥧"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Stock (optional)</span>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Unlimited"
            />
          </label>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-[#A61400]"
              />
              Active (visible on storefront)
            </label>
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField label="Photo" value={image} onChange={setImage} folder="shop" />
            <span className="mt-1.5 block text-xs text-stone-400">Falls back to the emoji badge when empty.</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900">Product details</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Ingredients</span>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Wheat flour, butter, minced beef (28%)..."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Allergens</span>
            <textarea
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Wheat (gluten), milk, egg..."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Storage &amp; preparation</span>
            <textarea
              value={storageInstructions}
              onChange={(e) => setStorageInstructions(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Keep frozen at -18°C until ready to use. Do not refreeze after thawing..."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Baking instructions (one step per line)</span>
            <textarea
              value={bakingSteps}
              onChange={(e) => setBakingSteps(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder={"Preheat to 200°C (180°C fan).\nBake from frozen, no thawing.\n30–35 minutes until golden, rest 5 minutes."}
            />
          </label>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/shop-products")}
          className="tap-press rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="tap-press rounded-xl bg-[#A61400] px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : productId ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
