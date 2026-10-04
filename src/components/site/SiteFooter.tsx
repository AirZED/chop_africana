import Image from "next/image";
import Link from "next/link";
import { restaurant } from "@/lib/menu-data";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

const SHOP_LINKS = [
  { label: "Beef pie", href: "/shop/shop-beef-pie" },
  { label: "Chicken pie", href: "/shop/shop-chicken-pie" },
  { label: "Find in store", href: "/#find-in-store" },
  { label: "Stock our pies", href: "mailto:hello@chopafricana.com" },
];

const RESTAURANT_LINKS = [
  { label: "Menu", href: "/menu" },
  { label: "Graduation packages", href: "/#graduation" },
  { label: "Find us", href: "/#find-in-store" },
  { label: "Track order", href: "/track-order" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon },
  { label: "WhatsApp", href: "https://wa.me/", Icon: WhatsAppIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
];

function BrandWordmark({ name }: { name: string }) {
  const [firstWord, ...rest] = name.split(" ");
  return (
    <>
      {firstWord}
      <br />
      {rest.join(" ")}
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white">
      {children}
    </span>
  );
}

export default function SiteFooter() {
  return (
    <footer className="bg-[#A61400]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-xl bg-[#F4DAD5] p-8 sm:p-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <h2 className="font-serif text-4xl font-[900] leading-[1.05] tracking-[-0.03em] text-[#1A1614] sm:text-5xl">
              <BrandWordmark name={restaurant.name} />
            </h2>

            <div className="flex gap-12 sm:gap-20">
              <div>
                <h3 className="font-semibold text-stone-900">Shop</h3>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {SHOP_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-stone-700 hover:text-stone-900"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900">Restaurant</h3>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {RESTAURANT_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-stone-700 hover:text-stone-900"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-start justify-between gap-8">
            <div className="flex flex-wrap gap-8">
              <div>
                <Badge>Visit us @</Badge>
                <p className="mt-1.5 text-sm text-stone-700">
                  24 High Street, Whitechapel, London E1 6AB
                </p>
              </div>
              <div>
                <Badge>Time:</Badge>
                <p className="mt-1.5 text-sm text-stone-700">
                  Mon–Fri 11am–10pm
                  <br />
                  Sat–Sun 12pm–11pm
                </p>
              </div>
            </div>
            <div>
              <Badge>Contact</Badge>
              <p className="mt-1.5 text-sm text-stone-700">
                Email: hello@chopafricana.com
                <br />
                Phone No: 020 7946 0000
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image
              src="/whiter_logo.png"
              alt={restaurant.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <span className="text-xl text-white/70">
              © {new Date().getFullYear()} {restaurant.name}. All rights
              reserved.
            </span>
          </div>
          <div className="flex gap-9">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="tap-press flex size-10 items-center justify-center rounded-full bg-[#6B0D00] text-white hover:bg-white/20"
              >
                <Icon className="size-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
