import PageHeaderFrontend from "@/components-frontend/PageHeader.frontend";
import BMICalculatorFrontend from "@/components-frontend/BMICalculator.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

export const metadata = {
  title: `Contact — ${site.name}`,
  description: site.seo.description,
};

export default function FrontendContactPage() {
  return (
    <>
      <PageHeaderFrontend
        kicker="Contact"
        title="Find us"
        highlight="& get started."
        subtitle="Drop by, call, or message us on WhatsApp — we're quick to reply."
        image="/uploads/gallery/6c62a075ea130b2d026660612a3f40c1.jpg"
      />

      {/* Contact info + Map */}
      <section className="section-pad">
        <div className="container-wide">
          <div className="split-panel">
            {/* Left: details */}
            <div>
              <div className="contact-section" style={{ paddingTop: 0 }}>
                <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  Get in touch
                </div>
                <h2 className="section-title" style={{ marginTop: 18 }}>
                  Reach<br />
                  <span style={{ color: "var(--lime)" }}>out.</span>
                </h2>
                <p className="section-copy" style={{ marginTop: 22 }}>
                  We reply fast on WhatsApp. For quick answers, check our FAQ page first.
                </p>
                <div className="contact-list" style={{ marginTop: 36 }}>
                  <div className="contact-line">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <span style={{ color: "#7d8780", font: "8px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase" }}>Address</span>
                      <p style={{ marginTop: 6, color: "var(--paper)", fontSize: 14, lineHeight: 1.55 }}>
                        {site.address}
                      </p>
                      <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, color: "var(--paper)", font: "700 10px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase", textDecoration: "none" }}>
                        Open in Google Maps
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="contact-line">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <div>
                      <span style={{ color: "#7d8780", font: "8px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase" }}>Phone / WhatsApp</span>
                      <p style={{ marginTop: 6, color: "var(--paper)", fontSize: 14 }}>
                        {site.phoneDisplay}
                      </p>
                      <a href={`tel:${site.phoneRaw}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, color: "var(--paper)", font: "700 10px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase", textDecoration: "none" }}>
                        Call now
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="contact-line">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div>
                      <span style={{ color: "#7d8780", font: "8px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase" }}>Timings</span>
                      <p style={{ marginTop: 6, color: "var(--paper)", fontSize: 14 }}>
                        {site.hours}
                      </p>
                      <p style={{ marginTop: 4, color: "var(--paper)", fontSize: 14 }}>
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                  <div className="contact-line">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    <div>
                      <span style={{ color: "#7d8780", font: "8px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase" }}>Instagram</span>
                      <p style={{ marginTop: 6, color: "var(--paper)", fontSize: 14 }}>
                        {site.instagramHandle}
                      </p>
                      <a href={site.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, color: "var(--paper)", font: "700 10px var(--font-space-mono),monospace", letterSpacing: ".12em", textTransform: "uppercase", textDecoration: "none" }}>
                        Follow us
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Map */}
            <Reveal variant="right" delay={100}>
              <div className="map-card" style={{ aspectRatio: "4/3" }}>
                <iframe
                  src={site.mapsEmbed}
                  title={`${site.name} location map`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div style={{ marginTop: 22 }}>
                <WhatsAppButtonFrontend
                  label="Get Directions on WhatsApp"
                  message={`Hi ${site.name}, please send me directions to your gym at ${site.address}.`}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BMI */}
      <section className="section-alt section-pad">
        <div className="container-wide">
          <div className="split-panel">
            <Reveal variant="left">
              <div>
                <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  Quick check
                </div>
                <h2 className="section-title" style={{ marginTop: 18 }}>
                  Know your<br />
                  <span style={{ color: "var(--lime)" }}>start.</span>
                </h2>
                <p className="section-copy" style={{ marginTop: 22 }}>
                  Two numbers, a quick answer — then we help you plan the way forward.
                </p>
              </div>
            </Reveal>
            <Reveal variant="right" delay={120}>
              <BMICalculatorFrontend />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{ textAlign: "center" }}>
        <div className="container-wide">
          <Reveal>
            <h2 className="section-title">
              Have a<br />
              <span style={{ color: "var(--lime)" }}>question?</span>
            </h2>
            <p className="section-copy" style={{ marginTop: 22, marginLeft: "auto", marginRight: "auto" }}>
              Message us and we&apos;ll get back to you right away.
            </p>
            <div style={{ marginTop: 34 }}>
              <WhatsAppButtonFrontend label="Chat on WhatsApp" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
