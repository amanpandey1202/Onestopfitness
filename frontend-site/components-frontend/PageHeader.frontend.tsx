/**
 * Sub-page header in the ONE STOP FITNESS frontend.css design language —
 * Space-Mono eyebrow rule, oversized Barlow Condensed display title with a
 * lime highlight, and a quiet DM Sans sub-line. Dark smoke band with a soft
 * lime radial glow, sitting just below the fixed nav.
 */
export default function PageHeaderFrontend({
  kicker,
  title,
  highlight,
  subtitle,
  image,
}: {
  kicker: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section
      className={`page-header${image ? " page-header--image" : ""}`}
      style={image ? ({ "--page-header-img": `url(${image})` } as React.CSSProperties) : undefined}
    >
      <div className="container-wide">
        <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {kicker}
        </div>
        <h1 className="section-title" style={{ marginTop: 18 }}>
          {title}
          {highlight && (
            <>
              <br />
              <span style={{ color: "var(--lime)" }}>{highlight}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="section-copy" style={{ marginTop: 24, maxWidth: 520 }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}