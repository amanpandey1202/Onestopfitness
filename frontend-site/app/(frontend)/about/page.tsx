import Image from "next/image";
import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import SectionHeadingFrontend from "@/components-frontend/SectionHeading.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Icon from "@/components-frontend/Icons.frontend";
import Reveal from "@/components/Reveal";
import ScrollZoom from "@/components/ScrollZoom";
import { site } from "@/data/site";
import { getPublishedTrainers } from "@/lib/services/public";

export const metadata = {
  title: "About Us — ONE STOP FITNESS",
  description:
    "Since 2002, ONE STOP FITNESS has been Lucknow's trailblazer in fitness. Meet Founder Deepak and our expert trainers.",
};

export const dynamic = "force-dynamic";

const FALLBACK_TITLES = [
  "MR LUCKNOW 2014",
  "MR UP 2025",
  "FIT FACTOR 2016",
  "JERAI FITNESS MODEL 2016",
  "MR REGION 2016",
];

const FALLBACK_NOTE =
  "A fitness champion turned coach, I built ONE STOP FITNESS so Lucknow could train with purpose. Every title I won, I won on floors just like this one — now it's your turn.";

export default async function FrontendAboutPage() {
  const trainers = await getPublishedTrainers();
  const founder =
    trainers.find((t) => t.isFounder) ??
    trainers.find((t) => t.name.toLowerCase().includes("deepak"));
  const team = trainers.filter((t) => t.id !== founder?.id);

  return (
    <>
      <PageHeroFrontend
        kicker="Our Story"
        title="A Trailblazer Since 2002"
        subtitle="Two decades of building a fitter world, one member at a time."
      />

      {/* HISTORY */}
      <section className="section mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-3xl space-y-5 text-center text-white/65">
            <p>
              {site.name} has been a trailblazer in Lucknow&apos;s fitness
              industry since {site.established}. What began as a passion grew into
              a community — a place where champions are made and every member is
              treated like family.
            </p>
            <p className="font-anton text-2xl uppercase leading-none text-gym-lime">
              {site.mission}.
            </p>
          </div>
        </Reveal>
      </section>

      {/* FOUNDER */}
      {founder && (
        <section className="border-y border-white/10 bg-[#0c0c0c]">
          <div className="section mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="hero-frame aspect-square">
                {founder.profileImageUrl ? (
                  <ScrollZoom className="absolute inset-0">
                    <Image
                      src={founder.profileImageUrl}
                      alt={`${founder.name} — Founder of ${site.name}`}
                      fill
                      sizes="(min-width:1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </ScrollZoom>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gym-lime/10 font-anton text-8xl text-gym-lime">
                    {founder.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <Reveal as="div" variant="right" delay={120}>
              <div>
              <p className="kicker">The Founder</p>
              <h2 className="font-anton mt-5 text-5xl uppercase leading-[0.9] text-white">
                {founder.name}
              </h2>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                Founder · {founder.specialization}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(founder.founderTitles?.length
                  ? founder.founderTitles
                  : FALLBACK_TITLES
                ).map((title) => (
                  <span
                    key={title}
                    className="flex items-center gap-2 rounded-full border border-gym-lime/35 bg-gym-lime/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-gym-lime"
                  >
                    <Icon name="award" className="h-3.5 w-3.5" />
                    {title}
                  </span>
                ))}
              </div>
              <p className="mt-6 max-w-lg text-white/60">
                {founder.founderNote ?? FALLBACK_NOTE}
              </p>
              {founder.instagram && (
                <p className="mt-5 flex items-center gap-2.5 text-sm text-white/55">
                  <Icon name="instagram" className="h-4 w-4 text-gym-lime" />
                  Instagram:{" "}
                  <span className="font-semibold text-gym-lime">{founder.instagram}</span>
                </p>
              )}
            </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* TRAINERS */}
      {team.length > 0 && (
        <section className="section mx-auto max-w-7xl">
          <SectionHeadingFrontend
            kicker="The Team"
            title="Trainers Who Care"
            subtitle="Experienced, certified and genuinely invested in your progress."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((trainer, i) => (
              <Reveal key={trainer.id} delay={i * 80} className="h-full">
                <div className="panel h-full p-7 text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[190px] overflow-hidden rounded-full border-2 border-gym-lime/45 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_26px_rgba(154,217,1,0.2)]">
                  {trainer.profileImageUrl ? (
                    <Image
                      src={trainer.profileImageUrl}
                      alt={trainer.name}
                      fill
                      sizes="190px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gym-lime/12 font-anton text-5xl text-gym-lime">
                      {trainer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-anton mt-5 text-xl uppercase leading-tight text-white">
                  {trainer.name}
                </h3>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gym-lime">
                  {trainer.specialization}
                </p>
                {trainer.experience && (
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/40">
                    {trainer.experience} experience
                  </p>
                )}
                <p className="mt-3 text-sm text-white/55">{trainer.bio}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0c0c0c]">
        <Reveal>
          <div className="section mx-auto max-w-7xl text-center">
          <h2 className="font-anton uppercase leading-[0.9] text-white sm:text-5xl text-4xl">
            Train With Us <span className="glow-lime">Today</span>
          </h2>
          <p className="mt-4 text-white/60">Come meet the team and see the gym for yourself.</p>
          <div className="mt-8">
            <WhatsAppButtonFrontend label="Book a Trial Visit" />
          </div>
        </div>
        </Reveal>
      </section>
    </>
  );
}
