import { NextRequest, NextResponse } from "next/server";
import { createAdminUser, listAdminUsers } from "@/lib/admin-service";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit-service";

export async function GET() {
  return NextResponse.json({ users: await listAdminUsers() });
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; role?: "owner" | "staff" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.email?.trim() || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: "A valid email and a password of 8+ characters are required" }, { status: 400 });
  }
  if (body.role !== "owner" && body.role !== "staff") {
    return NextResponse.json({ error: "Role must be 'owner' or 'staff'" }, { status: 400 });
  }

  await createAdminUser(body.email, body.password, body.role);

  const session = await getSessionFromRequest(req);
  await recordAudit({
    adminEmail: session?.email ?? "admin",
    action: "admin_user.create",
    target: "admin_user",
    targetId: body.email.trim().toLowerCase(),
    details: `role: ${body.role}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
