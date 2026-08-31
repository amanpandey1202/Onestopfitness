import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import WhatsAppButton from "@/components/WhatsAppButton";
import Icon, { type IconName } from "@/components/Icon";
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
  Aerobics: "music",
  Yoga: "leaf",
  Spinning: "bike",
  Zumba: "flame",
  "Martial Arts": "shield",
};

export default function ServicesPage() {
  return (
    <>
      <section className="section mx-auto max-w-7xl">
        <SectionHeading
          kicker="Services"
          title="Everything You Need"
          subtitle="One gym, every tool to reach your goal."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 80} className="h-full">
              <div className="panel group h-full p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gym-lime/30 bg-gym-lime/10 text-gym-lime transition-transform duration-300 group-hover:scale-110">
                  <Icon name={serviceIcon[service.title] ?? "dumbbell"} className="h-6 w-6" />
                </span>
                <h3 className="font-anton mt-5 text-2xl uppercase text-white">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-white/60">{service.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.points.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
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

      {/* GROUP CLASSES */}
      <section className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto max-w-7xl">
          <SectionHeading
            kicker="Group Classes"
            title="Sweat Together"
            subtitle="High-energy classes that make fitness fun."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {groupClasses.map((cls, i) => (
              <Reveal key={cls} delay={i * 70} className="h-full">
                <div className="panel h-full p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gym-lime/30 bg-gym-lime/10 text-gym-lime">
                    <Icon name={classIcon[cls] ?? "activity"} className="h-6 w-6" />
                  </span>
                  <h3 className="font-anton mt-4 text-lg uppercase text-white">{cls}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAL TRAINING */}
      <section className="section mx-auto max-w-7xl">
        <SectionHeading
          kicker="Personal Training"
          title="Tailored For You"
          subtitle="Specialised programs for real-life health goals."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personalTrainingAreas.map((area, i) => (
            <Reveal key={area} delay={i * 70}>
              <div className="check-row rounded-xl border border-white/10 bg-[#0e0e0e] px-5 py-4">
                <Icon name="check" className="h-4 w-4 text-gym-lime" />
                <span className="font-medium text-white/85">{area}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-6 max-w-2xl text-sm text-white/55">
            Every plan is built around your health — not a one-size-fits-all routine.
          </p>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto max-w-4xl text-center">
          <Reveal>
            <h2 className="font-anton text-4xl uppercase leading-[0.95] text-white sm:text-5xl">
              Ready to <span className="glow-lime">Start?</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Your first step to a stronger, fitter you begins today.
            </p>
          </Reveal>
          <Reveal delay={260} className="mt-9">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <WhatsAppButton label="Join Now" />
              <Link href="/pricing" className="btn btn-outline">
                View Pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
