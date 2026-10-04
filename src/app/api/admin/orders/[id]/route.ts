import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/admin-auth";
import {
  getOrderById,
  getOrderItems,
  getOrderStatusHistory,
  updateOrderStatus,
  ORDER_STATUS_TRANSITIONS,
  OrderStatus,
} from "@/lib/order-service";
import { recordAudit } from "@/lib/audit-service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    order,
    items: getOrderItems(id),
    history: getOrderStatusHistory(id),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { status?: OrderStatus; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json(
      { error: `Can't move from "${order.status}" to "${body.status}". Allowed: ${allowed.join(", ") || "none"}` },
      { status: 400 }
    );
  }

  const session = await getSessionFromRequest(req);
  const changedBy = session?.email ?? "admin";
  updateOrderStatus(id, body.status, changedBy, body.note ?? "");

  await recordAudit({
    adminEmail: changedBy,
    action: "order.status_update",
    target: "order",
    targetId: id,
    details: `${order.status} -> ${body.status}`,
  });

  return NextResponse.json({ ok: true });
}
