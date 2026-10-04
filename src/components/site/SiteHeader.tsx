"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { restaurant } from "@/lib/menu-data";
import { CartIcon } from "./icons";

type NavBg = "dark" | "light";

export default function SiteHeader() {
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  // "dark" = header is over a dark background -> use white items
  // "light" = header is over a light background -> use dark items
  const [bg, setBg] = useState<NavBg>("dark");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      // Sample a line through the middle of the main header bar
      const y = 40;
      const sections = document.querySelectorAll<HTMLElement>("[data-nav-bg]");

      let found: NavBg = "light"; // default for pages with no markers
      sections.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          found = el.dataset.navBg === "dark" ? "dark" : "light";
        }
      });
      setBg(found);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  const onDark = bg === "dark";
  const text = onDark ? "text-white" : "text-stone-900";
  const textMuted = onDark ? "text-white/50" : "text-stone-900/45";

  return (
    <header
      ref={headerRef}
      className="fixed top-0 z-30 w-full bg-transparent backdrop-blur"
    >
      {/* 3-column grid keeps the logo truly centered */}
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-16 py-4">
        <nav
          className={`hidden items-center gap-8 text-sm font-medium transition-colors duration-300 md:flex ${text}`}
        >
          <Link href="/" className="tap-press hover:opacity-70">
            Home
          </Link>
          <Link href="/menu" className="tap-press hover:opacity-70">
            Restaurant menu
          </Link>
          <span className={`flex items-center gap-2 ${textMuted}`}>
            Graduation
            <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] text-white/80">
              Coming soon…
            </span>
          </span>
        </nav>
        {/* keeps the logo centered on mobile where the nav is hidden */}
        <span className="md:hidden" />

        <Link href="/" className="justify-self-center">
          <Image
            src="/whiter_logo.png"
            alt={restaurant.name}
            width={52}
            height={52}
            priority
            className={`h-12 w-auto transition-[filter] duration-300 ${
              onDark ? "" : "brightness-0"
            }`}
          />
        </Link>

        <Link
          href="/cart"
          className="tap-press flex items-center gap-2 justify-self-end rounded-full bg-[#111] px-5 py-2.5 text-sm font-semibold text-white"
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

      <nav
        className={`flex items-center gap-4 overflow-x-auto px-6 pb-3 text-sm font-medium transition-colors duration-300 md:hidden ${text}`}
      >
        <Link href="/" className="tap-press whitespace-nowrap">
          Home
        </Link>
        <Link href="/menu" className="tap-press whitespace-nowrap">
          Restaurant menu
        </Link>
        <span className={`whitespace-nowrap ${textMuted}`}>
          Graduation · Soon
        </span>
      </nav>
    </header>
  );
}
