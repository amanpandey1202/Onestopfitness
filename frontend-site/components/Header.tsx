"use client";

import Link from "next/link";
import { brandParts } from "@/data/site";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur-xl">
      {/* thin lime accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gym-lime/70 to-transparent" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gym-lime/60 bg-gym-lime/10 text-gym-lime shadow-[0_0_18px_rgba(154,217,1,0.35)] transition group-hover:shadow-[0_0_28px_rgba(154,217,1,0.6)]">
            <Icon name="dumbbell" className="h-5 w-5" />
          </span>
          <span className="font-anton text-lg uppercase tracking-wide text-white">
            {brandParts().word1}<span className="glow-lime">&nbsp;{brandParts().word2}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-[0.8rem] font-semibold uppercase tracking-[0.12em]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="btn btn-ghost !px-4 !py-2.5 text-xs">
            Login
          </Link>
          <Link href="/contact" className="btn btn-primary !px-5 !py-2.5 text-xs">
            Join Now
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/12 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-[#0c0c0c] px-4 pb-5 pt-2 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/85 transition hover:text-gym-lime"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex gap-3">
            <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost flex-1 !px-4 text-xs">
              Login
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary flex-1 !px-4 text-xs">
              Join Now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
