import { NextRequest, NextResponse } from "next/server";
import { findOrderForCustomer, getOrderItems, getOrderStatusHistory } from "@/lib/order-service";

export async function POST(req: NextRequest) {
  let body: { email?: string; orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.email?.trim() || !body.orderId?.trim()) {
    return NextResponse.json({ error: "Email and order number are required" }, { status: 400 });
  }

  const order = await findOrderForCustomer(body.email, body.orderId);
  if (!order) {
    return NextResponse.json({ error: "We couldn't find an order matching that email and order number." }, { status: 404 });
  }

  return NextResponse.json({
    order,
    items: await getOrderItems(order.id),
    history: await getOrderStatusHistory(order.id),
  });
}
