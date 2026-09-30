"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "./icons";

const STORES = [
  { name: "Greenway Supermarket", address: "88 Mile End Road, London" },
  { name: "Afro Foods Market", address: "5 Whitechapel Road, London" },
];

const MAP_QUERY = encodeURIComponent("24 High Street, Whitechapel, London E1 6AB");

export default function StoreLocator() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      STORES.filter((s) =>
        `${s.name} ${s.address}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <section id="find-in-store" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-900">Find In A Store</h2>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-stone-200 shadow-sm">
          <iframe
            title="Store locator map"
            src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
            className="h-[460px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="pointer-events-auto absolute left-4 top-4 w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
              <label className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2">
                <SearchIcon className="size-4 text-stone-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Map"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
                />
              </label>

              <p className="mt-4 text-sm font-medium text-stone-500">Stores Around You.</p>
              <div className="mt-2 flex flex-col gap-2">
                {filtered.map((store) => (
                  <div
                    key={store.name}
                    className="flex items-center gap-3 rounded-xl bg-emerald-50 p-2"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-lg">
                      🏬
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">{store.name}</p>
                      <p className="truncate text-xs text-stone-500">{store.address}</p>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="py-2 text-sm text-stone-400">No stores match &ldquo;{query}&rdquo;.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
