"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site, whatsappLink } from "@/data/site";
import PayNowButton from "@/components/PayNowButton";
import NewsSlideshow from "@/components/NewsSlideshow";

/* ─── Inline SVG Icons ─────────────────────────────────────────────────── */
const ChevL = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevR = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const PlusI = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const MinusI = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;

const DumbbellIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>;
const UsersIcon    = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const TargetIcon   = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
const ZapIcon      = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const TrophyIcon   = ({ size = 16 }: { size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const AwardIcon    = () => <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
const PinIcon      = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const ClockIcon    = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MessageIcon  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const QuoteIcon    = () => <svg viewBox="0 0 24 24" width="38" height="38" fill="var(--lime)" style={{ opacity: 0.95 }}><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>;

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Banner     = { id: string; title: string; subtitle: string | null; imageUrl: string | null; buttonText: string | null; buttonLink: string | null };
type Offer      = { id: string; title: string; description: string | null; discountValue: number | null; discountType: string | null; endDate: Date | string | null; imageUrl?: string | null };
type Plan       = { id: string; name: string; description: string | null; price: number; features: string[] };
type Trainer    = { id: string; name: string; specialization: string; bio: string | null; profileImageUrl: string | null; isFounder: boolean; founderNote: string | null; founderTitles: string[] };
type GalleryImg = { imageUrl: string; title: string; mediaType?: string | null };
type Testimonial= { id: string; name: string; role: string | null; quote: string; imageUrl?: string | null };
type Competition= { id: string; title: string; description: string | null; startDate: Date | string | null; endDate: Date | string | null; maxParticipants: number | null; bannerUrl?: string | null; _count: { participants: number } };
type Announcement = { id: string; title: string; body: string };

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function fmtDate(d: Date | string | null) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Static content (same as Replit) ───────────────────────────────────── */
const services = [
  { num: "01", title: "Group Classes",        copy: "A room full of energy, with a coach who knows exactly when to push.",        tag: "ZUMBA · YOGA · SPIN",       img: "/images/gallery/group-class.svg" },
  { num: "02", title: "Personal Training",    copy: "A plan built around your body, your pace, and the result you came for.",     tag: "ONE-TO-ONE COACHING",     img: "/images/hero-bg.jpg" },
  { num: "03", title: "Martial Arts",         copy: "Technique, composure and a serious conditioning session in every round.",    tag: "BOXING · COMBAT",          img: "/images/gallery/martial-arts.svg" },
  { num: "04", title: "Outdoor Sessions",     copy: "Take the work outside. Conditioning that keeps the city in the background.", tag: "WEEKEND SESSIONS",        img: "/images/gallery/outdoor.svg" },
  { num: "05", title: "Nutrition & Wellness", copy: "Practical guidance to make the work in the gym count everywhere else.",      tag: "FUEL · RECOVER · REPEAT",  img: "/images/gallery/yoga.svg" },
  { num: "06", title: "High-Tech Equipment",  copy: "Premium free weights and machines, maintained for the way you train.",       tag: "BUILT FOR PROGRESS",       img: "/images/gallery/equipment.svg" },
];
const classes = ["Zumba", "Aerobics", "Spinning", "Yoga", "Martial Arts", "Conditioning"];
const faqs = [
  ["What are your opening hours?",           "We are open Monday through Saturday, 6:00 AM to 10:00 PM. There is enough room in the day to make your training non-negotiable."],
  ["Do I need to be experienced to join?",   "Not at all. Our coaches meet you at your current level, then build the skill, confidence and strength to take you further."],
  ["Can I try the facility before joining?", "Yes. Message us on WhatsApp to arrange a visit and a quick orientation with our team."],
  ["What does a membership include?",        "Membership gives you access to the main training floor and our full-service facility. Personal training and select classes are available as focused add-ons."],
];

/* ─── Testimonial carousel ───────────────────────────────────────────────── */
function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => setCur(v => (v + 1) % testimonials.length), 7000);
    return () => clearInterval(t);
  }, [testimonials.length]);
  if (!testimonials.length) return null;
  const t = testimonials[cur];
  const initial = t.name ? t.name.trim().charAt(0).toUpperCase() : "M";

  return (
    <section className="section-pad testimonial-section">
      <div className="container-wide reveal">
        <div className="testimonial-inner">
          <div>
            <div className="eyebrow">Words from the floor</div>
            <div className="quote-mark">
              <QuoteIcon />
            </div>
            <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
          </div>
          <div className="testimonial">
            <blockquote key={t.id}>&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={t.name} className="avatar-img" />
                ) : (
                  initial
                )}
              </div>
              <div>
                <strong>{t.name}</strong>
                <span>{t.role ?? "Member"}</span>
              </div>
            </div>
            <div className="testimonial-controls">
              <button className="round-button" onClick={() => setCur((cur - 1 + testimonials.length) % testimonials.length)} aria-label="Previous">
                <ChevL />
              </button>
              <button className="round-button" onClick={() => setCur((cur + 1) % testimonials.length)} aria-label="Next">
                <ChevR />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ accordion ──────────────────────────────────────────────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section-pad" id="faq">
      <div className="container-wide reveal">
        <div className="faq-layout">
          <div>
            <div className="eyebrow">Good questions</div>
            <h2 className="section-title">Before<br /><span style={{ color: "var(--lime)" }}>you begin.</span></h2>
            <p className="section-copy" style={{ marginTop: 25 }}>Still deciding? That is fair. Here are the things members ask us most.</p>
          </div>
          <div>
            {faqs.map(([q, a], i) => (
              <div className="faq-item" key={q}>
                <button className="faq-question" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <span>{q}</span>
                  {open === i ? <MinusI /> : <PlusI />}
                </button>
                {open === i && <div className="faq-answer">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function FrontendPageClient({
  banner, offers, plans, trainers, gallery, competitions, testimonials, announcements,
}: {
  banner: Banner | null;
  offers: Offer[];
  plans: Plan[];
  trainers: Trainer[];
  gallery: GalleryImg[];
  competitions: Competition[];
  testimonials: Testimonial[];
  announcements: Announcement[];
}) {
  const founder = trainers.find(t => t.isFounder);
  const featuredTrainers = trainers.filter(t => !t.isFounder).slice(0, 3);
  const allTrainers = founder ? [founder, ...featuredTrainers] : featuredTrainers;

  /* Scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const heroImageUrl = banner?.imageUrl ?? "/images/hero-bg.jpg";
  const style = { "--hero-image": `url(${heroImageUrl})` } as React.CSSProperties;

  return (
    <div className="noise-overlay">
      {/* ── HERO ── */}
      <section className="hero" id="top" aria-label="One Stop Fitness introduction" style={style}>
        <div className="hero-content">
          <div className="hero-kicker eyebrow">Lucknow&apos;s training ground · Est. {site.established}</div>
          <h1>
            {banner?.title ? (
              <>{banner.title.split(" ").slice(0, -1).join(" ")}<br /><em>{banner.title.split(" ").slice(-1)[0]}</em></>
            ) : (
              <>Be your<br /><em>best.</em></>
            )}
          </h1>
          <p className="hero-intro">
            {banner?.subtitle ?? "A full-service fitness centre for people who are done waiting for the right time. Find your pace. Build your standard."}
          </p>
          <div className="hero-actions">
            {banner?.buttonText ? (
              <Link href={banner.buttonLink || whatsappLink()} className="button-primary">{banner.buttonText}</Link>
            ) : (
              <Link href={whatsappLink()} target="_blank" rel="noreferrer" className="button-primary">Start your membership</Link>
            )}
            <a className="button-outline" href="#services">Explore the floor</a>
          </div>
        </div>
        <div className="hero-side-note">Train with intent / Lucknow, India</div>
        <div className="scroll-cue"><span aria-hidden="true" /> Scroll to explore</div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker" aria-label="Training principles">
        <div className="ticker-track">
          {["Train","Eat","Sleep","Repeat","Discipline","Transform","Commit","Results","Train","Eat","Sleep","Repeat","Discipline","Transform","Commit","Results"].map((w, i) => (
            <span className="ticker-item" key={i}>{w}</span>
          ))}
        </div>
      </div>

      {/* ── ANNOUNCEMENTS ── */}
      {announcements.length > 0 && (
        <section style={{ background: "#0c0c0c", borderBottom: "1px solid rgba(236,232,220,.1)", padding: "16px 0" }}>
          <div className="container-wide">
            <NewsSlideshow announcements={announcements} />
          </div>
        </section>
      )}

      {/* ── OFFERS ── */}
      {offers.length > 0 && (
        <section className="section-pad line-top">
          <div className="container-wide reveal">
            <div className="split-heading">
              <div><div className="eyebrow">Limited time</div><h2 className="section-title">Active<br /><span style={{ color: "var(--lime)" }}>Offers.</span></h2></div>
              <p className="section-copy">Grab these deals before they expire and get started for less.</p>
            </div>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {offers.slice(0, 3).map(o => (
                <div key={o.id} className="service-card" style={{ minHeight: 180, padding: 0, overflow: "hidden" }}>
                  {o.imageUrl && (
                    <div style={{ position: "relative", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.imageUrl} alt={o.title} style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(17,20,21,.85), transparent 55%)" }} />
                      {o.discountValue != null && (
                        <span style={{ position: "absolute", top: 12, right: 12, background: "var(--lime)", color: "var(--ink)", padding: "4px 12px", fontSize: 10, fontFamily: "'Space Mono',monospace", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                          {o.discountType === "PERCENT" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="service-bottom" style={{ padding: o.imageUrl ? "24px 28px 26px" : undefined }}>
                    {o.imageUrl == null && o.discountValue != null && (
                      <span style={{ position: "absolute", top: 16, right: 16, background: "var(--lime)", color: "var(--ink)", padding: "4px 12px", fontSize: 10, fontFamily: "'Space Mono',monospace", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                        {o.discountType === "PERCENT" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                      </span>
                    )}
                    <h3>{o.title}</h3>
                    {o.description && <p>{o.description}</p>}
                    {o.endDate && <p style={{ marginTop: 8, color: "var(--lime)", fontSize: 10, fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em" }}>Valid till {fmtDate(o.endDate)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STATS ── */}
      <section className="stats-grid">
        {[["22","years of showing up",""],["06","days to make it count",""],["05","ways to train your way","+"],["01","standard: your best",""]].map(([n, l, s], i) => (
          <div className="stat-cell" key={i}>
            <strong>{n}<span>{s}</span></strong>
            <label>{l}</label>
          </div>
        ))}
      </section>

      {/* ── WHY US ── */}
      <section id="why-us" className="section-pad line-top">
        <div className="container-wide reveal">
          <div className="split-heading">
            <div><div className="eyebrow">The One Stop difference</div><h2 className="section-title">More than a<br /><span style={{ color: "var(--lime)" }}>membership.</span></h2></div>
            <p className="section-copy">The best training space is the one that makes discipline feel natural. Since 2002, we have built exactly that in the heart of Lucknow.</p>
          </div>
          <div className="why-grid">
            {[
              { icon: <DumbbellIcon />, title: "High-tech equipment", copy: "The right tools, in the right condition, ready when you are." },
              { icon: <UsersIcon />,    title: "Expert trainers",    copy: "Coaches who pay attention to your form, not just your reps." },
              { icon: <TargetIcon />,   title: "Personalized plans", copy: "A clear path from where you are to where you want to be." },
              { icon: <ZapIcon />,      title: "Group energy",      copy: "Class formats that turn a workout into the best hour of your day." },
            ].map((item) => (
              <article className="why-card" key={item.title}>
                <div className="icon-box" aria-hidden="true">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="section-pad services-band">
        <div className="container-wide reveal">
          <div className="split-heading">
            <div><div className="eyebrow">Your training, expanded</div><h2 className="section-title">Every tool.<br /><span style={{ color: "var(--lime)" }}>One floor.</span></h2></div>
            <p className="section-copy">From your first lift to your hundredth class, choose the kind of work that keeps you coming back.</p>
          </div>
          <div className="services-grid">
            {services.map((s) => (
              <article className="service-card" key={s.title} style={{ "--service-img": `url(${s.img})` } as React.CSSProperties}>
                <span className="service-index">{s.num} / 06</span>
                <div className="service-bottom">
                  <h3>{s.title}</h3>
                  <p>{s.copy}</p>
                </div>
                <small style={{ position: "absolute", top: 25, right: 24, color: "#a6aeaa", font: "9px 'Space Mono',monospace" }}>{s.tag}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── GROUP CLASSES ── */}
      <section className="section-pad" id="classes">
        <div className="container-wide reveal">
          <div className="classes-layout">
            <div>
              <div className="eyebrow">Find your rhythm</div>
              <h2 className="section-title">Move<br /><span style={{ color: "var(--gold)" }}>together.</span></h2>
              <p className="section-copy" style={{ marginTop: 26 }}>High energy, good music, and a room that knows how to make 6 PM feel like a reset.</p>
            </div>
            <div>
              <div className="class-list">
                {classes.map((name, i) => (
                  <article className="class-card" key={name}>
                    <h3>{name}</h3>
                    <small>0{i + 1}</small>
                  </article>
                ))}
              </div>
              <div className="classes-aside">
                <span className="eyebrow">Class schedule / all levels</span>
                <strong>Move<br />more.</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="plans" className="section-pad pricing-section">
        <div className="container-wide reveal">
          <div className="pricing-head">
            <div>
              <div className="eyebrow">Choose your commitment</div>
              <h2 className="section-title">Pay in<br /><span style={{ color: "#6b8616" }}>progress.</span></h2>
            </div>
            <p className="section-copy">No complicated tiers. Just a clear invitation to train consistently and get more from the work.</p>
          </div>
          {plans.length > 0 ? (
            <div className="plans-grid">
              {plans.slice(0, 3).map((plan, i) => {
                const msg = `Hi ONE STOP FITNESS, I'm interested in the ${plan.name} plan (₹${plan.price}/month). Please share details.`;
                return (
                  <article className={`plan-card${i === 1 ? " featured" : ""}`} key={plan.id}>
                    {i === 1 && <span className="plan-tag">Most popular</span>}
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <div className="plan-price">₹{plan.price.toLocaleString("en-IN")}<small>/ month</small></div>
                    <ul>{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
                    <PayNowButton plan={{ id: plan.id, name: plan.name, price: plan.price }} />
                    <Link href={whatsappLink(msg)} target="_blank" rel="noreferrer" className={i === 1 ? "button-primary" : "button-outline"}>
                      Ask about this plan
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#8f9898", textAlign: "center", paddingTop: 40 }}>Plans coming soon — <Link href={whatsappLink()} target="_blank" rel="noreferrer" style={{ color: "var(--lime)" }}>ask us on WhatsApp</Link>.</p>
          )}
        </div>
      </section>

      {/* ── COMPETITIONS ── */}
      {competitions.length > 0 && (
        <section className="section-pad line-top">
          <div className="container-wide reveal">
            <div className="split-heading">
              <div>
                <div className="eyebrow">Get involved</div>
                <h2 className="section-title">Challenges &<br /><span style={{ color: "var(--lime)" }}>Competitions.</span></h2>
              </div>
              <p className="section-copy">Join the challenge and earn your bragging rights.</p>
            </div>
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
              {competitions.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: c.bannerUrl ? 0 : "30px",
                    background: "#161d1e",
                    border: "1px solid rgba(236,232,220,.12)",
                    position: "relative",
                    minHeight: "250px",
                    overflow: "hidden",
                  }}
                >
                  {c.bannerUrl && (
                    <div style={{ position: "relative", height: 170, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.bannerUrl} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(22,29,30,.9), transparent 55%)" }} />
                    </div>
                  )}
                  <div style={{ padding: c.bannerUrl ? "22px 30px 26px" : undefined, display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span style={{ color: "var(--lime)", display: "flex", alignItems: "center" }}>
                          <TrophyIcon size={16} />
                        </span>
                        <span style={{ color: "var(--lime)", font: "700 11px 'Space Mono', monospace", letterSpacing: ".12em", textTransform: "uppercase" }}>
                          CHALLENGE
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 10px", color: "var(--paper)", font: "700 28px/1 'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>
                        {c.title}
                      </h3>
                      {c.description && (
                        <p style={{ margin: 0, color: "#8a948e", fontSize: 13, lineHeight: 1.5 }}>
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(236,232,220,.1)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 10, fontFamily: "'Space Mono',monospace", color: "var(--lime)" }}>
                      <span>📅 {fmtDate(c.startDate)} → {fmtDate(c.endDate)}</span>
                      <span>👥 {c._count.participants} registered{c.maxParticipants ? ` / ${c.maxParticipants}` : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {gallery.length > 0 && (
        <section id="gallery" className="section-pad">
          <div className="container-wide reveal">
            <div className="split-heading">
              <div><div className="eyebrow">Inside One Stop</div><h2 className="section-title">A space with<br /><span style={{ color: "var(--lime)" }}>standards.</span></h2></div>
              <p className="section-copy">Dark mornings. Bright ideas. Every corner designed to keep your attention on the work.</p>
            </div>
            <div className="gallery-grid">
              {gallery.slice(0, 4).map((img, i) => (
                <figure className="gallery-item" key={img.imageUrl + i}>
                  {img.mediaType === "VIDEO" ? (
                    <video
                      src={img.imageUrl}
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.imageUrl} alt={`${img.title} at One Stop Fitness`} />
                  )}
                  <figcaption>{img.title} / 0{i + 1}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOUNDER ── */}
      {founder && (
        <section className="section-pad team-section">
          <div className="container-wide reveal">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
              <div className="trainer-card" style={{ minHeight: 420 }}>
                {founder.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={founder.profileImageUrl} alt={founder.name} />
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "rgba(200,255,40,.08)", fontSize: 96, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, color: "var(--lime)" }}>
                    {founder.name.charAt(0)}
                  </div>
                )}
                <div className="trainer-info">
                  <h3>{founder.name}</h3>
                  <p>Founder · ONE STOP FITNESS</p>
                </div>
              </div>
              <div>
                <div className="eyebrow">Meet the founder</div>
                <h2 className="section-title" style={{ marginTop: 12 }}>{founder.name}<br /><span style={{ color: "var(--gold)" }}>leads the way.</span></h2>
                <p className="section-copy" style={{ marginTop: 20 }}>
                  {founder.founderNote ?? "A fitness champion turned coach, Deepak built ONE STOP FITNESS to give Lucknow a training floor where discipline meets modern science."}
                </p>
                {founder.founderTitles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
                    {founder.founderTitles.map(t => (
                      <span key={t} style={{ border: "1px solid rgba(217,174,98,.4)", padding: "6px 14px", fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <AwardIcon /> {t}
                      </span>
                    ))}
                  </div>
                )}
                <Link href={whatsappLink()} target="_blank" rel="noreferrer" className="button-primary" style={{ marginTop: 32, display: "inline-flex" }}>
                  Train with us
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TRAINERS ── */}
      {featuredTrainers.length > 0 && (
        <section className="section-pad team-section">
          <div className="container-wide reveal">
            <div className="split-heading">
              <div><div className="eyebrow">The people behind the push</div><h2 className="section-title">Good work<br /><span style={{ color: "var(--gold)" }}>needs guidance.</span></h2></div>
              <p className="section-copy">Our trainers bring experience, curiosity, and an eye for the small adjustment that changes everything.</p>
            </div>
            <div className="team-grid">
              {allTrainers.slice(0, 3).map(t => (
                <article className="trainer-card" key={t.id}>
                  {t.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.profileImageUrl} alt={`${t.name}, ${t.specialization} at One Stop Fitness`} />
                  ) : (
                    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "rgba(200,255,40,.08)", fontSize: 72, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, color: "var(--lime)" }}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="trainer-info">
                    <h3>{t.name}</h3>
                    <p>{t.specialization}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CONTACT ── */}
      <section id="contact" className="section-pad contact-section">
        <div className="container-wide reveal">
          <div className="split-heading">
            <div><div className="eyebrow">Make your move</div><h2 className="section-title">The floor is<br /><span style={{ color: "var(--lime)" }}>waiting.</span></h2></div>
            <p className="section-copy">Drop in for a tour, ask a question, or make your first session official. Our team is ready.</p>
          </div>
          <div className="contact-layout">
            <div className="contact-list">
              <div className="contact-line">
                <span style={{ color: "var(--lime)", display: "flex", marginTop: 2 }}><PinIcon /></span>
                <div><small>Find us</small><strong>ONE STOP FITNESS CENTER<br />{site.address}</strong></div>
              </div>
              <div className="contact-line">
                <span style={{ color: "var(--lime)", display: "flex", marginTop: 2 }}><ClockIcon /></span>
                <div><small>Open {site.hours.split("·")[0]}</small><strong>{site.hours.split("·")[1]?.trim()}</strong></div>
              </div>
              <div className="contact-line">
                <span style={{ color: "var(--lime)", display: "flex", marginTop: 2 }}><MessageIcon /></span>
                <div><small>WhatsApp / enquiries</small><a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noreferrer">{site.phoneDisplay}</a></div>
              </div>
              <Link href={whatsappLink("Hi ONE STOP FITNESS, I'd like to book a facility tour.")} target="_blank" rel="noreferrer" className="button-primary" style={{ width: "fit-content", marginTop: 10 }}>
                Book a facility tour
              </Link>
            </div>
            <div style={{ position: "relative", minHeight: 390, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(236,232,220,.14)" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.6!2d80.9334!3d26.8712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399957ab671e1e3b%3A0x6e3b1e3b!2sSheela%20Garden%2C%20356%2FKC426%20A%2C%20Alamnagar%2C%20Rajajipuram%2C%20Lucknow%2C%20Uttar%20Pradesh%20226017!5e0!3m2!1sen!2sin!4v1"
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, border: 0, filter: "grayscale(1) contrast(1.1) invert(0.92)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ONE STOP FITNESS location — Sheela Garden, Rajajipuram, Lucknow"
              />
              {/* Overlay label */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "14px 18px",
                background: "rgba(13,17,18,.88)",
                backdropFilter: "blur(8px)",
                borderTop: "1px solid rgba(236,232,220,.14)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <strong style={{ display: "block", color: "var(--paper)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}>
                    ONE STOP FITNESS
                  </strong>
                  <span style={{ color: "#788080", fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                    Rajajipuram, Lucknow · 226017
                  </span>
                </div>
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary"
                  style={{ fontSize: 10, padding: "0 14px", minHeight: 36, whiteSpace: "nowrap" }}
                >
                  Open in Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
