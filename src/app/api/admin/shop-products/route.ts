import { NextRequest, NextResponse } from "next/server";
import { createShopProduct, listAllShopProducts } from "@/lib/shop-service";
import { validateShopProductInput } from "@/lib/shop-item-validation";

export async function GET() {
  return NextResponse.json({ products: await listAllShopProducts() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, error } = validateShopProductInput(body);
  if (error || !input) return NextResponse.json({ error }, { status: 400 });

  const id = await createShopProduct(input);
  return NextResponse.json({ id }, { status: 201 });
}
