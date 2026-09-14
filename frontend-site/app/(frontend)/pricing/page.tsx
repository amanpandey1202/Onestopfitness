import PageHeaderFrontend from "@/components-frontend/PageHeader.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Icon from "@/components-frontend/Icons.frontend";
import Reveal from "@/components/Reveal";
import PayNowButton from "@/components/PayNowButton";
import { whatsappLink, site } from "@/data/site";
import { planPeriodLabel } from "@/lib/format";
import { getActivePlans } from "@/lib/services/public";

export const metadata = {
  title: `Pricing — ${site.name}`,
  description: site.seo.description,
};

export const dynamic = "force-dynamic";

export default async function FrontendPricingPage() {
  const plans = await getActivePlans();

  return (
    <>
      <PageHeaderFrontend
        kicker="Pricing"
        title="Simple, Honest"
        highlight="Rates."
        subtitle="No hidden charges. Pick a plan, tap the WhatsApp button and we'll finalise your joining in minutes."
      />

      <section className="pricing-section section-pad">
        <div className="container-wide">
          <div className="pricing-head">
            <div>
              <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                Membership plans
              </div>
              <h2 className="section-title" style={{ marginTop: 18 }}>
                Choose your<br />
                <span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>plan.</span>
              </h2>
            </div>
            <p className="section-copy">
              Every plan includes full gym-floor access, all group classes and the {site.name} member app. Pay
              online or finish your joining on WhatsApp — no hidden charges.
            </p>
          </div>

          {plans.length === 0 ? (
            <p className="py-16 text-center" style={{ color: "var(--ink)" }}>
              Plans are being finalised — message us on WhatsApp for current rates.
            </p>
          ) : (
            <div className="plans-grid">
              {plans.map((plan, i) => {
                const featured = i === 1;
                const message = site.messages.planInquiry(
                  plan.name,
                  plan.price,
                  planPeriodLabel(plan.durationDays)
                );
                return (
                  <Reveal key={plan.id} delay={i * 90} className="h-full">
                    <article className={`plan-card ${featured ? "featured" : ""}`}>
                      {featured && <div className="plan-tag">Most Popular</div>}
                      <h3>{plan.name}</h3>
                      {plan.description && <p>{plan.description}</p>}
                      <div className="plan-price">
                        ₹{plan.price.toLocaleString("en-IN")}
                        <small>/ {planPeriodLabel(plan.durationDays)}</small>
                      </div>
                      <ul>
                        {plan.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      <PayNowButton
                        plan={{ id: plan.id, name: plan.name, price: plan.price }}
                        variant="light"
                      />
                      <div style={{ marginTop: 12 }}>
                        <a
                          href={whatsappLink(message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button-outline"
                        >
                          <Icon name="whatsapp" className="h-[1.1rem] w-[1.1rem]" />
                          Ask on WhatsApp
                        </a>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Custom plan CTA */}
      <section className="section-pad" style={{ textAlign: "center" }}>
        <div className="container-wide">
          <Reveal>
            <div className="eyebrow" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
              Custom plans
            </div>
            <h2 className="section-title" style={{ marginTop: 18 }}>
              Want a&nbsp;<span style={{ color: "var(--lime)" }}>custom</span>&nbsp;plan?
            </h2>
            <p
              className="section-copy"
              style={{ marginTop: 22, marginLeft: "auto", marginRight: "auto", maxWidth: 560 }}
            >
              Monthly, quarterly or yearly? Group classes bundled with your plan? Message us and we&apos;ll build the
              best combination for you.
            </p>
            <div style={{ marginTop: 34 }}>
              <WhatsAppButtonFrontend label="Ask About Custom Plans" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}