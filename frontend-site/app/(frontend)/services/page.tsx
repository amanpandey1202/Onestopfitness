import Link from "next/link";
import PageHeaderFrontend from "@/components-frontend/PageHeader.frontend";
import WhatsAppButtonFrontend from "@/components-frontend/WhatsAppButton.frontend";
import Reveal from "@/components/Reveal";
import { services, groupClasses, personalTrainingAreas } from "@/data/services";

import { site } from "@/data/site";
export const metadata = {
  title: `Services — ${site.name}`,
  description: site.seo.description,
};

const serviceImages: Record<string, string> = {
  "Group Classes": "url(/images/services/group-classes/cover.jpg)",
  "Personal Training": "url(/images/services/personal-training/cover.jpg)",
  "Martial Arts": "url(/images/services/martial-arts/cover.jpg)",
  "Outdoor Sessions": "url(/images/services/outdoor-sessions/cover.jpg)",
  "Nutrition & Wellness": "url(/images/services/nutrition-wellness/cover.jpg)",
  "High-Tech Equipment": "url(/images/services/high-tech-equipment/cover.jpg)",
};

export default function FrontendServicesPage() {
  return (
    <>
      <PageHeaderFrontend
        kicker="Services"
        title="Everything"
        highlight="you need."
        subtitle="One gym, every tool to reach your goal — from group classes to personal training."
      />

      {/* Core services */}
      <section className="section-pad">
        <div className="container-wide">
          <div className="svc-grid">
            {services.map((service, i) => (
              <Reveal key={service.title} delay={i * 70} className="h-full">
                <div
                  className="svc-card h-full"
                  style={{ "--svc-img": serviceImages[service.title] } as React.CSSProperties}
                >
                  <div className="svc-top">
                    <span className="svc-index">0{i + 1}</span>
                    <span className="svc-tag">{service.title}</span>
                  </div>
                  <div className="svc-body">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul className="svc-points">
                      {service.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Group classes */}
      <section className="section-alt section-pad">
        <div className="container-wide">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Group Classes
          </div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Sweat<br />
            <span style={{ color: "var(--lime)" }}>together.</span>
          </h2>
          <p className="section-copy" style={{ marginTop: 22 }}>
            High-energy sessions that make every rep count — fuelled by music, community and certified coaches.
          </p>
          <div className="area-grid" style={{ marginTop: 40 }}>
            {groupClasses.map((cls, i) => (
              <Reveal key={cls} delay={i * 60}>
                <div className="area-item">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  {cls}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Personal training */}
      <section className="section-pad">
        <div className="container-wide">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Personal Training
          </div>
          <h2 className="section-title" style={{ marginTop: 18 }}>
            Tailored<br />
            <span style={{ color: "var(--lime)" }}>for you.</span>
          </h2>
          <p className="section-copy" style={{ marginTop: 22 }}>
            Specialised one-on-one programs for real-life health goals — with a custom diet plan included.
          </p>
          <div className="area-grid" style={{ marginTop: 40 }}>
            {personalTrainingAreas.map((area, i) => (
              <Reveal key={area} delay={i * 55}>
                <div className="area-item">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {area}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p className="section-copy" style={{ marginTop: 40, maxWidth: 560 }}>
              Every plan is designed around your body and your condition — with a custom diet plan included. Not sure which program fits?
            </p>
            <div style={{ marginTop: 28 }}>
              <WhatsAppButtonFrontend label="Ask Which Plan Suits You" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-alt section-pad" style={{ textAlign: "center" }}>
        <div className="container-wide">
          <Reveal>
            <h2 className="section-title">
              See Membership<br />
              <span style={{ color: "var(--lime)" }}>Prices.</span>
            </h2>
            <div style={{ marginTop: 34 }}>
              <Link href="/pricing" className="button-primary">
                View Pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
