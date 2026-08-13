import SectionHeading from "@/components/SectionHeading";
import BMICalculator from "@/components/BMICalculator";
import WhatsAppButton from "@/components/WhatsAppButton";
import Icon, { type IconName } from "@/components/Icon";
import { site } from "@/data/site";

export const metadata = {
  title: "Contact — ONE STOP FITNESS",
  description:
    "Find ONE STOP FITNESS in Rajajipuram, Lucknow. Call or WhatsApp us at 092369 58881.",
};

const infoCards: {
  icon: IconName;
  title: string;
  lines: string[];
  href?: string;
  hrefLabel?: string;
}[] = [
  {
    icon: "pin",
    title: "Address",
    lines: [site.address],
    href: site.mapsUrl,
    hrefLabel: "Open in Google Maps",
  },
  {
    icon: "phone",
    title: "Phone / WhatsApp",
    lines: [site.phoneDisplay],
    href: `tel:${site.phoneRaw}`,
    hrefLabel: "Call now",
  },
  {
    icon: "clock",
    title: "Timings",
    lines: [site.hours, "Sunday: Closed"],
  },
  {
    icon: "instagram",
    title: "Instagram",
    lines: [site.instagramHandle],
    href: site.instagram,
    hrefLabel: "Follow us",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          kicker="Contact"
          title="Find Us & Get Started"
          subtitle="Drop by, call, or message us on WhatsApp — we're quick to reply."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-gym-ink p-6 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gym-lime/30 bg-gym-lime/10 text-gym-lime">
                <Icon name={card.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-gym-lime">
                {card.title}
              </h3>
              {card.lines.map((line) => (
                <p key={line} className="mt-1 text-sm text-white/70">
                  {line}
                </p>
              ))}
              {card.href && (
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-bold text-white underline-offset-4 transition hover:text-gym-lime hover:underline"
                >
                  {card.hrefLabel} →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* MAP + BMI */}
      <section className="border-y border-white/10 bg-gym-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              Location <span className="text-gym-lime">Map</span>
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Sheela Garden, Alamnagar, Rajajipuram — easy to reach, parking
              friendly.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <iframe
                src={site.mapsEmbed}
                title="ONE STOP FITNESS location map"
                width="100%"
                height="360"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-5">
              <WhatsAppButton label="Get Directions on WhatsApp" message={`Hi ${site.name}, please send me directions to your gym at ${site.address}.`} />
            </div>
          </div>

          <BMICalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Have a <span className="text-gym-lime">Question?</span>
        </h2>
        <p className="mt-3 text-white/60">
          Message us and we&apos;ll get back to you right away.
        </p>
        <div className="mt-6">
          <WhatsAppButton label="Chat on WhatsApp" />
        </div>
      </section>
    </>
  );
}
