import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import PricingCardFrontend from "@/components-frontend/PricingCard.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import { getActivePlans } from "@/lib/services/public";

export const metadata = {
  title: "Pricing — ONE STOP FITNESS",
  description:
    "Transparent monthly gym pricing in Lucknow: Cardio ₹1500, Weight Training ₹1000, Martial Arts ₹1200, Personal Training ₹2000, Combo ₹2200.",
};

export const dynamic = "force-dynamic";

export default async function FrontendPricingPage() {
  const plans = await getActivePlans();

  return (
    <>
      <PageHeroFrontend
        kicker="Pricing"
        title="Simple, Honest Rates"
        subtitle="No hidden charges. Pick a plan, tap the WhatsApp button and we'll finalise your joining in minutes."
      />

      <section className="section mx-auto max-w-7xl">
        {plans.length === 0 ? (
          <p className="py-16 text-center text-white/50">
            Plans are being finalised — message us on WhatsApp for current rates.
          </p>
        ) : (
          <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <PricingCardFrontend
                key={plan.id}
                plan={plan}
                featured={i === 1}
                tag={i === 1 ? "Most Popular" : undefined}
              />
            ))}
          </div>
        )}

        {/* NOTE */}
        <div className="panel mt-14 overflow-hidden p-8 text-center sm:p-10">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-gym-lime/12 blur-3xl" />
          <h3 className="font-anton relative text-3xl uppercase leading-none text-gym-lime">
            Want a custom plan?
          </h3>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/65">
            Monthly, quarterly or yearly? Group classes with your plan? Message
            us and we&apos;ll build the best combination for you.
          </p>
          <div className="relative mt-7 flex justify-center">
            <WhatsAppButtonFrontend label="Ask About Custom Plans" />
          </div>
        </div>
      </section>
    </>
  );
}
