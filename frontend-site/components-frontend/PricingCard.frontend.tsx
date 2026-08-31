import WhatsAppButtonFrontend from "./WhatsAppButton.frontend";
import Icon from "./Icons.frontend";
import PayNowButton from "@/components/PayNowButton";

export type PlanCardFrontend = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
};

/**
 * Premium membership card (renders a database plan) with a glowing
 * "Most Popular" tag and an "Ask Price on WhatsApp" CTA.
 */
export default function PricingCardFrontend({
  plan,
  featured = false,
  tag,
}: {
  plan: PlanCardFrontend;
  featured?: boolean;
  tag?: string;
}) {
  const message = `Hi ONE STOP FITNESS, I'm interested in the ${plan.name} plan (₹${plan.price}/month). Please share the details.`;

  return (
    <div
      className={`panel flex flex-col p-7 ${
        featured ? "!border-gym-lime/45 glow-pulse shadow-[0_0_0_1px_rgba(154,217,1,0.14),0_0_44px_rgba(154,217,1,0.14)]" : ""
      }`}
    >
      {tag && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gym-lime px-3.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#101010] shadow-[0_0_18px_rgba(154,217,1,0.55)]">
          {tag}
        </span>
      )}

      <h3 className="font-anton text-xl uppercase leading-tight text-white">
        {plan.name}
      </h3>
      {plan.description && (
        <p className="mt-1 text-sm text-white/50">{plan.description}</p>
      )}

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="stat-num text-5xl">
          ₹{plan.price.toLocaleString("en-IN")}
        </span>
        <span className="text-sm text-white/45">/ month</span>
      </div>

      <ul className="mt-6 space-y-2.5 text-sm text-white/75">
        {plan.features.map((feature) => (
          <li key={feature} className="check-row">
            <Icon name="check" className="h-[1.05rem] w-[1.05rem]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex-1" />
      <PayNowButton plan={{ id: plan.id, name: plan.name, price: plan.price }} />
      <div className="mt-2.5" />
      <WhatsAppButtonFrontend message={message} className="w-full" />
    </div>
  );
}
