import { NextResponse } from "next/server";
import { listActiveMenuItems } from "@/lib/menu-service";

export async function GET() {
  const items = await listActiveMenuItems();
  return NextResponse.json({ items });
}
