"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0a]/95 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]" : "bg-[#0a0a0a]/80"
      }`}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gym-lime/70 to-transparent" />

      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 transition-all duration-300 ${
          scrolled ? "py-2.5" : "py-3.5"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className={`flex items-center justify-center rounded-md border border-gym-lime/60 bg-gym-lime/10 text-gym-lime shadow-[0_0_18px_rgba(154,217,1,0.35)] transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(154,217,1,0.6)] ${
              scrolled ? "h-8 w-8" : "h-9 w-9"
            }`}
          >
            <Icon name="dumbbell" className={`transition-all duration-300 ${scrolled ? "h-4 w-4" : "h-5 w-5"}`} />
          </span>
          <span className="font-anton text-lg uppercase tracking-wide text-white">
            ONE STOP<span className="glow-lime">&nbsp;FITNESS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link text-[0.8rem] font-semibold uppercase tracking-[0.12em] ${
                isActive(link.href) ? "text-white! after:w-full!" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="btn btn-ghost !px-4 !py-2.5 text-xs active:scale-95">
            Login
          </Link>
          <Link href="/contact" className="btn btn-primary !px-5 !py-2.5 text-xs active:scale-95">
            Join Now
          </Link>
        </div>

        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-md border border-white/12 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-[#0c0c0c] px-4 pb-5 pt-2 lg:hidden">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${0.03 * i}s` }}
              className={`r-enter flex items-center justify-between border-b border-white/5 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition hover:text-gym-lime ${
                isActive(link.href) ? "text-gym-lime" : "text-white/85"
              }`}
            >
              {link.label}
              {isActive(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-gym-lime shadow-[0_0_8px_rgba(154,217,1,0.9)]" />}
            </Link>
          ))}
          <div className="mt-4 flex gap-3">
            <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost flex-1 !px-4 text-xs active:scale-95">
              Login
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary flex-1 !px-4 text-xs active:scale-95">
              Join Now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}