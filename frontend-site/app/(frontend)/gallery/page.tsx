import PageHeroFrontend from "@/components-frontend/PageHero.frontend";
import SectionHeadingFrontend from "@/components-frontend/SectionHeading.frontend";
import GalleryGridFrontend from "@/components-frontend/GalleryGrid.frontend";
import Icon from "@/components-frontend/Icons.frontend";
import { site } from "@/data/site";
import { getPublishedGallery } from "@/lib/services/public";

export const metadata = {
  title: "Gallery — ONE STOP FITNESS",
  description:
    "Photos of ONE STOP FITNESS in Lucknow — our facilities, classes and community.",
};

export const dynamic = "force-dynamic";

export default async function FrontendGalleryPage() {
  const gallery = await getPublishedGallery();

  return (
    <>
      <PageHeroFrontend
        kicker="Gallery"
        title="Inside ONE STOP FITNESS"
        subtitle="Our facilities, classes and community — captured."
      />

      <section className="section mx-auto max-w-7xl">
        <GalleryGridFrontend items={gallery} />
      </section>

      {/* Instagram */}
      <section className="border-t border-white/10 bg-[#0c0c0c]">
        <div className="section mx-auto max-w-7xl text-center">
          <SectionHeadingFrontend
            kicker="Daily updates"
            title="Follow the Journey"
            subtitle="New training videos, transformations and behind-the-scenes every week."
          />
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline mt-10"
          >
            <Icon name="instagram" className="h-[1.1rem] w-[1.1rem]" />
            Follow us on Instagram · {site.instagramHandle}
          </a>
          <p className="mt-7 text-xs uppercase tracking-[0.2em] text-white/40">
            We upload new photos regularly — check back often.
          </p>
        </div>
      </section>
    </>
  );
}
