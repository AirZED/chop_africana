import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { CartLine, FulfillmentMode, MenuItem, ShopProduct } from "./types";
import { lineUnitPrice } from "./cart-pricing";
import { decrementStock } from "./shop-service";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "./email";

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

/** Kitchen-stage statuses an admin can manually move an order into from its current status. */
export const ORDER_STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
};

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
  discountCode?: string | null;
  discount: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  stripePaymentIntentId: string;
  status: OrderStatus;
  channel: string;
  fulfillment: FulfillmentMode;
  table: string | null;
  fullName: string;
  phone: string;
  email: string;
  address: string | null;
  subtotal: number;
  delivery: number;
  discountCode: string | null;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRecord {
  id: string;
  kind: "restaurant" | "shop";
  refId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectionsSummary: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  note: string;
  changedBy: string;
  createdAt: string;
}

interface OrderRow {
  id: string;
  stripe_payment_intent_id: string;
  status: string;
  channel: string;
  fulfillment: string;
  table_number: string | null;
  full_name: string;
  phone: string;
  email: string;
  address: string | null;
  subtotal_cents: number;
  delivery_cents: number;
  discount_code: string | null;
  discount_cents: number;
  total_cents: number;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status as OrderStatus,
    channel: row.channel,
    fulfillment: row.fulfillment as FulfillmentMode,
    table: row.table_number,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    subtotal: row.subtotal_cents / 100,
    delivery: row.delivery_cents / 100,
    discountCode: row.discount_code,
    discount: row.discount_cents / 100,
    total: row.total_cents / 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function insertStatusHistory(orderId: string, status: OrderStatus, note: string, changedBy: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO order_status_history (id, order_id, status, note, changed_by) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), orderId, status, note, changedBy);
}

export function createOrder(input: CreateOrderInput): string {
  const db = getDb();
  const orderId = randomUUID();

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, stripe_payment_intent_id, status, channel, fulfillment, table_number,
      full_name, phone, email, address, subtotal_cents, delivery_cents,
      discount_code, discount_cents, total_cents
    ) VALUES (
      @id, @stripePaymentIntentId, 'pending', @channel, @fulfillment, @table,
      @fullName, @phone, @email, @address, @subtotalCents, @deliveryCents,
      @discountCode, @discountCents, @totalCents
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
      discountCode: input.discountCode ?? null,
      discountCents: Math.round(input.discount * 100),
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

    insertStatusHistory(orderId, "pending", "Order created, awaiting payment", "system");
  });
  run();

  return orderId;
}

export function getOrderItems(orderId: string): OrderItemRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, kind, ref_id, name_snapshot, quantity, unit_price_cents, line_total_cents, selections_summary
       FROM order_items WHERE order_id = ?`
    )
    .all(orderId) as {
    id: string;
    kind: string;
    ref_id: string;
    name_snapshot: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    selections_summary: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as "restaurant" | "shop",
    refId: r.ref_id,
    name: r.name_snapshot,
    quantity: r.quantity,
    unitPrice: r.unit_price_cents / 100,
    lineTotal: r.line_total_cents / 100,
    selectionsSummary: r.selections_summary,
  }));
}

export function getOrderStatusHistory(orderId: string): OrderStatusHistoryEntry[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT status, note, changed_by, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`)
    .all(orderId) as { status: string; note: string; changed_by: string; created_at: string }[];
  return rows.map((r) => ({
    status: r.status as OrderStatus,
    note: r.note,
    changedBy: r.changed_by,
    createdAt: r.created_at,
  }));
}

export function getOrderById(id: string): OrderRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  return row ? rowToOrder(row) : null;
}

export function getOrderByPaymentIntent(stripePaymentIntentId: string): OrderRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE stripe_payment_intent_id = ?")
    .get(stripePaymentIntentId) as OrderRow | undefined;
  return row ? rowToOrder(row) : null;
}

/** Customer-facing lookup — requires both the email on file and the order id to avoid leaking other customers' orders. */
export function findOrderForCustomer(email: string, orderIdOrSuffix: string): OrderRecord | null {
  const db = getDb();
  const needle = orderIdOrSuffix.trim().toLowerCase();
  const row = db
    .prepare(
      `SELECT * FROM orders WHERE lower(email) = lower(?) AND (id = ? OR lower(substr(id, -6)) = ?) ORDER BY created_at DESC LIMIT 1`
    )
    .get(email.trim(), needle, needle) as OrderRow | undefined;
  return row ? rowToOrder(row) : null;
}

export interface OrderListFilters {
  status?: OrderStatus;
  channel?: "restaurant" | "shop" | "mixed";
  search?: string;
  limit?: number;
}

export function listOrders(filters: OrderListFilters = {}): OrderRecord[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  if (filters.channel) {
    clauses.push("channel = @channel");
    params.channel = filters.channel;
  }
  if (filters.search) {
    clauses.push("(lower(full_name) LIKE @search OR lower(email) LIKE @search OR lower(id) LIKE @search)");
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = filters.limit ?? 100;

  const rows = db
    .prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ${Math.min(limit, 500)}`)
    .all(params) as OrderRow[];
  return rows.map(rowToOrder);
}

/** Payment-status transition, keyed by Stripe payment intent — called from the webhook and the confirm-order fallback. */
export function markOrderStatus(stripePaymentIntentId: string, status: "paid" | "failed") {
  const db = getDb();
  const order = getOrderByPaymentIntent(stripePaymentIntentId);
  if (!order || order.status === status) return;

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE stripe_payment_intent_id = ?").run(
    status,
    stripePaymentIntentId
  );
  insertStatusHistory(order.id, status, status === "paid" ? "Payment confirmed" : "Payment failed", "system");
}

/**
 * Runs exactly once per order, whichever of the webhook / confirm-order fallback gets
 * there first: decrements shop stock and sends the confirmation email. Guarded by
 * `fulfilled_at` so a race between the two paths (or a webhook retry) can't double-decrement
 * stock or double-send the email.
 */
export async function finalizeOrderPayment(stripePaymentIntentId: string): Promise<void> {
  markOrderStatus(stripePaymentIntentId, "paid");

  const db = getDb();
  const order = getOrderByPaymentIntent(stripePaymentIntentId);
  if (!order) return;

  const claimed = db
    .prepare("UPDATE orders SET fulfilled_at = datetime('now') WHERE id = ? AND fulfilled_at IS NULL")
    .run(order.id);
  if (claimed.changes === 0) return; // another caller already handled this order

  const items = getOrderItems(order.id);
  for (const item of items) {
    if (item.kind === "shop") {
      await decrementStock(item.refId, item.quantity).catch((err) =>
        console.error(`[orders] Failed to decrement stock for ${item.refId}`, err)
      );
    }
  }

  await sendOrderConfirmationEmail({ order, items }).catch((err) =>
    console.error(`[orders] Failed to send confirmation email for ${order.id}`, err)
  );
}

export function updateOrderStatus(orderId: string, status: OrderStatus, changedBy: string, note = ""): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, orderId);
  if (result.changes === 0) return false;
  insertStatusHistory(orderId, status, note, changedBy);

  const order = getOrderById(orderId);
  if (order) {
    sendOrderStatusEmail({ order, status }).catch((err) =>
      console.error(`[orders] Failed to send status email for ${orderId}`, err)
    );
  }
  return true;
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
       FROM orders WHERE status IN ('paid','preparing','ready','completed') ${cutoffClause}`
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
       FROM orders WHERE status IN ('paid','preparing','ready','completed') ${cutoffClause}
       GROUP BY date(created_at) ORDER BY date ASC`
    )
    .all() as { date: string; revenueCents: number; orders: number }[];

  const revenueByMode = db
    .prepare(
      `SELECT fulfillment as mode, COALESCE(SUM(total_cents),0) as revenueCents, COUNT(*) as orders
       FROM orders WHERE status IN ('paid','preparing','ready','completed') ${cutoffClause}
       GROUP BY fulfillment ORDER BY revenueCents DESC`
    )
    .all() as { mode: string; revenueCents: number; orders: number }[];

  const topItems = db
    .prepare(
      `SELECT oi.name_snapshot as name, SUM(oi.quantity) as quantity, SUM(oi.line_total_cents) as revenueCents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status IN ('paid','preparing','ready','completed') ${cutoffClause.replace(/created_at/g, "o.created_at")}
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
