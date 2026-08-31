import Icon from "./Icon";
import WhatsAppButton from "./WhatsAppButton";

export type PlanCard = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
};

/**
 * Renders a membership plan (from the database) with an "Ask Price on WhatsApp"
 * button that opens WhatsApp with a plan-specific pre-filled message.
 */
export default function PricingCard({
  plan,
  featured = false,
  tag,
}: {
  plan: PlanCard;
  featured?: boolean;
  tag?: string;
}) {
  const message = `Hi ONE STOP FITNESS, I'm interested in the ${plan.name} plan (₹${plan.price}/month). Please share the details.`;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition hover:-translate-y-1 active:scale-[0.98] ${
        featured
          ? "border-gym-lime bg-gradient-to-b from-gym-lime/15 to-transparent glow-pulse"
          : "border-white/10 bg-gym-ink shadow-card hover:border-gym-lime/50"
      }`}
    >
      {tag && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gym-lime px-3 py-1 text-xs font-bold text-gym-black">
          {tag}
        </span>
      )}

      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
        {plan.name}
      </h3>
      {plan.description && (
        <p className="mt-1 text-sm text-white/50">{plan.description}</p>
      )}

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gym-lime">
          ₹{plan.price.toLocaleString("en-IN")}
        </span>
        <span className="text-sm text-white/50">/ month</span>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-white/75">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-gym-lime" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />
      <WhatsAppButton message={message} className="w-full" />
    </div>
  );
}
