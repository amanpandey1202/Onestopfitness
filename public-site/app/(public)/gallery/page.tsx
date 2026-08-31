import Icon from "@/components/Icon";
import SectionHeading from "@/components/SectionHeading";
import GalleryExperience from "@/components/GalleryExperience";
import { site } from "@/data/site";
import { getPublishedGallery } from "@/lib/services/public";

export const metadata = {
  title: "Gallery — ONE STOP FITNESS",
  description:
    "Photos of ONE STOP FITNESS in Lucknow — our facilities, classes and community.",
};

// Cache the page and revalidate every 15s so admin edits still show quickly.
export const revalidate = 15;

export default async function GalleryPage() {
  const gallery = await getPublishedGallery();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          kicker="Gallery"
          title="Inside ONE STOP FITNESS"
          subtitle="Our facilities, classes and community — captured."
        />

        <div className="mt-12">
          <GalleryExperience items={gallery} />
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="border-y border-white/10 bg-gym-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <SectionHeading
            kicker="Daily updates"
            title="Follow the Journey"
            subtitle="New training videos, transformations and behind-the-scenes every week."
          />
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md border border-gym-lime px-5 py-3 text-sm font-bold text-gym-lime transition hover:bg-gym-lime hover:text-gym-black"
          >
            <Icon name="camera" className="h-4 w-4" />
            Follow us on Instagram · {site.instagramHandle}
          </a>
          <p className="mt-6 text-xs text-white/45">
            We upload new photos regularly — check back often.
          </p>
        </div>
      </section>
    </>
  );
}
