"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className={`overflow-hidden rounded-xl border transition-colors duration-300 ${
              isOpen
                ? "border-gym-lime/60 bg-gym-ink"
                : "border-white/10 bg-gym-ink hover:border-white/20"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left active:bg-white/5"
              aria-expanded={isOpen}
            >
              <span
                className={`font-semibold transition-colors duration-300 ${
                  isOpen ? "text-gym-lime" : "text-white"
                }`}
              >
                {faq.question}
              </span>
              <span
                aria-hidden="true"
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 border-gym-lime bg-gym-lime text-gym-black shadow-[0_0_12px_rgba(154,217,1,0.5)]"
                    : "border-white/20 text-gym-lime"
                }`}
              >
                +
              </span>
            </button>
            <div className={`faq-grid ${isOpen ? "faq-grid-open" : ""}`}>
              <div>
                <p className="px-5 pb-5 text-sm leading-relaxed text-white/65">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}