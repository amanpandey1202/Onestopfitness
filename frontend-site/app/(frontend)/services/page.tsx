import Link from "next/link";
import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import SectionHeadingFrontend from "@/components-frontend/SectionHeading.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Icon, { type IconName } from "@/components-frontend/Icons.frontend";
import Reveal from "@/components/Reveal";
import { services, groupClasses, personalTrainingAreas } from "@/data/services";

export const metadata = {
  title: "Services — ONE STOP FITNESS",
  description:
    "Group classes, personal training, martial arts, outdoor sessions and nutrition guidance in Lucknow.",
};

const serviceIcon: Record<string, IconName> = {
  "Group Classes": "users",
  "Personal Training": "target",
  "Martial Arts": "shield",
  "Outdoor Sessions": "activity",
  "Nutrition & Wellness": "leaf",
  "High-Tech Equipment": "dumbbell",
};

const classIcon: Record<string, IconName> = {
  Aerobics: "activity",
  Yoga: "leaf",
  Spinning: "bike",
  Zumba: "music",
  "Martial Arts": "shield",
};

export default function FrontendServicesPage() {
  return (
    <>
      <PageHeroFrontend
        kicker="Services"
        title="Everything You Need"
        subtitle="One gym, every tool to reach your goal."
      />

      {/* Core services */}
      <section className="section mx-auto max-w-7xl">
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 70} className="h-full">
              <div className="panel h-full p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gym-lime/40 bg-gym-lime/10 text-gym-lime shadow-[0_0_20px_rgba(154,217,1,0.18)]">
                  <Icon name={serviceIcon[service.title] ?? "dumbbell"} className="h-6 w-6" />
                </span>
                <h3 className="font-anton text-xl uppercase leading-tight text-white">
                  {service.title}
                </h3>
              </div>
              <p className="mt-4 text-sm text-white/60">{service.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {service.points.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-white/12 px-3 py-1 text-xs text-white/65"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Group classes */}
      <section className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto max-w-7xl">
          <SectionHeadingFrontend
            kicker="Group Classes"
            title="Sweat Together"
            subtitle="High-energy classes that make fitness fun."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {groupClasses.map((cls, i) => (
              <Reveal key={cls} delay={i * 60} className="h-full">
                <div className="panel h-full p-7 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gym-lime/40 bg-gym-lime/10 text-gym-lime shadow-[0_0_20px_rgba(154,217,1,0.18)]">
                    <Icon name={classIcon[cls] ?? "activity"} className="h-7 w-7" />
                  </div>
                  <h3 className="font-anton mt-4 text-lg uppercase leading-tight text-white">
                    {cls}
                  </h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Personal training */}
      <section className="section mx-auto max-w-7xl">
        <SectionHeadingFrontend
          kicker="Personal Training"
          title="Tailored For You"
          subtitle="Specialised programs for real-life health goals."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personalTrainingAreas.map((area, i) => (
            <Reveal key={area} delay={i * 55} className="h-full">
              <div className="panel flex h-full items-center gap-3 px-5 py-4">
                <Icon name="check" className="h-5 w-5 shrink-0 text-gym-lime" />
                <span className="font-medium text-white/85">{area}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mx-auto mt-8 max-w-2xl text-sm text-white/55">
            Every plan is designed around your body and your condition — with a
            custom diet plan included. Not sure which program fits? Ask us on
            WhatsApp and we&apos;ll point you the right way.
          </p>
          <div className="mt-8">
            <WhatsAppButtonFrontend label="Ask Which Plan Suits You" />
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0c0c0c]">
        <Reveal>
          <div className="section mx-auto max-w-7xl text-center">
            <h2 className="font-anton uppercase leading-[0.9] text-white sm:text-5xl text-4xl">
              See Membership <span className="glow-lime">Prices</span>
            </h2>
            <div className="mt-8">
              <Link href="/pricing" className="btn btn-primary">
                View Pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
