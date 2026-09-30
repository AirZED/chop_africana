import { NextResponse } from "next/server";
import { listActiveShopProducts } from "@/lib/shop-service";

export async function GET() {
  return NextResponse.json({ products: await listActiveShopProducts() });
}
