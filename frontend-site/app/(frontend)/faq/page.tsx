import Link from "next/link";
import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import SectionHeadingFrontend from "@/components-frontend/SectionHeading.frontend";
import FAQAccordionFrontend from "@/components-frontend/FAQAccordion.frontend";
import TestimonialFormFrontend from "@/components-frontend/TestimonialForm.frontend";

export const metadata = {
  title: "FAQ — ONE STOP FITNESS",
  description:
    "Common questions about ONE STOP FITNESS in Lucknow — membership, timings, personal training and more.",
};

export default function FrontendFaqPage() {
  return (
    <>
      <PageHeroFrontend
        kicker="FAQ"
        title="Got Questions?"
        subtitle="We've answered the most common ones below."
      />

      <section className="section mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl">
          <FAQAccordionFrontend />
        </div>
        <p className="mt-10 text-center text-sm text-white/55">
          Still unsure?{" "}
          <Link
            href="/contact"
            className="nav-link inline-block font-bold uppercase tracking-[0.15em] text-gym-lime"
          >
            Contact us
          </Link>{" "}
          or message us on WhatsApp.
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeadingFrontend
              align="left"
              kicker="Your story"
              title="Leave a Review"
              subtitle="Tell us about your experience — it goes straight to our WhatsApp."
            />
          </div>
          <TestimonialFormFrontend />
        </div>
      </section>
    </>
  );
}
