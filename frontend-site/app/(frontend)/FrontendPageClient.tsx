"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site, whatsappLink, yearsOfOperation } from "@/data/site";
import { planPeriodLabel } from "@/lib/format";
import PayNowButton from "@/components/PayNowButton";
import NewsSlideshow from "@/components/NewsSlideshow";
import CountUp from "@/components/CountUp";
import ScrollZoom from "@/components/ScrollZoom";

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
type Offer      = { id: string; title: string; description: string | null; discountValue: number | null; discountType: string | null; endDate: Date | string | null; imageUrl?: string | null; planId?: string | null };
type Plan       = { id: string; name: string; description: string | null; price: number; durationDays?: number | null; features: string[] };
type Trainer    = { id: string; name: string; specialization: string; bio: string | null; profileImageUrl: string | null; isFounder: boolean; founderNote: string | null; founderTitles: string[] };
type GalleryImg = { imageUrl: string; title: string; mediaType?: string | null; posterUrl?: string | null };
type Testimonial= { id: string; name: string; role: string | null; quote: string; imageUrl?: string | null };
type Competition= { id: string; title: string; description: string | null; startDate: Date | string | null; endDate: Date | string | null; maxParticipants: number | null; bannerUrl?: string | null; linkUrl?: string | null; clickCount?: number; _count: { participants: number } };
type Announcement = { id: string; title: string; body: string };
type ScheduleClass = { id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; location: string | null };

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ResolvedHero = {
  kicker: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string | null;
  sideNote: string;
};

/* The deployed default — shows whenever no banner is published, or the banner
   data failed to load. A published banner still overrides it entirely. */
const DEFAULT_HERO: ResolvedHero = {
  kicker: `${site.hero.kicker} · Est. ${site.established}`,
  title: site.hero.title,
  subtitle: site.hero.subtitle,
  buttonText: "Start your membership",
  buttonLink: "",
  imageUrl: "/images/hero-bg.jpg",
  sideNote: site.hero.sideNote,
};

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function fmtDate(d: Date | string | null) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Static content (same as Replit) ───────────────────────────────────── */
const services = [
  { num: "01", title: "Group Classes",        copy: "A room full of energy, with a coach who knows exactly when to push.",        tag: "ZUMBA · YOGA · SPIN",       img: "/images/services/group-class/cover.jpg" },
  { num: "02", title: "Personal Training",    copy: "A plan built around your body, your pace, and the result you came for.",     tag: "ONE-TO-ONE COACHING",     img: "/images/services/personal-training/cover.jpg" },
  { num: "03", title: "Martial Arts",         copy: "Technique, composure and a serious conditioning session in every round.",    tag: "BOXING · COMBAT",          img: "/images/services/martial-arts/cover.jpg" },
  { num: "04", title: "Outdoor Sessions",     copy: "Take the work outside. Conditioning that keeps the city in the background.", tag: "WEEKEND SESSIONS",        img: "/images/services/outdoor/cover.jpg" },
  { num: "05", title: "Nutrition & Wellness", copy: "Practical guidance to make the work in the gym count everywhere else.",      tag: "FUEL · RECOVER · REPEAT",  img: "/images/services/nutrition-wellness/cover.jpg" },
  { num: "06", title: "High-Tech Equipment",  copy: "Premium free weights and machines, maintained for the way you train.",       tag: "BUILT FOR PROGRESS",       img: "/images/services/high-tech-equipment/cover.jpg" },
];
const stats = [
  { n: yearsOfOperation(), s: "", label: "years of showing up" },
  { n: 6, s: "", label: "days to make it count" },
  { n: 5, s: "+", label: "ways to train your way" },
  { n: 1, s: "", label: "standard: your best" },
];
const faqs = [
  ["What are your opening hours?",           "We are open Monday through Saturday, 6:00 AM to 10:00 PM. There is enough room in the day to make your training non-negotiable."],
  ["Do I need to be experienced to join?",   "Not at all. Our coaches meet you at your current level, then build the skill, confidence and strength to take you further."],
  ["Can I try the facility before joining?", "Yes. Message us on WhatsApp to arrange a visit and a quick orientation with our team."],
  ["What does a membership include?",        "Membership gives you access to the main training floor and our full-service facility. Personal training and select classes are available as focused add-ons."],
];

/* ─── Competition form CTA ──────────────────────────────────────────────── */
function CompetitionFormCta({ competition }: { competition: Competition }) {
  const [count, setCount] = useState(competition.clickCount ?? 0);
  const [sent, setSent] = useState(false);
  return (
    <a
      className="competition-form-cta"
      style={{ marginTop: 16 }}
      href={competition.linkUrl!}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        if (sent) return;
        setSent(true);
        setCount((v) => v + 1);
        fetch(`/api/public/competitions/${competition.id}/click`, { method: "POST" }).catch(() => {});
      }}
    >
      <span>Fill the form</span>
      <span className="competition-form-count">{count}</span>
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
    </a>
  );
}

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
            <h2 className="section-title">Before<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>you begin.</span></h2>
            <p className="section-copy" style={{ marginTop: 25 }}>Still deciding? That is fair. Here are the things members ask us most.</p>
          </div>
          <div>
            {faqs.map(([q, a], i) => (
              <div className={`faq-item${open === i ? " open" : ""}`} key={q}>
                <button className="faq-question" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <span>{q}</span>
                  {open === i ? <MinusI /> : <PlusI />}
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>{a}</p>
                  </div>
                </div>
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
  banner, offers, plans, trainers, gallery, competitions, testimonials, announcements, schedule,
}: {
  banner: Banner | null;
  offers: Offer[];
  plans: Plan[];
  trainers: Trainer[];
  gallery: GalleryImg[];
  competitions: Competition[];
  testimonials: Testimonial[];
  announcements: Announcement[];
  schedule: ScheduleClass[];
}) {
  const founder = trainers.find(t => t.isFounder);
  const featuredTrainers = trainers.filter(t => !t.isFounder).slice(0, 3);

  /* Scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const hero: ResolvedHero = banner
    ? {
        kicker: DEFAULT_HERO.kicker,
        title: banner.title,
        subtitle: banner.subtitle ?? DEFAULT_HERO.subtitle,
        buttonText: banner.buttonText ?? DEFAULT_HERO.buttonText,
        buttonLink: banner.buttonLink ?? "",
        imageUrl: banner.imageUrl ?? DEFAULT_HERO.imageUrl,
        sideNote: DEFAULT_HERO.sideNote,
      }
    : DEFAULT_HERO;
  const heroTitleParts = hero.title.trim().split(/\s+/);
  const heroLastWord = heroTitleParts.length > 1 ? heroTitleParts.pop() : null;
  const heroImageUrl = hero.imageUrl ?? "/images/hero-bg.jpg";
  const style = { "--hero-image": `url(${heroImageUrl})` } as React.CSSProperties;
  const heroHref = hero.buttonLink || whatsappLink();
  const heroIsExternal = /^https?:\/\//.test(heroHref) || heroHref.startsWith("whatsapp:");

  return (
    <div className="noise-overlay">
      {/* ── HERO ── */}
      <section className="hero" id="top" aria-label={`${site.name} introduction`} style={style}>
        <div className="hero-ambient" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-kicker eyebrow">{hero.kicker}</div>
          <h1>
            {heroLastWord ? (
              <>{heroTitleParts.join(" ")}<br /><em>{heroLastWord}</em></>
            ) : (
              <em>{hero.title}</em>
            )}
          </h1>
          <p className="hero-intro">{hero.subtitle}</p>
          <div className="hero-actions">
            <Link
              href={heroHref}
              className="button-primary"
              {...(heroIsExternal ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {hero.buttonText}
            </Link>
            <a className="button-outline" href="#services">Explore the floor</a>
          </div>
        </div>
        <div className="hero-side-note">{hero.sideNote}</div>
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
              <div><div className="eyebrow">Limited time</div><h2 className="section-title">Active<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>Offers.</span></h2></div>
              <p className="section-copy">Grab these deals before they expire and get started for less.</p>
            </div>
            <div className="offer-grid">
              {offers.slice(0, 3).map(o => {
                const href = o.planId ? `/pay?planId=${o.planId}&offerId=${o.id}` : `/pay?offerId=${o.id}`;
                return (
                  <Link key={o.id} href={href} className="offer-card" style={{ minHeight: 240 }}>
                    {o.imageUrl && (
                      <div className="offer-banner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.imageUrl} alt={o.title} />
                        <div className="offer-banner-shade" />
                        {o.discountValue != null && (
                          <span className="offer-badge">
                            {o.discountType === "PERCENT" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="offer-body">
                      {o.imageUrl == null && o.discountValue != null && (
                        <span className="offer-badge offer-badge-floating">
                          {o.discountType === "PERCENT" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                        </span>
                      )}
                      <h3>{o.title}</h3>
                      {o.description && <p>{o.description}</p>}
                      {o.endDate && <p className="offer-date">Valid till {fmtDate(o.endDate)}</p>}
                      <p className="offer-cta">Claim offer →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── STATS ── */}
      <section className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-cell" key={i}>
            <strong>
              <CountUp end={s.n} />
              {s.s && <span>{s.s}</span>}
            </strong>
            <label>{s.label}</label>
          </div>
        ))}
      </section>

      {/* ── WHY US ── */}
      <section id="why-us" className="section-pad line-top">
        <div className="container-wide reveal">
          <div className="split-heading">
            <div><div className="eyebrow">{site.sections.whyUs}</div><h2 className="section-title">More than a<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>membership.</span></h2></div>
            <p className="section-copy">The best training space is the one that makes discipline feel natural. Since 2002, we have built exactly that in the heart of Lucknow.</p>
          </div>
          <div className="why-grid">
            {[
              { icon: <DumbbellIcon />, title: "High-tech equipment", tag: "Built for progress", copy: "The right tools, in the right condition, ready when you are." },
              { icon: <UsersIcon />,    title: "Expert trainers",    tag: "Front-row coaching", copy: "Coaches who pay attention to your form, not just your reps." },
              { icon: <TargetIcon />,   title: "Personalized plans", tag: "Your own roadmap", copy: "A clear path from where you are to where you want to be." },
              { icon: <ZapIcon />,      title: "Group energy",      tag: "Better together",  copy: "Class formats that turn a workout into the best hour of your day." },
            ].map((item, i) => (
              <article className="why-card why-in" key={item.title} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="why-index">0{i + 1}</span>
                <div className="icon-box" aria-hidden="true">{item.icon}</div>
                <h3>{item.title}</h3>
                <p className="why-tag">{item.tag}</p>
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
            <div><div className="eyebrow">Your training, expanded</div><h2 className="section-title">Every tool.<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>One floor.</span></h2></div>
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
                {schedule.length > 0 ? (
                  schedule.slice(0, 12).map((c) => (
                    <article className="class-card" key={c.id}>
                      <h3>{c.name}</h3>
                      <small>
                        {DAY_NAMES_SHORT[c.dayOfWeek]} {c.startTime}
                        {c.location ? ` · ${c.location}` : ""}
                      </small>
                    </article>
                  ))
                ) : (
                  ["Zumba", "Aerobics", "Spinning", "Yoga", "Martial Arts", "Conditioning"].map((name) => (
                    <article className="class-card" key={name}>
                      <h3>{name}</h3>
                      <small>TBD</small>
                    </article>
                  ))
                )}
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
                const msg = site.messages.planInquiry(plan.name, plan.price, planPeriodLabel(plan.durationDays));
                return (
                  <article className={`plan-card${i === 1 ? " featured" : ""}`} key={plan.id}>
                    {i === 1 && <span className="plan-tag">Most popular</span>}
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <div className="plan-price">₹{plan.price.toLocaleString("en-IN")}<small>/ {planPeriodLabel(plan.durationDays)}</small></div>
                    <ul>{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
                    <PayNowButton plan={{ id: plan.id, name: plan.name, price: plan.price }} variant="light" />
                    <Link href={whatsappLink(msg)} target="_blank" rel="noreferrer" className={i === 1 ? "button-primary" : "button-outline"}>
                      Ask about this plan
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#8f9898", textAlign: "center", paddingTop: 40 }}>Plans coming soon — <Link href={whatsappLink()} target="_blank" rel="noreferrer" style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>ask us on WhatsApp</Link>.</p>
          )}
          <div style={{ marginTop: 56, textAlign: "center" }}>
            <Link href="/pricing" className="button-primary" style={{ border: "2px solid #000" }}>
              View All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPETITIONS ── */}
      {competitions.length > 0 && (
        <section className="section-pad line-top">
          <div className="container-wide reveal">
            <div className="split-heading">
              <div>
                <div className="eyebrow">Get involved</div>
                <h2 className="section-title">Challenges &<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>Competitions.</span></h2>
              </div>
              <p className="section-copy">Join the challenge and earn your bragging rights.</p>
            </div>
            <div className="competition-grid">
              {competitions.map(c => (
                <div key={c.id} className="competition-card">
                  {c.bannerUrl && (
                    <div className="competition-banner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.bannerUrl} alt={c.title} />
                      <div className="competition-banner-shade" />
                      <span className="competition-chip">
                        <TrophyIcon size={14} /> Challenge
                      </span>
                    </div>
                  )}
                  <div className="competition-body">
                    <h3 className="competition-title">{c.title}</h3>
                    {c.description && <p className="competition-desc">{c.description}</p>}
                    {c.linkUrl && <CompetitionFormCta competition={c} />}
                    <div className="competition-meta">
                      <span className="competition-meta-item">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                      </span>
                      <span className="competition-meta-item competition-meta-count">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {c._count.participants} registered{c.maxParticipants ? ` / ${c.maxParticipants}` : ""}
                      </span>
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
              <div><div className="eyebrow">{site.sections.gallery}</div><h2 className="section-title">A space with<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>standards.</span></h2></div>
              <p className="section-copy">Dark mornings. Bright ideas. Every corner designed to keep your attention on the work.</p>
            </div>
            <div className="gallery-grid">
              {gallery.slice(0, 4).map((img, i) => (
                <figure className="gallery-item" key={img.imageUrl + i}>
                  {img.mediaType === "VIDEO" ? (
                    <video
                      src={img.imageUrl}
                      poster={img.posterUrl ?? undefined}
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.imageUrl}
                      alt={`${img.title} at ${site.name}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <figcaption>
                    <span>{img.title}</span>
                    <small>0{i + 1}</small>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div style={{ marginTop: 56, textAlign: "center" }}>
              <Link href="/gallery" className="button-outline">
                View All Photos
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FOUNDER ── */}
      {founder && (
        <section className="section-pad team-section">
          <div className="container-wide reveal">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-[60px]">
              <div className="trainer-card founder-media">
                {founder.profileImageUrl ? (
                  <ScrollZoom className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={founder.profileImageUrl} alt={founder.name} />
                  </ScrollZoom>
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "rgba(200,255,40,.08)", fontSize: 96, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, color: "var(--lime)" }}>
                    {founder.name.charAt(0)}
                  </div>
                )}
                <div className="trainer-info">
                  <h3>{founder.name}</h3>
                  <p>{founder.specialization || "Founder"} · {site.name}</p>
                </div>
              </div>
              <div>
                <div className="eyebrow">Meet the founder</div>
                <h2 className="section-title" style={{ marginTop: 12 }}>{founder.name}<br /><span style={{ color: "var(--gold)" }}>leads the way.</span></h2>
                <p className="section-copy" style={{ marginTop: 20 }}>
                  {founder.founderNote ?? site.ownerFallbackBio}
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
      {trainers.length > 0 && (
        <section className="section-pad team-section">
          <div className="container-wide reveal">
            <div className="split-heading" style={{ marginBottom: 40 }}>
              <div><div className="eyebrow">The people behind the push</div><h2 className="section-title">Good work<br /><span style={{ color: "var(--gold)" }}>needs guidance.</span></h2></div>
              <p className="section-copy">Our trainers bring experience, curiosity, and an eye for the small adjustment that changes everything.</p>
            </div>
            <div className="team-grid">
              {featuredTrainers.slice(0, 3).map(t => (
                <article className="trainer-card" key={t.id}>
                  {t.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.profileImageUrl} alt={`${t.name}, ${t.specialization} at ${site.name}`} />
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
          <div className="split-heading contact-heading">
            <div><div className="eyebrow">Make your move</div><h2 className="section-title">The floor is<br /><span style={{ color: "var(--lime)", WebkitTextStroke: "2px var(--ink)" }}>waiting.</span></h2></div>
            <p className="section-copy">Drop in for a tour, ask a question, or make your first session official. Our team is ready.</p>
          </div>
          <div className="contact-layout">
            <div className="contact-list">
              <div className="contact-line">
                <span className="contact-icon"><PinIcon /></span>
                <div>
                  <small>Find us</small>
                  <strong>{site.name}<br />{site.address}</strong>
                </div>
              </div>
              <div className="contact-line">
                <span className="contact-icon"><ClockIcon /></span>
                <div>
                  <small>Open {site.hours.split("·")[0]}</small>
                  <strong>{site.hours.split("·")[1]?.trim()}</strong>
                </div>
              </div>
              <div className="contact-line">
                <span className="contact-icon"><MessageIcon /></span>
                <div>
                  <small>WhatsApp / enquiries</small>
                  <a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noreferrer">{site.phoneDisplay}</a>
                </div>
              </div>
              <Link href={whatsappLink(site.messages.tourBooking)} target="_blank" rel="noreferrer" className="button-primary contact-cta">
                Book a facility tour
              </Link>
            </div>

            <div className="map-card">
              <iframe
                src={site.mapsEmbed}
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, border: 0, filter: "grayscale(1) contrast(1.1) invert(0.92)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${site.name} location — ${site.addressShort}`}
              />
              <div className="map-caption">
                <span className="map-caption-name">{site.name}</span>
                <span className="map-caption-addr">{site.addressShort} · {site.pincode}</span>
              </div>
              <a href={site.mapsUrl} target="_blank" rel="noreferrer" className="map-open-btn">
                Open in Maps ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

