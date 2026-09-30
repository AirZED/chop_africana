"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { menuCategories } from "@/lib/menu-data";
import { MenuItem } from "@/lib/types";
import ImageUploadField from "./ImageUploadField";

interface FormOption {
  key: string;
  name: string;
  price: string;
}

interface FormGroup {
  key: string;
  title: string;
  required: boolean;
  maxSelections: string;
  options: FormOption[];
}

interface ProductFormProps {
  itemId?: string;
  initial?: MenuItem & { active: boolean };
}

let localKeyCounter = 0;
function nextKey() {
  localKeyCounter += 1;
  return `k${localKeyCounter}`;
}

function toFormGroups(item?: MenuItem): FormGroup[] {
  if (!item) return [];
  return item.modifierGroups.map((g) => ({
    key: nextKey(),
    title: g.title,
    required: g.required,
    maxSelections: String(g.maxSelections),
    options: g.options.map((o) => ({ key: nextKey(), name: o.name, price: String(o.price) })),
  }));
}

export default function ProductForm({ itemId, initial }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<MenuItem["category"]>(initial?.category ?? "Mains");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🍽️");
  const [image, setImage] = useState(initial?.image ?? "");
  const [prepMinutes, setPrepMinutes] = useState(initial?.prepMinutes ? String(initial.prepMinutes) : "15");
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice) : "");
  const [popular, setPopular] = useState(initial?.popular ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [groups, setGroups] = useState<FormGroup[]>(toFormGroups(initial));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addGroup() {
    setGroups((gs) => [
      ...gs,
      { key: nextKey(), title: "", required: false, maxSelections: "1", options: [] },
    ]);
  }

  function updateGroup(key: string, patch: Partial<FormGroup>) {
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  function removeGroup(key: string) {
    setGroups((gs) => gs.filter((g) => g.key !== key));
  }

  function addOption(groupKey: string) {
    setGroups((gs) =>
      gs.map((g) =>
        g.key === groupKey ? { ...g, options: [...g.options, { key: nextKey(), name: "", price: "0" }] } : g
      )
    );
  }

  function updateOption(groupKey: string, optionKey: string, patch: Partial<FormOption>) {
    setGroups((gs) =>
      gs.map((g) =>
        g.key === groupKey
          ? { ...g, options: g.options.map((o) => (o.key === optionKey ? { ...o, ...patch } : o)) }
          : g
      )
    );
  }

  function removeOption(groupKey: string, optionKey: string) {
    setGroups((gs) =>
      gs.map((g) =>
        g.key === groupKey ? { ...g, options: g.options.filter((o) => o.key !== optionKey) } : g
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(basePrice);
    if (!name.trim()) return setError("Name is required");
    if (!Number.isFinite(price) || price < 0) return setError("Base price must be a valid number");
    for (const g of groups) {
      if (!g.title.trim()) return setError("Every modifier group needs a title");
      if (g.options.length === 0) return setError(`"${g.title}" needs at least one option`);
      const max = Number(g.maxSelections);
      if (!Number.isInteger(max) || max < 1) return setError(`"${g.title}" max selections must be at least 1`);
      for (const o of g.options) {
        if (!o.name.trim()) return setError(`An option in "${g.title}" is missing a name`);
        if (!Number.isFinite(Number(o.price)) || Number(o.price) < 0) {
          return setError(`"${o.name}" has an invalid price`);
        }
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      basePrice: price,
      category,
      emoji: emoji.trim() || "🍽️",
      image: image.trim() || undefined,
      prepMinutes: Number(prepMinutes) || 15,
      popular,
      active,
      modifierGroups: groups.map((g) => ({
        title: g.title.trim(),
        required: g.required,
        maxSelections: Number(g.maxSelections),
        options: g.options.map((o) => ({ name: o.name.trim(), price: Number(o.price) })),
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(itemId ? `/api/admin/products/${itemId}` : "/api/admin/products", {
        method: itemId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/products");
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
              placeholder="Smash Burger Double"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Two beef patties, aged cheddar, secret sauce, house pickles."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MenuItem["category"])}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            >
              {menuCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Base Price (GBP)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="12.50"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Emoji (fallback)</span>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-center text-lg outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="🍔"
            />
          </label>
          <div className="sm:col-span-2">
            <ImageUploadField label="Photo" value={image} onChange={setImage} folder="menu" />
            <span className="mt-1.5 block text-xs text-stone-400">Falls back to the emoji badge when empty.</span>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Prep Time (minutes)</span>
            <input
              type="number"
              min="0"
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="15"
            />
          </label>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="size-4 accent-[#A61400]"
              />
              Popular
            </label>
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
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-stone-900">Modifier Groups</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              E.g. &ldquo;Cooking Temperature&rdquo; (required, pick 1) or &ldquo;Add Extras&rdquo; (optional, up to 3).
            </p>
          </div>
          <button
            type="button"
            onClick={addGroup}
            className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700"
          >
            + Add Group
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.key} className="rounded-xl border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                <input
                  value={g.title}
                  onChange={(e) => updateGroup(g.key, { title: e.target.value })}
                  placeholder="Group title (e.g. Cooking Temperature)"
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(g.key)}
                  className="tap-press rounded-lg px-2 py-2 text-sm font-medium text-stone-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={g.required}
                    onChange={(e) => updateGroup(g.key, { required: e.target.checked })}
                    className="size-4 accent-[#A61400]"
                  />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  Max selections
                  <input
                    type="number"
                    min="1"
                    value={g.maxSelections}
                    onChange={(e) => updateGroup(g.key, { maxSelections: e.target.value })}
                    className="w-16 rounded-lg border border-stone-300 px-2 py-1 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {g.options.map((o) => (
                  <div key={o.key} className="flex items-center gap-2">
                    <input
                      value={o.name}
                      onChange={(e) => updateOption(g.key, o.key, { name: e.target.value })}
                      placeholder="Option name"
                      className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={o.price}
                      onChange={(e) => updateOption(g.key, o.key, { price: e.target.value })}
                      placeholder="0.00"
                      className="w-24 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(g.key, o.key)}
                      className="tap-press px-2 text-sm text-stone-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(g.key)}
                  className="tap-press self-start text-sm font-medium text-[#A61400]"
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-stone-400">No modifier groups — this item will be a quick-add with no customization.</p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="tap-press rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="tap-press rounded-xl bg-[#A61400] px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : itemId ? "Save Changes" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
