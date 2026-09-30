"use client";

import { useState } from "react";

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({ title, defaultOpen = true, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-stone-200 py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h3 className="font-serif text-xl font-semibold text-stone-900">{title}</h3>
        <span className="text-xl text-stone-500" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="mt-3 capitalize text-stone-600">{children}</div>}
    </div>
  );
}
