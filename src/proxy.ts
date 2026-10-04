import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

// Staff accounts only handle order fulfillment — everything else under /admin
// (catalog, discounts, users, audit log, analytics) is owner-only.
const STAFF_ALLOWED_PREFIXES = ["/admin/orders", "/api/admin/orders"];

function staffAllowed(pathname: string): boolean {
  return STAFF_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  let session: Awaited<ReturnType<typeof verifySessionToken>> = null;
  try {
    session = await verifySessionToken(token);
  } catch {
    return NextResponse.json(
      { error: "Admin auth isn't configured. Set ADMIN_SESSION_SECRET in .env.local." },
      { status: 500 }
    );
  }

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL(session.role === "staff" ? "/admin/orders" : "/admin/products", req.url));
  }

  if (session.role === "staff" && !staffAllowed(pathname)) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin/orders", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
