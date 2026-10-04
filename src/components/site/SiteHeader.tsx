"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { restaurant } from "@/lib/menu-data";
import { CartIcon, CloseIcon, MenuIcon } from "./icons";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      {/* Mobile: logo far left, cart+menu far right (justify-between).
          Desktop (md+): 3-column grid keeps the logo truly centered. */}
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-16 md:grid md:grid-cols-[1fr_auto_1fr]">
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

        <Link href="/" className="md:justify-self-center">
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

        <div className="flex items-center gap-3 md:justify-self-end">
          <Link
            href="/cart"
            className="tap-press flex items-center gap-2 rounded-full bg-[#111] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <CartIcon className="size-4" />
            Cart
            {cartCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`tap-press flex size-11 items-center justify-center rounded-full transition-colors duration-300 md:hidden ${text}`}
          >
            {menuOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mx-4 mb-4 flex flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl md:hidden">
          <Link
            href="/"
            className="tap-press rounded-xl px-4 py-3 text-base font-medium text-stone-900 hover:bg-stone-100"
          >
            Home
          </Link>
          <Link
            href="/menu"
            className="tap-press rounded-xl px-4 py-3 text-base font-medium text-stone-900 hover:bg-stone-100"
          >
            Restaurant menu
          </Link>
          <span className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-stone-400">
            Graduation
            <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] text-white/80">
              Coming soon…
            </span>
          </span>
        </nav>
      )}
    </header>
  );
}
