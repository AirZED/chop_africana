import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/admin-auth";
import { verifyAdminCredentials } from "@/lib/admin-service";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = await verifyAdminCredentials(body.email, body.password);
  } catch (err) {
    console.error("Admin login failed", err);
    return NextResponse.json(
      { error: "Admin login isn't configured. Set ADMIN_SESSION_SECRET and MONGO_DB in .env.local." },
      { status: 500 }
    );
  }

  if (!ok) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
