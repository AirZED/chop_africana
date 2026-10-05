import { randomUUID } from "node:crypto";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";
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

const PAID_EQUIVALENT_STATUSES: OrderStatus[] = ["paid", "preparing", "ready", "completed"];

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

interface OrderItemDoc {
  id: string;
  kind: "restaurant" | "shop";
  refId: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  selectionsSummary: string;
}

interface OrderStatusHistoryDoc {
  status: OrderStatus;
  note: string;
  changedBy: string;
  createdAt: Date;
}

interface OrderDoc {
  _id: string;
  stripePaymentIntentId: string;
  status: OrderStatus;
  channel: string;
  fulfillment: FulfillmentMode;
  tableNumber: string | null;
  fullName: string;
  phone: string;
  email: string;
  address: string | null;
  subtotalCents: number;
  deliveryCents: number;
  discountCode: string | null;
  discountCents: number;
  totalCents: number;
  fulfilledAt: Date | null;
  items: OrderItemDoc[];
  statusHistory: OrderStatusHistoryDoc[];
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection(): Promise<Collection<OrderDoc>> {
  const db = await getMongoDb();
  return db.collection<OrderDoc>("orders");
}

function docToOrder(doc: OrderDoc): OrderRecord {
  return {
    id: doc._id,
    stripePaymentIntentId: doc.stripePaymentIntentId,
    status: doc.status,
    channel: doc.channel,
    fulfillment: doc.fulfillment,
    table: doc.tableNumber,
    fullName: doc.fullName,
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    subtotal: doc.subtotalCents / 100,
    delivery: doc.deliveryCents / 100,
    discountCode: doc.discountCode,
    discount: doc.discountCents / 100,
    total: doc.totalCents / 100,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function docToItems(doc: OrderDoc): OrderItemRecord[] {
  return doc.items.map((i) => ({
    id: i.id,
    kind: i.kind,
    refId: i.refId,
    name: i.nameSnapshot,
    quantity: i.quantity,
    unitPrice: i.unitPriceCents / 100,
    lineTotal: i.lineTotalCents / 100,
    selectionsSummary: i.selectionsSummary,
  }));
}

function docToHistory(doc: OrderDoc): OrderStatusHistoryEntry[] {
  return doc.statusHistory.map((h) => ({
    status: h.status,
    note: h.note,
    changedBy: h.changedBy,
    createdAt: h.createdAt.toISOString(),
  }));
}

/** Escapes a string for safe use inside a RegExp built from user input. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const collection = await getCollection();
  const orderId = randomUUID();
  const now = new Date();

  const items: OrderItemDoc[] = [];
  for (const line of input.items) {
    const unit = lineUnitPrice(line, input.menu, input.shop);
    if (line.kind === "restaurant") {
      const item = input.menu.find((m) => m.itemId === line.refId);
      if (!item) continue;
      items.push({
        id: randomUUID(),
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
      items.push({
        id: randomUUID(),
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

  await collection.insertOne({
    _id: orderId,
    stripePaymentIntentId: input.stripePaymentIntentId,
    status: "pending",
    channel: channelFor(input.items),
    fulfillment: input.fulfillment,
    tableNumber: input.table ?? null,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    address: input.address ?? null,
    subtotalCents: Math.round(input.subtotal * 100),
    deliveryCents: Math.round(input.delivery * 100),
    discountCode: input.discountCode ?? null,
    discountCents: Math.round(input.discount * 100),
    totalCents: Math.round(input.total * 100),
    fulfilledAt: null,
    items,
    statusHistory: [{ status: "pending", note: "Order created, awaiting payment", changedBy: "system", createdAt: now }],
    createdAt: now,
    updatedAt: now,
  });

  return orderId;
}

export async function getOrderItems(orderId: string): Promise<OrderItemRecord[]> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: orderId });
  return doc ? docToItems(doc) : [];
}

export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: orderId });
  return doc ? docToHistory(doc) : [];
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: id });
  return doc ? docToOrder(doc) : null;
}

export async function getOrderByPaymentIntent(stripePaymentIntentId: string): Promise<OrderRecord | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ stripePaymentIntentId });
  return doc ? docToOrder(doc) : null;
}

/** Customer-facing lookup — requires both the email on file and the order id to avoid leaking other customers' orders. */
export async function findOrderForCustomer(email: string, orderIdOrSuffix: string): Promise<OrderRecord | null> {
  const collection = await getCollection();
  const needle = orderIdOrSuffix.trim();
  const suffixRe = new RegExp(`${escapeRegex(needle)}$`, "i");

  const doc = await collection.findOne(
    {
      email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" },
      $or: [{ _id: needle }, { _id: suffixRe }],
    },
    { sort: { createdAt: -1 } }
  );
  return doc ? docToOrder(doc) : null;
}

export interface OrderListFilters {
  status?: OrderStatus;
  channel?: "restaurant" | "shop" | "mixed";
  search?: string;
  limit?: number;
}

export async function listOrders(filters: OrderListFilters = {}): Promise<OrderRecord[]> {
  const collection = await getCollection();
  const match: Record<string, unknown> = {};

  if (filters.status) match.status = filters.status;
  if (filters.channel) match.channel = filters.channel;
  if (filters.search) {
    const re = new RegExp(escapeRegex(filters.search.trim()), "i");
    match.$or = [{ fullName: re }, { email: re }, { _id: re }];
  }

  const limit = Math.min(filters.limit ?? 100, 500);
  const docs = await collection.find(match).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(docToOrder);
}

/** Payment-status transition, keyed by Stripe payment intent — called from the webhook and the confirm-order fallback. */
export async function markOrderStatus(stripePaymentIntentId: string, status: "paid" | "failed"): Promise<void> {
  const collection = await getCollection();
  const doc = await collection.findOne({ stripePaymentIntentId });
  if (!doc || doc.status === status) return;

  const now = new Date();
  await collection.updateOne(
    { _id: doc._id },
    {
      $set: { status, updatedAt: now },
      $push: {
        statusHistory: {
          status,
          note: status === "paid" ? "Payment confirmed" : "Payment failed",
          changedBy: "system",
          createdAt: now,
        },
      },
    }
  );
}

/**
 * Runs exactly once per order, whichever of the webhook / confirm-order fallback gets
 * there first: decrements shop stock and sends the confirmation email. Guarded by an
 * atomic `fulfilledAt: null` -> set claim so a race between the two paths (or a webhook
 * retry) can't double-decrement stock or double-send the email.
 */
export async function finalizeOrderPayment(stripePaymentIntentId: string): Promise<void> {
  await markOrderStatus(stripePaymentIntentId, "paid");

  const collection = await getCollection();
  const doc = await collection.findOne({ stripePaymentIntentId });
  if (!doc) return;

  const claim = await collection.updateOne({ _id: doc._id, fulfilledAt: null }, { $set: { fulfilledAt: new Date() } });
  if (claim.modifiedCount === 0) return; // another caller already handled this order

  const order = docToOrder(doc);
  const items = docToItems(doc);

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

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy: string,
  note = ""
): Promise<boolean> {
  const collection = await getCollection();
  const now = new Date();
  const result = await collection.updateOne(
    { _id: orderId },
    {
      $set: { status, updatedAt: now },
      $push: { statusHistory: { status, note, changedBy, createdAt: now } },
    }
  );
  if (result.matchedCount === 0) return false;

  const order = await getOrderById(orderId);
  if (order) {
    sendOrderStatusEmail({ order, status }).catch((err) =>
      console.error(`[orders] Failed to send status email for ${orderId}`, err)
    );
  }
  return true;
}

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";

function rangeToCutoff(range: AnalyticsRange): Date | null {
  const days = { today: 1, "7d": 7, "30d": 30, "90d": 90, all: null }[range];
  return days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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

export async function getAnalyticsSummary(range: AnalyticsRange): Promise<AnalyticsSummary> {
  const collection = await getCollection();
  const cutoff = rangeToCutoff(range);
  const dateMatch = cutoff ? { createdAt: { $gte: cutoff } } : {};
  const paidMatch = { status: { $in: PAID_EQUIVALENT_STATUSES }, ...dateMatch };

  const [totalsAgg, pendingCount, failedCount, revenueByDayAgg, revenueByModeAgg, topItemsAgg, recentOrdersDocs] =
    await Promise.all([
      collection
        .aggregate<{ paidOrderCount: number; totalRevenueCents: number }>([
          { $match: paidMatch },
          { $group: { _id: null, paidOrderCount: { $sum: 1 }, totalRevenueCents: { $sum: "$totalCents" } } },
        ])
        .toArray(),
      collection.countDocuments({ status: "pending", ...dateMatch }),
      collection.countDocuments({ status: "failed", ...dateMatch }),
      collection
        .aggregate<{ _id: string; revenueCents: number; orders: number }>([
          { $match: paidMatch },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenueCents: { $sum: "$totalCents" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      collection
        .aggregate<{ _id: string; revenueCents: number; orders: number }>([
          { $match: paidMatch },
          { $group: { _id: "$fulfillment", revenueCents: { $sum: "$totalCents" }, orders: { $sum: 1 } } },
          { $sort: { revenueCents: -1 } },
        ])
        .toArray(),
      collection
        .aggregate<{ _id: string; quantity: number; revenueCents: number }>([
          { $match: paidMatch },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.nameSnapshot",
              quantity: { $sum: "$items.quantity" },
              revenueCents: { $sum: "$items.lineTotalCents" },
            },
          },
          { $sort: { revenueCents: -1 } },
          { $limit: 8 },
        ])
        .toArray(),
      collection.find(dateMatch).sort({ createdAt: -1 }).limit(15).toArray(),
    ]);

  const totals = totalsAgg[0] ?? { paidOrderCount: 0, totalRevenueCents: 0 };

  const totalAttempts = totals.paidOrderCount + pendingCount + failedCount;
  const conversionRate = totalAttempts > 0 ? totals.paidOrderCount / totalAttempts : 0;

  const recentOrders = recentOrdersDocs.map((doc) => ({
    id: doc._id,
    status: doc.status,
    mode: doc.fulfillment,
    total_cents: doc.totalCents,
    created_at: doc.createdAt.toISOString(),
    itemSummary: doc.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(", "),
  }));

  return {
    totalRevenueCents: totals.totalRevenueCents,
    paidOrderCount: totals.paidOrderCount,
    avgOrderValueCents: totals.paidOrderCount > 0 ? Math.round(totals.totalRevenueCents / totals.paidOrderCount) : 0,
    pendingCount,
    failedCount,
    conversionRate,
    revenueByDay: revenueByDayAgg.map((r) => ({ date: r._id, revenueCents: r.revenueCents, orders: r.orders })),
    revenueByMode: revenueByModeAgg.map((r) => ({ mode: r._id, revenueCents: r.revenueCents, orders: r.orders })),
    topItems: topItemsAgg.map((r) => ({ name: r._id, quantity: r.quantity, revenueCents: r.revenueCents })),
    recentOrders,
  };
}
