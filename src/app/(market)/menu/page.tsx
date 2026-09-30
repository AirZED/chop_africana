"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { menuCategories, restaurant } from "@/lib/menu-data";
import { useCartStore } from "@/lib/cart-store";
import { useMenuStore } from "@/lib/menu-store";
import { formatGBP } from "@/lib/pricing";
import { MenuItem } from "@/lib/types";
import { ClockIcon, PlusIcon, SearchIcon } from "@/components/site/icons";
import CustomizerSheet from "@/components/CustomizerSheet";

function MenuContent() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");

  const items = useMenuStore((s) => s.items);
  const loading = useMenuStore((s) => s.loading);
  const error = useMenuStore((s) => s.error);
  const fetchMenu = useMenuStore((s) => s.fetchMenu);

  const setTable = useCartStore((s) => s.setTable);
  const addRestaurantItem = useCartStore((s) => s.addRestaurantItem);

  const [activeCategory, setActiveCategory] = useState<string>(menuCategories[0]);
  const [query, setQuery] = useState("");
  const [customizerItem, setCustomizerItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    if (table) setTable(table);
  }, [table, setTable]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const visibleItems = useMemo(() => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return items.filter((i) => i.category === activeCategory);
  }, [items, query, activeCategory]);

  function handleAdd(item: MenuItem) {
    if (item.modifierGroups.some((g) => g.required)) {
      setCustomizerItem(item);
    } else {
      addRestaurantItem(item.itemId, [], 1);
      setToast(`Added ${item.name} to your order`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Restaurant Menu</h1>
          <p className="mt-1 text-sm text-stone-500">
            Opens: {restaurant.hours}
            {table && <span className="ml-2 font-medium text-emerald-600">· Table {table}</span>}
          </p>
        </div>
        <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5">
          <SearchIcon className="size-4 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What Do You Crave?"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </label>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-[180px_1fr]">
        <nav className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {menuCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setQuery("");
              }}
              className={`tap-press shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-medium ${
                !query && activeCategory === cat ? "bg-stone-200 text-stone-900" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        <div>
          {loading && items.length === 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
              <p>{query ? `No dishes match "${query}".` : "More dishes coming soon."}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item, i) => (
              <div
                key={item.itemId}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-rise-in overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-stone-100 text-4xl">{item.emoji}</div>
                  )}
                  <button
                    onClick={() => handleAdd(item)}
                    aria-label={`Add ${item.name}`}
                    className="tap-press absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-white text-stone-900 shadow-md"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-900">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-900">{formatGBP(item.basePrice)}</span>
                    {item.prepMinutes != null && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <ClockIcon className="size-3.5" /> {item.prepMinutes} mins
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="animate-toast-in fixed left-1/2 top-24 z-30 max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-xl">
          ✓ {toast}
        </div>
      )}

      {customizerItem && (
        <CustomizerSheet
          item={customizerItem}
          onClose={() => setCustomizerItem(null)}
          onSubmit={(selections, quantity, notes) => {
            addRestaurantItem(customizerItem.itemId, selections, quantity, notes);
            setToast(`Added ${customizerItem.name} to your order`);
            setCustomizerItem(null);
          }}
        />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuContent />
    </Suspense>
  );
}
