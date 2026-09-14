"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site, whatsappLink, brandParts } from "@/data/site";

// Inline SVG icons — no external dependency
const ArrowR = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
const MenuI  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
const CloseI = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

const links = [
  ["Why us",   "/#why-us"],
  ["Services", "/#services"],
  ["Plans",    "/#plans"],
  ["Gallery",  "/#gallery"],
  ["FAQ",      "/#faq"],
  ["Contact",  "/#contact"],
].map(([label, href]) => ({ label, href, id: href.split("#")[1] }));

export default function HeaderFrontend() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const wa = whatsappLink(site.messages.joinMessage);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = "";
      for (const { id } of links) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - 110 <= 0) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-nav${scrolled ? " site-nav-scrolled" : ""}`}>
      <div className="container-wide nav-inner">
        {/* Brand */}
        <Link href="/#top" className="brand-lockup" style={{ textDecoration: "none" }}>
          <span className="brand-mark">{brandParts().word1.charAt(0)}</span>
          <span>
            <span className="brand-word">{brandParts().word1} {brandParts().word2}</span>
            <span className="brand-sub">{site.subtitle}</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(({ label, href, id }) => (
            <Link key={href} href={href} className={active === id ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/login"
            style={{ color: "#aab2ad", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", padding: "0 6px", transition: "color .25s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#c8ff28")}
            onMouseLeave={e => (e.currentTarget.style.color = "#aab2ad")}
          >
            Login
          </Link>
          <a className="nav-cta" href={wa} target="_blank" rel="noreferrer">
            Join now <ArrowR />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="menu-trigger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <CloseI /> : <MenuI />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map(({ label, href, id }) => (
            <Link key={href} href={href} className={active === id ? "active" : ""} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <a href={wa} target="_blank" rel="noreferrer" className="button-primary">
            Join the movement <ArrowR />
          </a>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="button-outline"
            style={{ textAlign: "center" }}
          >
            Member Login
          </Link>
        </nav>
      )}
    </header>
  );
}
