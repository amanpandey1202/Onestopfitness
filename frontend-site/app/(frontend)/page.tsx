import {
  getActiveOffers,
  getActivePlans,
  getPublishedAnnouncements,
  getPublishedBanners,
  getPublishedCompetitions,
  getPublishedGallery,
  getPublishedTestimonials,
  getPublishedTrainers,
  getSchedule,
} from "@/lib/services/public";
import FrontendPageClient from "./FrontendPageClient";

// Always fresh — admin edits show within seconds
export const dynamic = "force-dynamic";

/** One failing data source must never take down the page — the hero is hardcoded and always renders. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[home-ssr]", error);
    return fallback;
  }
}

export default async function FrontendHomePage() {
  const [banners, offers, plans, trainers, gallery, competitions, testimonials, announcements, schedule] =
    await Promise.all([
      safe(() => getPublishedBanners(), []),
      safe(() => getActiveOffers(), []),
      safe(() => getActivePlans(), []),
      safe(() => getPublishedTrainers(), []),
      safe(() => getPublishedGallery(), []),
      safe(() => getPublishedCompetitions(), []),
      safe(() => getPublishedTestimonials(), []),
      safe(() => getPublishedAnnouncements(), []),
      safe(() => getSchedule(), []),
    ]);

  return (
    <FrontendPageClient
      banner={banners[0] ?? null}
      offers={offers}
      plans={plans}
      trainers={trainers}
      gallery={gallery}
      competitions={competitions}
      testimonials={testimonials}
      announcements={announcements}
      schedule={schedule}
    />
  );
}