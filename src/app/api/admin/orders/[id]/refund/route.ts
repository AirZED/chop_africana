import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { getOrderById, updateOrderStatus } from "@/lib/order-service";
import { recordAudit } from "@/lib/audit-service";

const REFUNDABLE_STATUSES = ["paid", "preparing", "ready", "completed"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!REFUNDABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: `Can't refund an order with status "${order.status}"` }, { status: 400 });
  }

  const session = await getSessionFromRequest(req);
  const changedBy = session?.email ?? "admin";

  try {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
  } catch (err) {
    console.error("Stripe refund failed", err);
    return NextResponse.json({ error: "Refund failed. Check the Stripe dashboard." }, { status: 502 });
  }

  updateOrderStatus(id, "refunded", changedBy, "Refunded via admin panel");
  await recordAudit({ adminEmail: changedBy, action: "order.refund", target: "order", targetId: id });

  return NextResponse.json({ ok: true });
}
