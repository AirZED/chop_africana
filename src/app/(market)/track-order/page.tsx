"use client";

import { useState } from "react";
import { formatGBP } from "@/lib/pricing";
import type { OrderItemRecord, OrderRecord, OrderStatusHistoryEntry } from "@/lib/order-service";

const STATUS_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Order received",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  failed: "Payment failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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

interface LookupResult {
  order: OrderRecord;
  items: OrderItemRecord[];
  history: OrderStatusHistoryEntry[];
}

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-stone-900">Track Your Order</h1>
      <p className="mt-2 text-stone-500">
        Enter the email you ordered with and your order number (found in your confirmation email).
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Order number</span>
          <input
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded-full border border-stone-300 px-4 py-3 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-red-100"
            placeholder="e.g. 4F2A91"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="tap-press mt-2 rounded-full bg-[#A61400] px-6 py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Track Order"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Order #{result.order.id.slice(-6).toUpperCase()}</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[result.order.status] ?? "bg-stone-100 text-stone-600"}`}>
              {STATUS_LABELS[result.order.status] ?? result.order.status}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {result.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">
                  {item.name} &times; {item.quantity}
                </span>
                <span className="text-stone-900">{formatGBP(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-stone-100 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatGBP(result.order.subtotal)}</span>
            </div>
            {result.order.discount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Discount{result.order.discountCode ? ` (${result.order.discountCode})` : ""}</span>
                <span>-{formatGBP(result.order.discount)}</span>
              </div>
            )}
            {result.order.delivery > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span>{formatGBP(result.order.delivery)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatGBP(result.order.total)}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-stone-100 pt-4">
            <h3 className="text-sm font-semibold text-stone-900">Status history</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {result.history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#A61400]" />
                  <div>
                    <p className="font-medium text-stone-900">{STATUS_LABELS[h.status] ?? h.status}</p>
                    <p className="text-stone-400">{new Date(h.createdAt).toLocaleString("en-GB")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
