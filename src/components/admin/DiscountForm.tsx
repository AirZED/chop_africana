"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiscountCode } from "@/lib/discount-service";

export default function DiscountForm({ initial }: { initial?: DiscountCode }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<"percent" | "fixed">(initial?.type ?? "percent");
  const [value, setValue] = useState(initial ? String(initial.value) : "");
  const [minSubtotal, setMinSubtotal] = useState(initial ? String(initial.minSubtotal) : "0");
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit ? String(initial.usageLimit) : "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : "");
  const [active, setActive] = useState(initial?.active ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valueNum = Number(value);
    if (!code.trim()) return setError("Code is required");
    if (!Number.isFinite(valueNum) || valueNum <= 0) return setError("Value must be a positive number");

    const payload = {
      code: code.trim(),
      type,
      value: valueNum,
      active,
      minSubtotal: Number(minSubtotal) || 0,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/discounts/${initial!.code}` : "/api/admin/discounts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/discounts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Code</span>
            <input
              required
              disabled={isEdit}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 font-mono outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10 disabled:bg-stone-100"
              placeholder="WELCOME10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off (GBP)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Value</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder={type === "percent" ? "10" : "5.00"}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Minimum spend (GBP)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Usage limit (optional)</span>
            <input
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
              placeholder="Unlimited"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">Expires (optional)</span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            />
          </label>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#A61400]" />
              Active
            </label>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => router.push("/admin/discounts")} className="tap-press rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="tap-press rounded-xl bg-[#A61400] px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50">
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Code"}
        </button>
      </div>
    </form>
  );
}
