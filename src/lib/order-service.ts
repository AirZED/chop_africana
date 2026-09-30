import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { CartLine, FulfillmentMode, MenuItem, ShopProduct } from "./types";
import { lineUnitPrice } from "./cart-pricing";

interface CreateOrderInput {
  stripePaymentIntentId: string;
  fulfillment: FulfillmentMode;
  table?: string | null;
  fullName: string;
  phone: string;
  email: string;
  address?: string | null;
  items: CartLine[];
  menu: MenuItem[];
  shop: ShopProduct[];
  subtotal: number;
  delivery: number;
  total: number;
}

function selectionsSummary(item: MenuItem, line: Extract<CartLine, { kind: "restaurant" }>): string {
  const parts: string[] = [];
  for (const group of item.modifierGroups) {
    const sel = line.selections.find((s) => s.groupId === group.groupId);
    if (!sel || sel.optionIds.length === 0) continue;
    const names = sel.optionIds.map((id) => group.options.find((o) => o.id === id)?.name).filter(Boolean);
    parts.push(names.join(", "));
  }
  return parts.join(" · ");
}

function channelFor(items: CartLine[]): "restaurant" | "shop" | "mixed" {
  const hasRestaurant = items.some((i) => i.kind === "restaurant");
  const hasShop = items.some((i) => i.kind === "shop");
  if (hasRestaurant && hasShop) return "mixed";
  return hasShop ? "shop" : "restaurant";
}

export function createOrder(input: CreateOrderInput): string {
  const db = getDb();
  const orderId = randomUUID();

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, stripe_payment_intent_id, status, channel, fulfillment, table_number,
      full_name, phone, email, address, subtotal_cents, delivery_cents, total_cents
    ) VALUES (
      @id, @stripePaymentIntentId, 'pending', @channel, @fulfillment, @table,
      @fullName, @phone, @email, @address, @subtotalCents, @deliveryCents, @totalCents
    )
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, kind, ref_id, name_snapshot, quantity, unit_price_cents, line_total_cents, selections_summary)
    VALUES (@id, @orderId, @kind, @refId, @nameSnapshot, @quantity, @unitPriceCents, @lineTotalCents, @selectionsSummary)
  `);

  const run = db.transaction(() => {
    insertOrder.run({
      id: orderId,
      stripePaymentIntentId: input.stripePaymentIntentId,
      channel: channelFor(input.items),
      fulfillment: input.fulfillment,
      table: input.table ?? null,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      address: input.address ?? null,
      subtotalCents: Math.round(input.subtotal * 100),
      deliveryCents: Math.round(input.delivery * 100),
      totalCents: Math.round(input.total * 100),
    });

    for (const line of input.items) {
      const unit = lineUnitPrice(line, input.menu, input.shop);
      if (line.kind === "restaurant") {
        const item = input.menu.find((m) => m.itemId === line.refId);
        if (!item) continue;
        insertItem.run({
          id: randomUUID(),
          orderId,
          kind: "restaurant",
          refId: item.itemId,
          nameSnapshot: item.name,
          quantity: line.quantity,
          unitPriceCents: Math.round(unit * 100),
          lineTotalCents: Math.round(unit * line.quantity * 100),
          selectionsSummary: selectionsSummary(item, line),
        });
      } else {
        const product = input.shop.find((p) => p.productId === line.refId);
        if (!product) continue;
        insertItem.run({
          id: randomUUID(),
          orderId,
          kind: "shop",
          refId: product.productId,
          nameSnapshot: product.name,
          quantity: line.quantity,
          unitPriceCents: Math.round(unit * 100),
          lineTotalCents: Math.round(unit * line.quantity * 100),
          selectionsSummary: "",
        });
      }
    }
  });
  run();

  return orderId;
}

export function markOrderStatus(stripePaymentIntentId: string, status: "paid" | "failed") {
  const db = getDb();
  db.prepare(
    "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE stripe_payment_intent_id = ?"
  ).run(status, stripePaymentIntentId);
}

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";

function rangeToSqlModifier(range: AnalyticsRange): string | null {
  switch (range) {
    case "today":
      return "-1 day";
    case "7d":
      return "-7 days";
    case "30d":
      return "-30 days";
    case "90d":
      return "-90 days";
    case "all":
      return null;
  }
}

export interface AnalyticsSummary {
  totalRevenueCents: number;
  paidOrderCount: number;
  avgOrderValueCents: number;
  pendingCount: number;
  failedCount: number;
  conversionRate: number;
  revenueByDay: { date: string; revenueCents: number; orders: number }[];
  revenueByMode: { mode: string; revenueCents: number; orders: number }[];
  topItems: { name: string; quantity: number; revenueCents: number }[];
  recentOrders: {
    id: string;
    status: string;
    mode: string;
    total_cents: number;
    created_at: string;
    itemSummary: string;
  }[];
}

export function getAnalyticsSummary(range: AnalyticsRange): AnalyticsSummary {
  const db = getDb();
  const modifier = rangeToSqlModifier(range);
  const cutoffClause = modifier ? `AND created_at >= datetime('now', '${modifier}')` : "";

  const totals = db
    .prepare(
      `SELECT COUNT(*) as paidOrderCount, COALESCE(SUM(total_cents),0) as totalRevenueCents
       FROM orders WHERE status = 'paid' ${cutoffClause}`
    )
    .get() as { paidOrderCount: number; totalRevenueCents: number };

  const pending = db
    .prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending' ${cutoffClause}`)
    .get() as { c: number };
  const failed = db
    .prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'failed' ${cutoffClause}`)
    .get() as { c: number };

  const totalAttempts = totals.paidOrderCount + pending.c + failed.c;
  const conversionRate = totalAttempts > 0 ? totals.paidOrderCount / totalAttempts : 0;

  const revenueByDay = db
    .prepare(
      `SELECT date(created_at) as date, COALESCE(SUM(total_cents),0) as revenueCents, COUNT(*) as orders
       FROM orders WHERE status = 'paid' ${cutoffClause}
       GROUP BY date(created_at) ORDER BY date ASC`
    )
    .all() as { date: string; revenueCents: number; orders: number }[];

  const revenueByMode = db
    .prepare(
      `SELECT fulfillment as mode, COALESCE(SUM(total_cents),0) as revenueCents, COUNT(*) as orders
       FROM orders WHERE status = 'paid' ${cutoffClause}
       GROUP BY fulfillment ORDER BY revenueCents DESC`
    )
    .all() as { mode: string; revenueCents: number; orders: number }[];

  const topItems = db
    .prepare(
      `SELECT oi.name_snapshot as name, SUM(oi.quantity) as quantity, SUM(oi.line_total_cents) as revenueCents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'paid' ${cutoffClause.replace(/created_at/g, "o.created_at")}
       GROUP BY oi.name_snapshot
       ORDER BY revenueCents DESC
       LIMIT 8`
    )
    .all() as { name: string; quantity: number; revenueCents: number }[];

  const recentOrdersRaw = db
    .prepare(
      `SELECT id, status, fulfillment as mode, total_cents, created_at
       FROM orders ${modifier ? `WHERE created_at >= datetime('now', '${modifier}')` : ""}
       ORDER BY created_at DESC LIMIT 15`
    )
    .all() as { id: string; status: string; mode: string; total_cents: number; created_at: string }[];

  const itemsByOrder = db
    .prepare(
      `SELECT order_id, name_snapshot, quantity FROM order_items
       WHERE order_id IN (${recentOrdersRaw.map(() => "?").join(",") || "''"})`
    )
    .all(...recentOrdersRaw.map((o) => o.id)) as {
    order_id: string;
    name_snapshot: string;
    quantity: number;
  }[];

  const recentOrders = recentOrdersRaw.map((o) => ({
    ...o,
    itemSummary: itemsByOrder
      .filter((i) => i.order_id === o.id)
      .map((i) => `${i.name_snapshot} x${i.quantity}`)
      .join(", "),
  }));

  return {
    totalRevenueCents: totals.totalRevenueCents,
    paidOrderCount: totals.paidOrderCount,
    avgOrderValueCents:
      totals.paidOrderCount > 0 ? Math.round(totals.totalRevenueCents / totals.paidOrderCount) : 0,
    pendingCount: pending.c,
    failedCount: failed.c,
    conversionRate,
    revenueByDay,
    revenueByMode,
    topItems,
    recentOrders,
  };
}
