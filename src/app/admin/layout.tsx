import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  // The proxy already redirects unauthenticated requests to /admin/login before this
  // layout renders; `role` only reaches here on the login page itself (where the
  // session may legitimately be absent) or a valid session.
  return <AdminShell role={session?.role ?? "owner"}>{children}</AdminShell>;
}
