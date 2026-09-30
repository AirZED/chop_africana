"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsSummary, AnalyticsRange } from "@/lib/order-service";
import { createAsyncResource } from "@/lib/async-resource";

async function fetchAnalytics(range: AnalyticsRange): Promise<AnalyticsSummary> {
  const res = await fetch(`/api/admin/analytics?range=${range}`);
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

const useAnalyticsResource = createAsyncResource(fetchAnalytics);

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

// Validated categorical palette (dataviz skill, --mode light): fixed order, one
// color per fulfillment mode — identity encoding, never re-assigned by rank.
const MODE_COLOR: Record<string, string> = {
  "dine-in": "#2a78d6", // slot 1 blue
  pickup: "#eb6834", // slot 2 orange
  delivery: "#1baf7a", // slot 3 aqua
};
const MODE_LABEL: Record<string, string> = {
  "dine-in": "Dine-In",
  pickup: "Pickup",
  delivery: "Delivery",
};
const SEQUENTIAL_BLUE = "#2a78d6";

function centsToGBP(cents: number): string {
  return (cents / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-stone-900" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-stone-500">{sub}</div>}
    </div>
  );
}

function BarRow({
  label,
  value,
  displayValue,
  max,
  color,
}: {
  label: string;
  value: number;
  displayValue: string;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="font-semibold text-stone-900" style={{ fontVariantNumeric: "tabular-nums" }}>
          {displayValue}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const data = useAnalyticsResource((s) => s.data);
  const loading = useAnalyticsResource((s) => s.loading);
  const error = useAnalyticsResource((s) => s.error);
  const load = useAnalyticsResource((s) => s.load);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const chartData = useMemo(
    () => (data?.revenueByDay ?? []).map((d) => ({ date: d.date, revenue: d.revenueCents / 100 })),
    [data]
  );

  const maxModeRevenue = useMemo(
    () => Math.max(1, ...(data?.revenueByMode.map((m) => m.revenueCents) ?? [1])),
    [data]
  );
  const maxItemRevenue = useMemo(
    () => Math.max(1, ...(data?.topItems.map((i) => i.revenueCents) ?? [1])),
    [data]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-500">Financial performance, from paid Stripe orders.</p>
        </div>
        <div className="flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                range === r.value ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading && !data && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Revenue" value={centsToGBP(data.totalRevenueCents)} />
            <StatTile label="Paid Orders" value={String(data.paidOrderCount)} />
            <StatTile label="Avg Order Value" value={centsToGBP(data.avgOrderValueCents)} />
            <StatTile
              label="Conversion"
              value={`${Math.round(data.conversionRate * 100)}%`}
              sub={`${data.pendingCount} pending · ${data.failedCount} failed`}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-stone-900">Revenue Over Time</h2>
            <div className="mt-4 h-64 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-stone-400">
                  No paid orders in this range yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#898781" }}
                      axisLine={{ stroke: "#c3c2b7" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#898781" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `£${v}`}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value) => [`£${Number(value).toFixed(2)}`, "Revenue"]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e1e0d9",
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={SEQUENTIAL_BLUE}
                      strokeWidth={2}
                      fill="url(#revenueFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-stone-900">Revenue by Fulfillment Mode</h2>
              <div className="mt-4 flex flex-col gap-4">
                {data.revenueByMode.length === 0 && (
                  <p className="text-sm text-stone-400">No paid orders in this range yet.</p>
                )}
                {data.revenueByMode.map((m) => (
                  <BarRow
                    key={m.mode}
                    label={`${MODE_LABEL[m.mode] ?? m.mode} · ${m.orders} order${m.orders === 1 ? "" : "s"}`}
                    value={m.revenueCents}
                    displayValue={centsToGBP(m.revenueCents)}
                    max={maxModeRevenue}
                    color={MODE_COLOR[m.mode] ?? "#898781"}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-stone-900">Top Selling Items</h2>
              <div className="mt-4 flex flex-col gap-4">
                {data.topItems.length === 0 && (
                  <p className="text-sm text-stone-400">No paid orders in this range yet.</p>
                )}
                {data.topItems.map((item) => (
                  <BarRow
                    key={item.name}
                    label={`${item.name} · ${item.quantity} sold`}
                    value={item.revenueCents}
                    displayValue={centsToGBP(item.revenueCents)}
                    max={maxItemRevenue}
                    color={SEQUENTIAL_BLUE}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <h2 className="px-5 pt-5 font-semibold text-stone-900">Recent Orders</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-2.5">Time</th>
                    <th className="px-5 py-2.5">Mode</th>
                    <th className="px-5 py-2.5">Items</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                        No orders in this range yet.
                      </td>
                    </tr>
                  )}
                  {data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 text-stone-500">
                        {new Date(o.created_at + "Z").toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 text-stone-700">{MODE_LABEL[o.mode] ?? o.mode}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-stone-600">{o.itemSummary}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            o.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : o.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 text-right font-medium text-stone-900"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {centsToGBP(o.total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-2" />
          </div>
        </>
      )}
    </div>
  );
}
