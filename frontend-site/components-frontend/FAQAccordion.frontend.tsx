"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";

/**
 * FAQ accordion — uses the homepage frontend.css `.faq-item` /
 * `.faq-question` / `.faq-answer` classes so the standalone /faq page
 * reads identically to the homepage FAQ section.
 */
export default function FAQAccordionFrontend() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div className={`faq-item${isOpen ? " open" : ""}`} key={faq.question}>
            <button
              className="faq-question"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{faq.question}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <div className="faq-answer">
              <div className="faq-answer-content">
                <p>{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}