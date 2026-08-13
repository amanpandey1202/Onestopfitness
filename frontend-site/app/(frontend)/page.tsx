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
import FrontendPageClient from "./FrontendPageClient";

// Always fresh — admin edits show within seconds
export const dynamic = "force-dynamic";

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
    />
  );
}
