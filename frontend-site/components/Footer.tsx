import Link from "next/link";
import { site } from "@/data/site";
import Icon from "./Icon";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gym-lime/50 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gym-lime/50 bg-gym-lime/10 text-gym-lime">
              <Icon name="dumbbell" className="h-5 w-5" />
            </span>
            <span className="font-anton text-lg uppercase tracking-wide text-white">
              ONE STOP<span className="glow-lime">&nbsp;FITNESS</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            {site.tagline}. Established {site.established}. {site.mission}.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-gym-lime">
            Since 2002 · Lucknow
          </p>
        </div>

        <div>
          <h4 className="font-anton text-sm uppercase tracking-[0.2em] text-white">
            Quick Links
          </h4>
          <ul className="mt-5 space-y-2.5 text-sm text-white/65">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2 transition hover:text-gym-lime"
                >
                  <span className="h-px w-3 bg-gym-lime/60" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-anton text-sm uppercase tracking-[0.2em] text-white">
            Contact
          </h4>
          <ul className="mt-5 space-y-3.5 text-sm text-white/65">
            <li className="flex items-start gap-3">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-gym-lime" />
              <span>{site.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Icon name="phone" className="h-4 w-4 shrink-0 text-gym-lime" />
              <a href={`tel:${site.phoneRaw}`} className="transition hover:text-gym-lime">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-gym-lime" />
              <span>{site.hours}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-anton text-sm uppercase tracking-[0.2em] text-white">
            Follow Us
          </h4>
          <ul className="mt-5 space-y-2.5 text-sm text-white/65">
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 transition hover:text-gym-lime"
              >
                <Icon name="instagram" className="h-4 w-4 text-gym-lime" />
                {site.instagramHandle}
              </a>
            </li>
            {site.facebook && (
              <li>
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 transition hover:text-gym-lime"
                >
                  <Icon name="facebook" className="h-4 w-4 text-gym-lime" />
                  Facebook
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs tracking-wide text-white/35">
        © {new Date().getFullYear()} {site.name} · All rights reserved · {site.tagline}
      </div>
    </footer>
  );
}
