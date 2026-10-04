import { NextRequest, NextResponse } from "next/server";
import { deleteDiscountCode, updateDiscountCode } from "@/lib/discount-service";
import { validateDiscountCodeInput } from "@/lib/discount-validation";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, error } = validateDiscountCodeInput(body);
  if (error || !input) return NextResponse.json({ error }, { status: 400 });

  const ok = await updateDiscountCode(code, input);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "discount.update",
    target: "discount_code",
    targetId: code,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ok = await deleteDiscountCode(code);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "discount.delete",
    target: "discount_code",
    targetId: code,
  });

  return NextResponse.json({ ok: true });
}
