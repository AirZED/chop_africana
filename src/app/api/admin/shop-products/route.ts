import { NextRequest, NextResponse } from "next/server";
import { bulkSetShopProductsActive, createShopProduct, listAllShopProducts } from "@/lib/shop-service";
import { validateShopProductInput } from "@/lib/shop-item-validation";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

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

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "shop_product.create",
    target: "shop_product",
    targetId: id,
    details: input.name,
  });

  return NextResponse.json({ id }, { status: 201 });
}

/** Bulk activate/deactivate from the list page's checkbox selection. */
export async function PATCH(req: NextRequest) {
  let body: { ids?: string[]; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0 || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "ids (non-empty array) and active (boolean) are required" }, { status: 400 });
  }

  const count = await bulkSetShopProductsActive(body.ids, body.active);

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "shop_product.bulk_set_active",
    target: "shop_product",
    targetId: body.ids.join(","),
    details: `active: ${body.active}, count: ${count}`,
  });

  return NextResponse.json({ count });
}
