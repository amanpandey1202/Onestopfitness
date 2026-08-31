import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import BMICalculatorFrontend from "@/components-frontend/BMICalculator.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Icon, { type IconName } from "@/components-frontend/Icons.frontend";
import Reveal from "@/components/Reveal";
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
    icon: "camera",
    title: "Instagram",
    lines: [site.instagramHandle],
    href: site.instagram,
    hrefLabel: "Follow us",
  },
];

export default function FrontendContactPage() {
  return (
    <>
      <PageHeroFrontend
        kicker="Contact"
        title="Find Us & Get Started"
        subtitle="Drop by, call, or message us on WhatsApp — we're quick to reply."
      />

      {/* INFO CARDS */}
      <section className="section mx-auto max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 70} className="h-full">
              <div className="panel h-full p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gym-lime/40 bg-gym-lime/10 text-gym-lime shadow-[0_0_20px_rgba(154,217,1,0.18)]">
                <Icon name={card.icon} className="h-6 w-6" />
              </div>
              <h3 className="font-anton mt-5 text-lg uppercase leading-tight text-gym-lime">
                {card.title}
              </h3>
              {card.lines.map((line) => (
                <p key={line} className="mt-1.5 text-sm text-white/70">
                  {line}
                </p>
              ))}
              {card.href && (
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link mt-4 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-white"
                >
                  {card.hrefLabel}
                  <Icon name="arrowUpRight" className="h-3.5 w-3.5 text-gym-lime" />
                </a>
              )}
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MAP + BMI */}
      <section className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <Reveal variant="left">
            <div>
            <h2 className="font-anton text-3xl uppercase leading-none text-white">
              Location <span className="glow-lime">Map</span>
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Sheela Garden, Alamnagar, Rajajipuram — easy to reach, parking
              friendly.
            </p>
            <div className="hero-frame mt-6">
              <iframe
                src={site.mapsEmbed}
                title="ONE STOP FITNESS location map"
                width="100%"
                height="340"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-6">
              <WhatsAppButtonFrontend
                label="Get Directions on WhatsApp"
                message={`Hi ${site.name}, please send me directions to your gym at ${site.address}.`}
              />
            </div>
          </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <BMICalculatorFrontend />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section mx-auto max-w-7xl text-center">
        <Reveal>
          <h2 className="font-anton uppercase leading-[0.9] text-white sm:text-5xl text-4xl">
            Have a <span className="glow-lime">Question?</span>
          </h2>
          <p className="mt-4 text-white/60">Message us and we&apos;ll get back to you right away.</p>
          <div className="mt-8">
            <WhatsAppButtonFrontend label="Chat on WhatsApp" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
