import { NextRequest, NextResponse } from "next/server";
import { moveShopProduct } from "@/lib/shop-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { direction?: "up" | "down" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "direction must be 'up' or 'down'" }, { status: 400 });
  }

  const ok = await moveShopProduct(id, body.direction);
  return NextResponse.json({ ok });
}
