import Link from "next/link";
import PageHeaderFrontend from "@/components-frontend/PageHeader.frontend";
import FAQAccordionFrontend from "@/components-frontend/FAQAccordion.frontend";
import TestimonialFormFrontend from "@/components-frontend/TestimonialForm.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Reveal from "@/components/Reveal";

import { site } from "@/data/site";
export const metadata = {
  title: `FAQ — ${site.name}`,
  description: site.seo.description,
};

export default function FrontendFaqPage() {
  return (
    <>
      <PageHeaderFrontend
        kicker="FAQ"
        title="Got"
        highlight="questions?"
        subtitle="We've answered the most common ones below."
      />

      {/* FAQ accordion */}
      <section className="section-pad">
        <div className="container-wide">
          <div className="faq-layout">
            <div>
              <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                Good questions
              </div>
              <h2 className="section-title" style={{ marginTop: 18 }}>
                Before<br />
                <span style={{ color: "var(--lime)" }}>you begin.</span>
              </h2>
              <p className="section-copy" style={{ marginTop: 25 }}>
                Everything you need to know before your first visit — or your next session.
              </p>
              <p style={{ marginTop: 28, fontSize: 14, lineHeight: 1.65, color: "#8f9898" }}>
                Still unsure?{" "}
                <Link href="/contact" style={{ color: "var(--paper)", font: "700 10px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase", textDecoration: "none" }}>
                  Contact us
                </Link>{" "}
                or message us on WhatsApp.
              </p>
              <div style={{ marginTop: 28 }}>
                <WhatsAppButtonFrontend label="Ask on WhatsApp" />
              </div>
            </div>
            <div>
              <FAQAccordionFrontend />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="section-alt section-pad">
        <div className="container-wide">
          <div className="split-panel">
            <Reveal variant="left">
              <div>
                <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  Your story
                </div>
                <h2 className="section-title" style={{ marginTop: 18 }}>
                  Leave a<br />
                  <span style={{ color: "var(--lime)" }}>review.</span>
                </h2>
                <p className="section-copy" style={{ marginTop: 22 }}>
                  Tell us about your experience — it goes straight to our WhatsApp.
                </p>
              </div>
            </Reveal>
            <Reveal variant="right" delay={120}>
              <TestimonialFormFrontend />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
