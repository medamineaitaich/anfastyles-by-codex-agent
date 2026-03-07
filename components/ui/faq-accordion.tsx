"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FaqAccordion({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const active = open === index;
        return (
          <article key={item.question} className="card-surface overflow-hidden rounded-[1.7rem]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(active ? null : index)}
            >
              <span className="text-sm font-semibold text-ink sm:text-base">{item.question}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-muted", active && "rotate-180 text-forest")}
              />
            </button>
            {active ? (
              <div className="border-t border-border px-5 py-4 text-sm leading-7 text-muted">
                {item.answer}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
