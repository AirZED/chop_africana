import { NextRequest, NextResponse } from "next/server";
import { createDiscountCode, listDiscountCodes } from "@/lib/discount-service";
import { validateDiscountCodeInput } from "@/lib/discount-validation";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

export async function GET() {
  return NextResponse.json({ codes: await listDiscountCodes() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, error } = validateDiscountCodeInput(body);
  if (error || !input) return NextResponse.json({ error }, { status: 400 });

  const code = await createDiscountCode(input);

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "discount.create",
    target: "discount_code",
    targetId: code,
  });

  return NextResponse.json({ code }, { status: 201 });
}
