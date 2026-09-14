import PageHeaderFrontend from "@/components-frontend/PageHeader.frontend";
import GalleryGridFrontend from "@/components-frontend/GalleryGrid.frontend";
import Icon from "@/components-frontend/Icons.frontend";
import { site } from "@/data/site";
import { getPublishedGallery } from "@/lib/services/public";

export const metadata = {
  title: `Gallery — ${site.name}`,
  description: site.seo.description,
};

export const dynamic = "force-dynamic";

export default async function FrontendGalleryPage() {
  const gallery = await getPublishedGallery();

  return (
    <>
      <PageHeaderFrontend
        kicker="Gallery"
        title="Inside"
        highlight={`${site.name}.`}
        subtitle="Our facilities, classes and community — captured."
      />

      {/* Gallery grid */}
      <section className="section-pad">
        <div className="container-wide">
          <GalleryGridFrontend items={gallery} />
        </div>
      </section>

      {/* Instagram */}
      <section className="section-alt section-pad" style={{ textAlign: "center" }}>
        <div className="container-wide">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            Daily updates
          </div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Follow the<br />
            <span style={{ color: "var(--lime)" }}>journey.</span>
          </h2>
          <p className="section-copy" style={{ marginTop: 22, marginLeft: "auto", marginRight: "auto" }}>
            New training videos, transformations and behind-the-scenes every week.
          </p>
          <div style={{ marginTop: 34 }}>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="button-outline"
            >
              <Icon name="instagram" className="h-[1.1rem] w-[1.1rem]" />
              Follow us on Instagram · {site.instagramHandle}
            </a>
          </div>
          <p style={{ marginTop: 28, color: "#5d6760", font: "9px var(--font-space-mono),monospace", letterSpacing: ".16em", textTransform: "uppercase" }}>
            We upload new photos regularly — check back often.
          </p>
        </div>
      </section>
    </>
  );
}
