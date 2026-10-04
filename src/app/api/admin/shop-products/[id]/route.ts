import { NextRequest, NextResponse } from "next/server";
import { deleteShopProduct, getAnyShopProductById, updateShopProduct } from "@/lib/shop-service";
import { validateShopProductInput } from "@/lib/shop-item-validation";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getAnyShopProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, error } = validateShopProductInput(body);
  if (error || !input) return NextResponse.json({ error }, { status: 400 });

  const ok = await updateShopProduct(id, input);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "shop_product.update",
    target: "shop_product",
    targetId: id,
    details: input.name,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteShopProduct(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "shop_product.delete",
    target: "shop_product",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
