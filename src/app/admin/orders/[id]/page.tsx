"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatGBP } from "@/lib/pricing";
import type { OrderItemRecord, OrderRecord, OrderStatus, OrderStatusHistoryEntry } from "@/lib/order-service";

const ORDER_STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
};

const REFUNDABLE = ["paid", "preparing", "ready", "completed"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface OrderDetail {
  order: OrderRecord;
  items: OrderItemRecord[];
  history: OrderStatusHistoryEntry[];
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) {
      setError("Order not found.");
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Couldn't update status");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update status");
    } finally {
      setBusy(false);
    }
  }

  async function refund() {
    if (!confirm("Refund this order via Stripe? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Refund failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (!data) return <p className="text-stone-400">Loading…</p>;

  const { order, items, history } = data;
  const transitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push("/admin/orders")} className="text-sm font-medium text-stone-500 hover:text-stone-700">
        &larr; Back to Orders
      </button>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">
          Order #{order.id.slice(-6).toUpperCase()}
        </h1>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Customer</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">Name</dt><dd className="text-stone-900">{order.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Email</dt><dd className="text-stone-900">{order.email}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Phone</dt><dd className="text-stone-900">{order.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Fulfillment</dt><dd className="capitalize text-stone-900">{order.fulfillment}</dd></div>
            {order.table && <div className="flex justify-between"><dt className="text-stone-500">Table</dt><dd className="text-stone-900">{order.table}</dd></div>}
            {order.address && <div className="flex justify-between gap-4"><dt className="shrink-0 text-stone-500">Address</dt><dd className="text-right text-stone-900">{order.address}</dd></div>}
          </dl>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Update status</h2>
          {transitions.length === 0 ? (
            <p className="mt-3 text-sm text-stone-400">No further manual transitions from this status.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {transitions.map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => updateStatus(s)}
                  className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Mark {STATUS_LABELS[s] ?? s}
                </button>
              ))}
            </div>
          )}
          {REFUNDABLE.includes(order.status) && (
            <button
              disabled={busy}
              onClick={refund}
              className="tap-press mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Refund via Stripe
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Items</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-stone-700">
                {item.name}
                {item.selectionsSummary && <span className="text-stone-400"> ({item.selectionsSummary})</span>} &times; {item.quantity}
              </span>
              <span className="text-stone-900">{formatGBP(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{formatGBP(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
              <span>-{formatGBP(order.discount)}</span>
            </div>
          )}
          {order.delivery > 0 && <div className="flex justify-between text-stone-600"><span>Delivery</span><span>{formatGBP(order.delivery)}</span></div>}
          <div className="mt-1 flex justify-between font-semibold text-stone-900"><span>Total</span><span>{formatGBP(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Status history</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {history.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-[#A61400]" />
              <div>
                <p className="font-medium text-stone-900">
                  {STATUS_LABELS[h.status] ?? h.status}
                  {h.note && <span className="font-normal text-stone-500"> — {h.note}</span>}
                </p>
                <p className="text-stone-400">
                  {new Date(h.createdAt).toLocaleString("en-GB")} &middot; {h.changedBy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
