import { NextRequest, NextResponse } from "next/server";
import { deleteAdminUser, setAdminUserRole } from "@/lib/admin-service";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  let body: { role?: "owner" | "staff" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.role !== "owner" && body.role !== "staff") {
    return NextResponse.json({ error: "Role must be 'owner' or 'staff'" }, { status: 400 });
  }

  const session = await getSessionFromRequest(req);
  if (session?.email.toLowerCase() === decodeURIComponent(email).toLowerCase() && body.role !== "owner") {
    return NextResponse.json({ error: "You can't demote your own account." }, { status: 400 });
  }

  const ok = await setAdminUserRole(decodeURIComponent(email), body.role);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "admin_user.set_role",
    target: "admin_user",
    targetId: decodeURIComponent(email),
    details: `role: ${body.role}`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const session = await getSessionFromRequest(req);
  if (session?.email.toLowerCase() === decodeURIComponent(email).toLowerCase()) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const ok = await deleteAdminUser(decodeURIComponent(email));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "admin_user.delete",
    target: "admin_user",
    targetId: decodeURIComponent(email),
  });

  return NextResponse.json({ ok: true });
}
