"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { restaurant } from "@/lib/menu-data";
import { CartIcon } from "./icons";

export default function SiteHeader() {
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
          <Link href="/" className="tap-press hover:text-white">
            Home
          </Link>
          <Link href="/menu" className="tap-press hover:text-white">
            Restaurant menu
          </Link>
          <span className="flex items-center gap-2 text-white/50">
            Graduation
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Coming soon…</span>
          </span>
        </nav>

        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-white">
          <Image src="/logo.png" alt={restaurant.name} width={36} height={36} className="rounded-full" />
          <span className="hidden sm:inline">{restaurant.name}</span>
        </Link>

        <Link
          href="/cart"
          className="tap-press flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900"
        >
          <CartIcon className="size-4" />
          Cart
          {cartCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto px-6 pb-3 text-sm font-medium text-white/90 md:hidden">
        <Link href="/" className="tap-press whitespace-nowrap hover:text-white">
          Home
        </Link>
        <Link href="/menu" className="tap-press whitespace-nowrap hover:text-white">
          Restaurant menu
        </Link>
        <span className="whitespace-nowrap text-white/50">Graduation · Soon</span>
      </nav>
    </header>
  );
}
