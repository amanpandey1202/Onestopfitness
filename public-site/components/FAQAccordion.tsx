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
            className={`overflow-hidden rounded-xl border transition ${
              isOpen ? "border-gym-lime/60 bg-gym-ink" : "border-white/10 bg-gym-ink"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-white">{faq.question}</span>
              <span
                className={`shrink-0 text-2xl leading-none text-gym-lime transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-white/65">
                {faq.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
