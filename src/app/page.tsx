import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import StepsCarousel from "@/components/site/StepsCarousel";
import StoreLocator from "@/components/site/StoreLocator";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section
          data-nav-bg="dark"
          className="bg-[linear-gradient(to_bottom,#B0A2A1_0%,#CBBDBC_35%,#D9CBCC_70%,#DCCFCE_100%)] px-6 pb-10 pt-24 text-center"
        >
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-light leading-[1.1] tracking-[-0.03em] text-white drop-shadow-sm sm:text-6xl">
            5 Ready-to-Bake Pies
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-serif text-xl text-white/90 sm:text-2xl">
            Straight from your freezer to your oven
          </p>
          <p className="mx-auto mt-5 max-w-lg text-stone-50/90">
            Authentic Nigerian Pies, NO Preservatives or Additives. Order
            online or pick them up at a supermarket near you.
          </p>
          <Link
            href="/shop"
            className="tap-press mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3 font-semibold text-white shadow-lg"
          >
            Shop Now
            <span aria-hidden>↗</span>
          </Link>

          <div className="relative mx-auto mt-10 h-[320px] w-full max-w-md sm:h-[420px] sm:max-w-xl">
            <Image
              src="/food/homeimg.png"
              alt="Beef pie"
              fill
              priority
              sizes="(min-width: 640px) 576px, 100vw"
              className="object-contain"
            />
          </div>
        </section>

        {/* Beef Pies */}
        <section data-nav-bg="dark" className="bg-[#A61400] px-6 py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-5xl font-light tracking-[-0.03em] text-white">
                Beef Pies
              </h2>
              <p className="mt-4 max-w-sm text-white/80">
                Beef and chicken pies, ready to go from freezer to oven. Order
                online or pick them up at a supermarket near you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/shop/shop-beef-pie"
                  className="tap-press rounded-full bg-white px-6 py-3 font-semibold text-stone-900"
                >
                  View details
                </Link>
                <Link
                  href="/#find-in-store"
                  className="tap-press rounded-full border border-white/70 px-6 py-3 font-semibold text-white"
                >
                  Get in stores
                </Link>
              </div>
            </div>
            <div className="relative aspect-square">
              <Image
                src="/food/beef_pie.png"
                alt="Beef pie in a clamshell container"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* Chicken Pies */}
        <section data-nav-bg="light" className="bg-white px-6 py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div className="relative order-2 aspect-square md:order-1">
              <Image
                src="/food/chicken_pie.png"
                alt="Chicken pie, golden crust"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-contain"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="font-serif text-5xl font-light tracking-[-0.03em] text-stone-900 md:text-[4.8rem]">
                Chicken Pies
              </h2>
              <p className="mt-4 max-w-sm text-stone-600 text-[1.1rem]">
                Beef and chicken pies, ready to go from freezer to oven. Order
                online or pick them up at a supermarket near you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/shop/shop-chicken-pie"
                  className="tap-press rounded-full bg-stone-900 px-6 py-3 font-semibold text-white"
                >
                  View details
                </Link>
                <Link
                  href="/#find-in-store"
                  className="tap-press rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-700"
                >
                  Get in stores
                </Link>
              </div>
            </div>
          </div>
        </section>

        <StepsCarousel />

        {/* Kitchen / Graduation CTA cards */}
        <section
          id="graduation"
          data-nav-bg="light"
          className="scroll-mt-20 bg-stone-50 px-6 py-16"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="/food/hungry_now.png"
                alt="Café table with pie and a drink"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-8">
                <h3 className="font-serif text-2xl font-semibold text-white sm:text-[3.75rem]">
                  Hungry Now? Order From Our Kitchen.
                </h3>
                <p className="mt-2 text-sm text-white/85">
                  Browse the menu and order for pickup or delivery.
                </p>
                <Link
                  href="/menu"
                  className="tap-press pointer-events-auto mt-4 inline-block w-fit rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-stone-900"
                >
                  Explore Menu
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="/food/grad_pack.jpg"
                alt="Graduation caps thrown in the air"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8">
                <h3 className="font-serif text-2xl font-semibold text-white sm:text-[3.75rem]">
                  Graduation Packages Are Open
                </h3>
                <p className="mt-2 text-sm text-white/85">
                  Book ahead for a table, pickup or delivery.
                </p>
                <span className="pointer-events-auto mt-4 inline-block w-fit cursor-not-allowed rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white/70">
                  Coming soon…
                </span>
              </div>
            </div>
          </div>
        </section>

        <StoreLocator />
      </main>

      <SiteFooter />
    </div>
  );
}
