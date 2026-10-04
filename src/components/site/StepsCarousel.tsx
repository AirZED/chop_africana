"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const STEPS = [
  {
    number: "01",
    title: "Get Your Pies",
    body: "Order online, or pick up from a supermarket.",
    image: "/food/get_your_pies.png",
  },
];

export default function StepsCarousel() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  const prev = () => setIndex((i) => (i - 1 + STEPS.length) % STEPS.length);
  const next = () => setIndex((i) => (i + 1) % STEPS.length);

  return (
    <section data-nav-bg="light" className="bg-[#FDF3F1] py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6 text-center md:px-8">
        <h2 className="font-serif text-2xl font-semibold text-[#1A1614] md:text-3xl">
          Steps
        </h2>

        {/* number | image + controls | text */}
        <div className="mt-8 grid grid-cols-1 items-center gap-8 md:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-10">
          <span
            aria-hidden
            className="font-serif text-[7rem] font-semibold leading-none text-[#1A1614] md:justify-self-start md:text-[9rem] lg:text-[12rem]"
          >
            {step.number}
          </span>

          <div className="flex flex-col items-center gap-6 md:order-none">
            <div className="relative aspect-[7/10] w-[240px] overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-lg md:w-[280px] lg:w-[300px]">
              <Image
                key={step.image}
                src={step.image}
                alt={step.title}
                fill
                priority
                sizes="(min-width: 1024px) 300px, 280px"
                className="rounded-[2.2rem] object-cover"
              />
            </div>

            <div className="flex items-center justify-center gap-14">
              <button
                aria-label="Previous step"
                onClick={prev}
                className="tap-press flex size-10 items-center justify-center rounded-full border border-stone-300 text-stone-600"
              >
                <ChevronLeftIcon />
              </button>
              <button
                aria-label="Next step"
                onClick={next}
                className="tap-press flex size-10 items-center justify-center rounded-full border border-stone-300 text-stone-600"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="text-center md:justify-self-start md:text-left">
            <h3 className="font-serif text-3xl font-semibold text-[#1A1614] lg:text-4xl">
              {step.title}
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-base text-[#1A1614] md:mx-0 lg:text-lg">
              {step.body}
            </p>
          </div>
        </div>

        <Link
          href="/shop"
          className="tap-press mt-10 inline-block rounded-full bg-[#1A1614] px-7 py-3 text-sm font-semibold text-white"
        >
          Buy Pie
        </Link>
      </div>
    </section>
  );
}
