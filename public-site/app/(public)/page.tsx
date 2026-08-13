import Image from "next/image";
import Link from "next/link";
import SectionHeadingFrontend from "@/components-frontend/SectionHeading.frontend";
import PricingCardFrontend from "@/components-frontend/PricingCard.frontend";
import GalleryCarousel from "@/components/GalleryCarousel";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import NewsSlideshow from "@/components/NewsSlideshow";
import Reveal from "@/components/Reveal";
import TestimonialCarouselFrontend from "@/components-frontend/TestimonialCarousel.frontend";
import MarqueeFrontend from "@/components-frontend/Marquee.frontend";
import Icon, { type IconName } from "@/components-frontend/Icons.frontend";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { formatDate } from "@/lib/format";
import {
  getActiveOffers,
  getActivePlans,
  getPublishedAnnouncements,
  getPublishedBanners,
  getPublishedCompetitions,
  getPublishedGallery,
  getPublishedTestimonials,
  getPublishedTrainers,
} from "@/lib/services/public";

// Always read fresh content from the database so admin edits show immediately.
export const revalidate = 15;

const stats = [
  { value: "Since 2002", label: "Serving Lucknow" },
  { value: "5+", label: "Programs & Classes" },
  { value: "5", label: "Fitness Titles" },
  { value: "6 Days", label: "Open Every Week" },
];

const reasons: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "dumbbell",
    title: "High-Tech Equipment",
    text: "Modern machines for every fitness goal.",
  },
  {
    icon: "user",
    title: "Expert Trainers",
    text: "Aamir, Rajan & Founder Deepak guide you.",
  },
  {
    icon: "target",
    title: "Personalized Plans",
    text: "Diet + training built for your body.",
  },
  {
    icon: "users",
    title: "Group Classes",
    text: "Zumba, Aerobics, Spinning, Yoga & more.",
  },
];

const serviceIcon: Record<string, IconName> = {
  "Group Classes": "users",
  "Personal Training": "target",
  "Martial Arts": "shield",
  "Outdoor Sessions": "activity",
  "Nutrition & Wellness": "leaf",
  "High-Tech Equipment": "dumbbell",
};

export default async function FrontendHomePage() {
  const [banners, offers, plans, trainers, gallery, competitions, testimonials, announcements] =
    await Promise.all([
      getPublishedBanners(),
      getActiveOffers(),
      getActivePlans(),
      getPublishedTrainers(),
      getPublishedGallery(),
      getPublishedCompetitions(),
      getPublishedTestimonials(),
      getPublishedAnnouncements(),
    ]);

  const banner = banners[0];
  const topOffer = offers[0];
  const featuredPlans = plans.slice(0, 3);
  const featuredTrainers = trainers.slice(0, 4);
  const founder = trainers.find((t) => t.isFounder);

  return (
    <>
      {/* ============================= HERO ============================= */}
      <section className="noise relative overflow-hidden">
        {/* ambient lime orbs */}
        <div
          className="orb"
          style={{ background: "rgba(154,217,1,0.35)", width: 420, height: 420, top: "-8%", right: "-6%" }}
        />
        <div
          className="orb"
          style={{ background: "rgba(154,217,1,0.22)", width: 340, height: 340, bottom: "-10%", left: "-6%", animationDelay: "-5s" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 80% 0%, rgba(154,217,1,0.12), transparent 62%), radial-gradient(700px 460px at 8% 100%, rgba(154,217,1,0.07), transparent 60%)",
          }}
        />

        {banner?.imageUrl ? (
          /* Poster mode — banner image beside the headline */
          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="reveal text-center lg:text-left">
                <p className="kicker mx-auto justify-center lg:mx-0 lg:justify-start">
                  Lucknow&apos;s Premium Fitness Center
                </p>
                <h1 className="font-anton mt-6 uppercase leading-[0.9] text-white">
                  <span className="block text-[clamp(3rem,8vw,6.2rem)]">
                    {banner.title?.split(" ").slice(0, -1).join(" ") ?? "BE YOUR"}
                  </span>
                  <span className="glow-lime block text-[clamp(3rem,8vw,6.2rem)]">
                    {banner.title?.split(" ").slice(-1)[0] ?? "BEST"}
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-white/65 lg:mx-0">
                  {banner.subtitle ??
                    `Cardio · Weight Training · Martial Arts · Personal Training · Group Classes. Train with champions at ${site.name}.`}
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  {banner.buttonText ? (
                    <Link href={banner.buttonLink || "/pricing"} className="btn btn-primary">
                      {banner.buttonText}
                    </Link>
                  ) : (
                    <WhatsAppButtonFrontend label="Join Now" />
                  )}
                  <Link href="/pricing" className="btn btn-outline">
                    View Pricing
                  </Link>
                </div>
                <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/40">
                  {site.hours}
                </p>
              </div>

              <div className="reveal reveal-1 relative mx-auto w-full max-w-md">
                <div className="hero-frame aspect-[4/5]">
                  {/* next/image resizes the poster to viewport width and serves
                      compressed WebP instead of the raw multi-MB PNG. */}
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    priority
                    sizes="(min-width:1024px) 33vw, 90vw"
                    className="object-cover"
                  />
                  {topOffer?.discountValue != null && topOffer && (
                    <span className="absolute right-4 top-4 z-10 rounded-full bg-gym-lime px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#101010] shadow-[0_0_18px_rgba(154,217,1,0.6)]">
                      {topOffer.discountType === "PERCENT"
                        ? `${topOffer.discountValue}% OFF`
                        : `₹${topOffer.discountValue} OFF`}
                    </span>
                  )}
                  {topOffer?.title && (
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                      <p className="font-anton text-lg uppercase text-gym-lime">
                        {topOffer.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">
                        {topOffer.endDate
                          ? `Valid till ${formatDate(topOffer.endDate)}`
                          : "Limited time offer"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Text-only mode when no banner image is uploaded */
          <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
            <p className="kicker kicker-center mx-auto">Lucknow&apos;s Premium Fitness Center</p>
            <h1 className="font-anton mt-6 uppercase leading-[0.88] text-white">
              <span className="block text-[clamp(3.4rem,11vw,8rem)]">BE YOUR</span>
              <span className="glow-lime block text-[clamp(3.4rem,11vw,8rem)]">BEST</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-white/65">
              {banner?.subtitle ??
                `Cardio · Weight Training · Martial Arts · Personal Training · Group Classes. Train with champions at ${site.name}.`}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {banner?.buttonText ? (
                <Link href={banner.buttonLink || "/pricing"} className="btn btn-primary">
                  {banner.buttonText}
                </Link>
              ) : (
                <WhatsAppButtonFrontend label="Join Now" />
              )}
              <Link href="/pricing" className="btn btn-outline">
                View Pricing
              </Link>
            </div>
            <p className="mt-9 text-xs uppercase tracking-[0.3em] text-white/40">{site.hours}</p>
          </div>
        )}
      </section>

      {/* Marquee strip */}
      <MarqueeFrontend
        words={["Train", "Eat", "Sleep", "Repeat", "Commit", "Transform", "Discipline", "Results"]}
      />

      {/* ========================= ANNOUNCEMENTS ========================= */}
      {announcements.length > 0 && (
        <section className="border-b border-white/10 bg-[#0c0c0c] py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <NewsSlideshow announcements={announcements} />
          </div>
        </section>
      )}

      {/* ============================ OFFERS ============================ */}
      {offers.length > 0 && (
        <section className="section mx-auto max-w-7xl">
          <SectionHeadingFrontend kicker="Limited time" title="Active Offers" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.slice(0, 3).map((offer, i) => (
              <Reveal key={offer.id} delay={i * 90} className="h-full">
                <div className="panel card-lift h-full overflow-hidden p-0">
                {offer.imageUrl ? (
                  <div className="relative w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="block h-auto w-full object-cover transition duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                    {offer.discountValue != null && (
                      <span className="absolute right-4 top-4 rounded-full bg-gym-lime px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#101010] shadow-[0_0_16px_rgba(154,217,1,0.5)]">
                        {offer.discountType === "PERCENT"
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`}
                      </span>
                    )}
                  </div>
                ) : (
                  offer.discountValue != null && (
                    <span className="absolute right-4 top-4 rounded-full bg-gym-lime px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#101010] shadow-[0_0_16px_rgba(154,217,1,0.5)]">
                      {offer.discountType === "PERCENT"
                        ? `${offer.discountValue}% OFF`
                        : `₹${offer.discountValue} OFF`}
                    </span>
                  )
                )}
                <div className="p-7">
                  <h3 className="font-anton text-2xl uppercase leading-none text-gym-lime">
                    {offer.title}
                  </h3>
                  {offer.description && (
                    <p className="mt-3 text-sm text-white/65">{offer.description}</p>
                  )}
                  {offer.endDate && (
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
                      Valid till {formatDate(offer.endDate)}
                    </p>
                  )}
                </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============================ STATS ============================ */}
      <section className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90}>
              <div className="text-center">
                <p className="stat-num text-4xl uppercase sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ WHY US ============================ */}
      <section className="section mx-auto max-w-7xl">
        <SectionHeadingFrontend
          kicker="Why ONE STOP FITNESS"
          title="Train Different"
          subtitle="A gym built on passion, discipline and results since 2002."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="panel p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gym-lime/40 bg-gym-lime/10 text-gym-lime shadow-[0_0_22px_rgba(154,217,1,0.2)]">
                <Icon name={reason.icon} className="h-7 w-7" />
              </div>
              <h3 className="font-anton mt-5 text-lg uppercase leading-tight text-white">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm text-white/55">{reason.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= SERVICES PREVIEW ========================= */}
      <section className="border-y border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto max-w-7xl">
          <SectionHeadingFrontend
            kicker="What we offer"
            title="Our Services"
            subtitle="From group energy to one-on-one transformation."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.title} delay={(i % 3) * 90} className="h-full">
              <div className="panel card-lift h-full p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gym-lime/40 bg-gym-lime/10 text-gym-lime">
                    <Icon name={serviceIcon[service.title] ?? "dumbbell"} className="h-5.5 w-5.5" />
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
          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="nav-link inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-gym-lime"
            >
              View all services
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ PLANS ============================ */}
      <section className="section mx-auto max-w-7xl">
        <SectionHeadingFrontend
          kicker="Simple pricing"
          title="Membership Plans"
          subtitle="Transparent monthly rates. Tap any plan to get full details on WhatsApp."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {featuredPlans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100}>
              <PricingCardFrontend
                plan={plan}
                featured={i === 0}
                tag={i === 0 ? "Most Popular" : undefined}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/pricing"
            className="nav-link inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-gym-lime"
          >
            See all plans, including Martial Arts & Personal Training
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ========================= COMPETITIONS ========================= */}
      {competitions.length > 0 && (
        <section className="border-y border-white/10 bg-[#0c0c0c]">
          <div className="section mx-auto max-w-7xl">
            <SectionHeadingFrontend
              kicker="Get involved"
              title="Challenges & Competitions"
              subtitle="Join the challenge and earn your bragging rights."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {competitions.map((comp, i) => (
                <Reveal key={comp.id} delay={i * 90} className="h-full">
                <div className="panel card-lift h-full overflow-hidden p-0">
                  {comp.bannerUrl && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={comp.bannerUrl}
                        alt={comp.title}
                        className="h-full w-full object-cover transition duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-7">
                    <span className="inline-flex items-center gap-2 text-gym-lime">
                      <Icon name="trophy" className="h-5 w-5" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Competition</span>
                    </span>
                    <h3 className="font-anton mt-4 text-2xl uppercase leading-none text-white">
                      {comp.title}
                    </h3>
                    {comp.description && (
                      <p className="mt-3 text-sm text-white/65">{comp.description}</p>
                    )}
                    <p className="mt-5 flex items-center gap-2 text-xs text-white/45">
                      <Icon name="calendar" className="h-3.5 w-3.5 text-gym-lime" />
                      {formatDate(comp.startDate)} → {formatDate(comp.endDate)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-white/45">
                      <Icon name="users" className="h-3.5 w-3.5 text-gym-lime" />
                      {comp._count.participants} registered
                      {comp.maxParticipants ? ` / ${comp.maxParticipants}` : ""}
                    </p>
                  </div>
                </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================= GALLERY PREVIEW ========================= */}
      {gallery.length > 0 && (
        <section className="border-y border-white/10 bg-[#0c0c0c]">
          <div className="section mx-auto max-w-7xl">
            <SectionHeadingFrontend
              kicker="Inside the gym"
              title="Gallery"
              subtitle="Take a look around before you step in."
            />
            <div className="mt-12">
              <GalleryCarousel items={gallery} />
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/gallery"
                className="nav-link inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-gym-lime"
              >
                View full gallery
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================ FOUNDER ============================ */}
      <section className="section mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal relative mx-auto w-full max-w-sm">
            <div className="hero-frame aspect-square">
              {founder?.profileImageUrl ? (
                <Image
                  src={founder.profileImageUrl}
                  alt={`Founder of ${site.name}`}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gym-lime/10 font-anton text-8xl text-gym-lime">
                  {(founder?.name ?? "D").charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="reveal reveal-1">
            <p className="kicker">Meet the Founder</p>
            <h2 className="font-anton mt-5 text-5xl uppercase leading-[0.9] text-white">
              {founder?.name ?? "Deepak"}
            </h2>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
              Founder · {site.name}
            </p>
            <p className="mt-5 max-w-lg text-white/60">
              {founder?.founderNote ??
                "A fitness champion turned coach, Deepak built ONE STOP FITNESS to give Lucknow a training floor where discipline meets modern science."}
            </p>
            {founder?.founderTitles && founder.founderTitles.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {founder.founderTitles.map((title) => (
                  <span
                    key={title}
                    className="flex items-center gap-2 rounded-full border border-gym-lime/35 bg-gym-lime/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-gym-lime"
                  >
                    <Icon name="award" className="h-3.5 w-3.5" />
                    {title}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-9">
              <Link href="/about" className="btn btn-primary">
                About Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TRAINERS ============================ */}
      {featuredTrainers.length > 0 && (
        <section className="border-y border-white/10 bg-[#0c0c0c]">
          <div className="section mx-auto max-w-7xl">
            <SectionHeadingFrontend
              kicker="The Team"
              title="Meet Your Trainers"
              subtitle="Certified, experienced and invested in your progress."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredTrainers.map((trainer, i) => (
                <Reveal key={trainer.id} delay={(i % 4) * 90} className="h-full">
                <div className="panel card-lift h-full p-7 text-center">
                  <div className="relative mx-auto aspect-square w-full max-w-[150px] overflow-hidden rounded-full border-2 border-gym-lime/45 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_26px_rgba(154,217,1,0.2)]">
                    {trainer.profileImageUrl ? (
                      <Image
                        src={trainer.profileImageUrl}
                        alt={trainer.name}
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gym-lime/12 font-anton text-4xl text-gym-lime">
                        {trainer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-anton mt-5 text-lg uppercase leading-tight text-white">
                    {trainer.name}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gym-lime">
                    {trainer.specialization}
                  </p>
                  <p className="mt-3 text-sm text-white/55">{trainer.bio}</p>
                </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================= TESTIMONIALS ========================= */}
      {testimonials.length > 0 && (
        <section className="section mx-auto max-w-7xl">
          <Reveal>
            <SectionHeadingFrontend
              kicker="Community voices"
              title="Real Reviews"
              subtitle="Straight from our members — rotating non-stop."
            />
          </Reveal>
          <div className="mt-12">
            <TestimonialCarouselFrontend testimonials={testimonials} />
          </div>
        </section>
      )}

      {/* ============================ CTA BANNER ============================ */}
      <section className="noise relative overflow-hidden border-t border-white/10">
        <div
          className="orb"
          style={{ background: "rgba(154,217,1,0.3)", width: 380, height: 380, top: "-20%", left: "50%", transform: "translateX(-50%)" }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <Reveal>
            <p className="kicker kicker-center mx-auto">Your move</p>
            <h2 className="font-anton mt-5 uppercase leading-[0.9] text-white">
              Ready to <span className="glow-lime">Transform?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/60">
              Your first step to a fitter you starts with one message.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <WhatsAppButtonFrontend label="Get Started Today" />
              <Link href="/login" className="btn btn-ghost">
                Member Login
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
