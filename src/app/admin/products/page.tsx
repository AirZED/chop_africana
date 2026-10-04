"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuItem } from "@/lib/types";
import { formatGBP } from "@/lib/pricing";
import { categoryMeta } from "@/lib/menu-data";
import { createAsyncResource } from "@/lib/async-resource";

type AdminMenuItem = MenuItem & { active: boolean };

async function fetchProducts(): Promise<AdminMenuItem[]> {
  const res = await fetch("/api/admin/products");
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return data.items;
}

const useProductsResource = createAsyncResource(fetchProducts);

export default function AdminProductsPage() {
  const items = useProductsResource((s) => s.data) ?? [];
  const loading = useProductsResource((s) => s.loading);
  const loadError = useProductsResource((s) => s.error);
  const load = useProductsResource((s) => s.load);

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  function toggleSelected(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleActive(item: AdminMenuItem) {
    setBusyId(item.itemId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/products/${item.itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          category: item.category,
          emoji: item.emoji,
          image: item.image,
          prepMinutes: item.prepMinutes,
          popular: !!item.popular,
          active: !item.active,
          modifierGroups: item.modifierGroups.map((g) => ({
            title: g.title,
            required: g.required,
            maxSelections: g.maxSelections,
            options: g.options.map((o) => ({ name: o.name, price: o.price })),
          })),
        }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setActionError("Couldn't update that item.");
    } finally {
      setBusyId(null);
    }
  }

  async function bulkSetActive(active: boolean) {
    if (selected.size === 0) return;
    setActionError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), active }),
      });
      if (!res.ok) throw new Error();
      setSelected(new Set());
      await load();
    } catch {
      setActionError("Couldn't update the selected items.");
    }
  }

  async function move(id: string, direction: "up" | "down") {
    setBusyId(id);
    try {
      await fetch(`/api/admin/products/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: AdminMenuItem) {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    setBusyId(item.itemId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/products/${item.itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setActionError("Couldn't delete that item.");
    } finally {
      setBusyId(null);
    }
  }

  const error = actionError ?? loadError;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Menu Items</h1>
          <p className="mt-1 text-sm text-stone-500">Manage what&apos;s available on the restaurant menu.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="tap-press rounded-lg bg-[#A61400] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          + New Item
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#A61400]"
        />
        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">{selected.size} selected</span>
            <button onClick={() => bulkSetActive(true)} className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50">
              Activate
            </button>
            <button onClick={() => bulkSetActive(false)} className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-50">
              Deactivate
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Popular</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    No items found.
                  </td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr key={item.itemId} className={busyId === item.itemId ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.itemId)}
                      onChange={() => toggleSelected(item.itemId)}
                      className="size-4 accent-[#A61400]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                          <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${categoryMeta[item.category].gradient} text-lg`}
                        >
                          {item.emoji}
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-stone-900">{item.name}</div>
                        <div className="line-clamp-1 max-w-xs text-xs text-stone-500">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.category}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{formatGBP(item.basePrice)}</td>
                  <td className="px-4 py-3">{item.popular ? "★" : ""}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={busyId === item.itemId}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {item.active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => move(item.itemId, "up")} disabled={busyId === item.itemId} aria-label="Move up" className="text-stone-400 hover:text-stone-700">
                        ↑
                      </button>
                      <button onClick={() => move(item.itemId, "down")} disabled={busyId === item.itemId} aria-label="Move down" className="text-stone-400 hover:text-stone-700">
                        ↓
                      </button>
                      <Link
                        href={`/admin/products/${item.itemId}`}
                        className="ml-2 text-sm font-medium text-[#A61400] hover:text-[#7d0f00]"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => remove(item)}
                        disabled={busyId === item.itemId}
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
