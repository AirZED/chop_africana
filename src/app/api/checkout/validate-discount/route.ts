import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discount-service";

export async function POST(req: NextRequest) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.code?.trim() || typeof body.subtotal !== "number") {
    return NextResponse.json({ error: "A code and subtotal are required" }, { status: 400 });
  }

  const result = await validateDiscountCode(body.code, body.subtotal);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ code: result.code, discount: result.discount });
}
