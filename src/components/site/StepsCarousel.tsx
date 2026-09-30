"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

// Add more steps here as their photos come in — the carousel controls only
// appear once there's more than one to page between.
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
  const hasMultipleSteps = STEPS.length > 1;

  return (
    <section className="bg-[#FDF3F1] py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-serif text-3xl font-semibold text-stone-900">Steps</h2>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 items-center gap-8 sm:grid-cols-[auto_1fr]">
          <span className="font-serif text-7xl font-semibold text-stone-900 sm:text-8xl">{step.number}</span>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:text-left">
            <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-lg">
              <Image
                src={step.image}
                alt={step.title}
                fill
                sizes="320px"
                className="rounded-[1.7rem] object-cover"
              />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-stone-600">{step.body}</p>
            </div>
          </div>
        </div>

        {hasMultipleSteps && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              aria-label="Previous step"
              onClick={() => setIndex((i) => (i - 1 + STEPS.length) % STEPS.length)}
              className="tap-press flex size-10 items-center justify-center rounded-full border border-stone-300 text-stone-600"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.number}
                  aria-label={`Go to step ${s.number}`}
                  onClick={() => setIndex(i)}
                  className={`size-1.5 rounded-full ${i === index ? "bg-stone-900" : "bg-stone-300"}`}
                />
              ))}
            </div>
            <button
              aria-label="Next step"
              onClick={() => setIndex((i) => (i + 1) % STEPS.length)}
              className="tap-press flex size-10 items-center justify-center rounded-full border border-stone-300 text-stone-600"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}

        <Link
          href="/shop"
          className="tap-press mt-8 inline-block rounded-full bg-stone-900 px-8 py-3 font-semibold text-white"
        >
          Buy Pie
        </Link>
      </div>
    </section>
  );
}
