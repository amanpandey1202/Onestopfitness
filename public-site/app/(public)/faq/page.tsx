import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import FAQAccordion from "@/components/FAQAccordion";
import TestimonialForm from "@/components/TestimonialForm";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "FAQ — ONE STOP FITNESS",
  description:
    "Common questions about ONE STOP FITNESS in Lucknow — membership, timings, personal training and more.",
};

export default function FAQPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          kicker="FAQ"
          title="Got Questions?"
          subtitle="We've answered the most common ones below."
        />
        <div className="mx-auto mt-12 max-w-3xl">
          <Reveal>
            <FAQAccordion />
          </Reveal>
        </div>
        <Reveal delay={120}>
          <p className="mt-8 text-center text-sm text-white/55">
            Still unsure?{" "}
            <Link href="/contact" className="font-bold text-gym-lime underline-offset-4 hover:underline">
              Contact us
            </Link>{" "}
            or message us on WhatsApp.
          </p>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-white/10 bg-gym-ink">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionHeading
                align="left"
                kicker="Your story"
                title="Leave a Review"
                subtitle="Tell us about your experience — it goes straight to our WhatsApp."
              />
            </div>
          </Reveal>
          <Reveal delay={120} className="h-full">
            <TestimonialForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
