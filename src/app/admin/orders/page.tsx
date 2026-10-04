"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatGBP } from "@/lib/pricing";
import type { OrderRecord } from "@/lib/order-service";

const STATUS_OPTIONS = ["", "pending", "paid", "preparing", "ready", "completed", "failed", "cancelled", "refunded"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-stone-100 text-stone-600",
  paid: "bg-sky-100 text-sky-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-stone-200 text-stone-600",
  refunded: "bg-stone-200 text-stone-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      setError("Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Orders</h1>
      <p className="mt-1 text-sm text-stone-500">All restaurant and shop orders.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#A61400]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-1 gap-2"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or order id…"
            className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#A61400]"
          />
          <button type="submit" className="tap-press rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700">
            Search
          </button>
        </form>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900">
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-stone-900">{o.fullName}</div>
                    <div className="text-xs text-stone-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-600">{o.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-stone-100 text-stone-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">{formatGBP(o.total)}</td>
                  <td className="px-4 py-3 text-stone-500">{new Date(o.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-sm font-medium text-[#A61400] hover:text-[#7d0f00]">
                      View
                    </Link>
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
