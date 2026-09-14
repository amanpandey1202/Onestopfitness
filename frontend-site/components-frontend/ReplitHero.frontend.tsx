"use client";

import Link from "next/link";
import { site, whatsappLink } from "@/data/site";

interface ReplitHeroProps {
  banner?: {
    imageUrl: string | null;
    title: string;
    subtitle: string | null;
    buttonText: string | null;
    buttonLink: string | null;
  } | null;
}

/**
 * Full-screen Replit-style hero section.
 * Uses CSS --hero-image variable to set the background.
 * Falls back to a dark gradient if no banner image is uploaded.
 */
export default function ReplitHeroFrontend({ banner }: ReplitHeroProps) {
  const heroImageUrl = banner?.imageUrl ?? null;
  const heroTitle    = banner?.title ?? null;
  const heroSub      = banner?.subtitle ?? `A full-service fitness centre for people who are done waiting for the right time. Find your pace. Build your standard.`;
  const heroBtn      = banner?.buttonText ?? "Start your membership";
  const heroBtnLink  = banner?.buttonLink ?? whatsappLink();

  const style = heroImageUrl
    ? ({ "--hero-image": `url(${heroImageUrl})` } as React.CSSProperties)
    : ({ "--hero-image": "linear-gradient(135deg,#0d1214 0%,#1a2424 100%)" } as React.CSSProperties);

  return (
    <section
      className="hero noise-overlay"
      id="top"
      aria-label={`${site.name} introduction`}
      style={style}
    >
      <div className="hero-content">
        <div className="hero-kicker eyebrow">
          {site.hero.kicker} · Est. {site.established}
        </div>

        <h1>
          {heroTitle ? (
            <>
              {heroTitle.split(" ").slice(0, -1).join(" ")}
              <br />
              <em>{heroTitle.split(" ").slice(-1)[0]}</em>
            </>
          ) : (
            <>
              {site.hero.title.split(" ").slice(0, -1).join(" ")}<br /><em>{site.hero.title.split(" ").slice(-1)[0]}</em>
            </>
          )}
        </h1>

        <p className="hero-intro">{heroSub}</p>

        <div className="hero-actions">
          <Link
            href={heroBtnLink}
            target={heroBtnLink.startsWith("http") ? "_blank" : undefined}
            rel={heroBtnLink.startsWith("http") ? "noreferrer" : undefined}
            className="button-primary"
          >
            {heroBtn}
          </Link>
          <Link href="#services" className="button-outline">
            Explore the floor
          </Link>
        </div>
      </div>

      <div className="hero-side-note">{site.hero.sideNote}</div>
      <div className="scroll-cue">
        <span aria-hidden="true" />
        Scroll to explore
      </div>
    </section>
  );
}
