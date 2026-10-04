"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatGBP } from "@/lib/pricing";
import type { DiscountCode } from "@/lib/discount-service";

export default function AdminDiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      setCodes(data.codes);
    } catch {
      setError("Couldn't load discount codes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(code: string) {
    if (!confirm(`Delete code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/discounts/${code}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Couldn't delete that code.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Discount Codes</h1>
          <p className="mt-1 text-sm text-stone-500">Promo codes customers can apply at checkout.</p>
        </div>
        <Link href="/admin/discounts/new" className="tap-press rounded-lg bg-[#A61400] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          + New Code
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Min spend</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">Loading…</td></tr>
              )}
              {!loading && codes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">No discount codes yet.</td></tr>
              )}
              {codes.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-3 font-mono font-semibold text-stone-900">{c.code}</td>
                  <td className="px-4 py-3 text-stone-600">{c.type === "percent" ? `${c.value}%` : formatGBP(c.value)}</td>
                  <td className="px-4 py-3 text-stone-600">{c.minSubtotal > 0 ? formatGBP(c.minSubtotal) : "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/discounts/${c.code}`} className="text-sm font-medium text-[#A61400] hover:text-[#7d0f00]">Edit</Link>
                      <button onClick={() => remove(c.code)} className="text-sm font-medium text-stone-400 hover:text-red-600">Delete</button>
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
