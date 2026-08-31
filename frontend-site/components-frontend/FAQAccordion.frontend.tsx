"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";
import Icon from "./Icons.frontend";

export default function FAQAccordionFrontend() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className={`panel overflow-hidden ${
              isOpen
                ? "!border-gym-lime/45 shadow-[0_0_0_1px_rgba(154,217,1,0.12),0_0_26px_rgba(154,217,1,0.08)]"
                : ""
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={`font-poppins font-semibold transition-colors ${
                  isOpen ? "text-gym-lime" : "text-white"
                }`}
              >
                {faq.question}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 border-gym-lime bg-gym-lime/10 text-gym-lime"
                    : "border-white/15 text-white/60"
                }`}
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className={`faq-grid${isOpen ? " open" : ""}`}>
              <div>
                <p className="px-6 pb-6 text-sm leading-relaxed text-white/60">
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
