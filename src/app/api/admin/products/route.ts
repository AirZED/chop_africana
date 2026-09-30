import { NextRequest, NextResponse } from "next/server";
import { createMenuItem, listAllMenuItems } from "@/lib/menu-service";
import { validateMenuItemInput } from "@/lib/menu-item-validation";

export async function GET() {
  return NextResponse.json({ items: await listAllMenuItems() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, error } = validateMenuItemInput(body);
  if (error || !input) return NextResponse.json({ error }, { status: 400 });

  const id = await createMenuItem(input);
  return NextResponse.json({ id }, { status: 201 });
}
