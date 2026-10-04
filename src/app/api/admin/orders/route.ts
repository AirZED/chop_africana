import { NextRequest, NextResponse } from "next/server";
import { listOrders, OrderStatus } from "@/lib/order-service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as OrderStatus | null;
  const channel = searchParams.get("channel") as "restaurant" | "shop" | "mixed" | null;
  const search = searchParams.get("search");

  const orders = listOrders({
    status: status ?? undefined,
    channel: channel ?? undefined,
    search: search ?? undefined,
  });

  return NextResponse.json({ orders });
}
