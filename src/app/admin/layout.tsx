"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { restaurant } from "@/lib/menu-data";

const NAV = [
  { href: "/admin/products", label: "Menu Items" },
  { href: "/admin/shop-products", label: "Shop Products" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <div className="min-h-full bg-stone-100">{children}</div>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-full bg-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="flex items-center gap-2 text-stone-900">
              <Image src="/logo.png" alt={restaurant.name} width={32} height={32} className="rounded-full" />
              <span className="hidden font-serif text-lg font-[900] tracking-[-0.02em] sm:inline">
                {restaurant.name}
              </span>
              <span className="rounded-full bg-[#A61400] px-2 py-0.5 text-xs font-semibold text-white">
                Admin
              </span>
            </Link>
            <nav className="flex gap-1">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      active ? "bg-[#A61400]/10 text-[#A61400]" : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-stone-500 hover:text-stone-700">
              View Storefront ↗
            </Link>
            <button
              onClick={logout}
              className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
