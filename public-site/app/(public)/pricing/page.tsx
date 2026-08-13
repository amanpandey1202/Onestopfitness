import SectionHeading from "@/components/SectionHeading";
import PricingCard from "@/components/PricingCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getActivePlans } from "@/lib/services/public";

export const metadata = {
  title: "Pricing — ONE STOP FITNESS",
  description:
    "Transparent monthly gym pricing in Lucknow: Cardio ₹1500, Weight Training ₹1000, Martial Arts ₹1200, Personal Training ₹2000, Combo ₹2200.",
};

// Cache the page and revalidate every 15s so admin edits still show quickly.
export const revalidate = 15;

export default async function PricingPage() {
  const plans = await getActivePlans();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          kicker="Pricing"
          title="Simple, Honest Rates"
          subtitle="No hidden charges. Pick a plan, tap the WhatsApp button and we'll finalise your joining in minutes."
        />

        {plans.length === 0 ? (
          <p className="py-16 text-center text-white/50">
            Plans are being finalised — message us on WhatsApp for current rates.
          </p>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                featured={i === 1}
                tag={i === 1 ? "Most Popular" : undefined}
              />
            ))}
          </div>
        )}

        {/* NOTE */}
        <div className="mt-12 rounded-2xl border border-gym-lime/40 bg-gym-lime/10 p-6 text-center">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-gym-lime">
            Want a custom plan?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">
            Monthly, quarterly or yearly? Group classes with your plan? Message
            us and we&apos;ll build the best combination for you.
          </p>
          <div className="mt-5 flex justify-center">
            <WhatsAppButton label="Ask About Custom Plans" />
          </div>
        </div>
      </section>
    </>
  );
}
