import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";
import WhatsAppButton from "@/components/WhatsAppButton";
import { site } from "@/data/site";
import { getPublishedTrainers } from "@/lib/services/public";

export const metadata = {
  title: "About Us — ONE STOP FITNESS",
  description:
    "Since 2002, ONE STOP FITNESS has been Lucknow's trailblazer in fitness. Meet Founder Deepak and our expert trainers.",
};

// Cache the page and revalidate every 15s so admin edits still show quickly.
export const revalidate = 15;

const FALLBACK_TITLES = [
  "MR LUCKNOW 2014",
  "MR UP 2025",
  "FIT FACTOR 2016",
  "JERAI FITNESS MODEL 2016",
  "MR REGION 2016",
];

const FALLBACK_NOTE =
  "A fitness champion turned coach, I built ONE STOP FITNESS so Lucknow could train with purpose. Every title I won, I won on floors just like this one — now it's your turn.";

export default async function AboutPage() {
  const trainers = await getPublishedTrainers();
  const founder =
    trainers.find((t) => t.isFounder) ??
    trainers.find((t) => t.name.toLowerCase().includes("deepak"));
  const team = trainers.filter((t) => t.id !== founder?.id);

  return (
    <>
      {/* HISTORY */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          kicker="Our Story"
          title="A Trailblazer Since 2002"
          subtitle="Two decades of building a fitter world, one member at a time."
        />
        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-white/65">
          <p>
            {site.name} has been a trailblazer in Lucknow&apos;s fitness
            industry since {site.established}. What began as a passion grew into
            a community — a place where champions are made and every member is
            treated like family.
          </p>
          <p className="font-semibold text-gym-lime">{site.mission}.</p>
        </div>
      </section>

      {/* FOUNDER */}
      {founder && (
        <section className="border-y border-white/10 bg-gym-ink">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-gym-lime/40 shadow-glow">
              {founder.profileImageUrl ? (
                <Image
                  src={founder.profileImageUrl}
                  alt={`${founder.name} — Founder of ${site.name}`}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gym-lime/10 font-display text-6xl font-bold text-gym-lime">
                  {founder.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gym-lime">
                The Founder
              </p>
              <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
                {founder.name}
              </h2>
              <p className="mt-1 font-semibold text-white/70">
                Founder · {founder.specialization}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(founder.founderTitles?.length
                  ? founder.founderTitles
                  : FALLBACK_TITLES
                ).map((title) => (
                  <span
                    key={title}
                    className="rounded-full bg-gym-lime/15 px-3 py-1 text-xs font-bold tracking-wide text-gym-lime"
                  >
                    {title}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-white/60">{founder.founderNote ?? FALLBACK_NOTE}</p>
              {founder.instagram && (
                <p className="mt-4 text-sm text-white/55">
                  Instagram:{" "}
                  <span className="font-semibold text-gym-lime">{founder.instagram}</span>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TRAINERS */}
      {team.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            kicker="The Team"
            title="Trainers Who Care"
            subtitle="Experienced, certified and genuinely invested in your progress."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((trainer) => (
              <div
                key={trainer.id}
                className="rounded-2xl border border-white/10 bg-gym-ink p-6 text-center shadow-card transition hover:border-gym-lime/60"
              >
                <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-full border-2 border-gym-lime/40">
                  {trainer.profileImageUrl && (
                    <Image
                      src={trainer.profileImageUrl}
                      alt={trainer.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-white">
                  {trainer.name}
                </h3>
                <p className="text-sm font-semibold text-gym-lime">{trainer.specialization}</p>
                {trainer.experience && (
                  <p className="mt-1 text-xs text-white/45">{trainer.experience} experience</p>
                )}
                <p className="mt-2 text-sm text-white/55">{trainer.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-white/10 bg-gym-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
            Train With Us <span className="text-gym-lime">Today</span>
          </h2>
          <p className="mt-3 text-white/60">
            Come meet the team and see the gym for yourself.
          </p>
          <div className="mt-6">
            <WhatsAppButton label="BOOK A TRIAL VISIT" />
          </div>
        </div>
      </section>
    </>
  );
}
