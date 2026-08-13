import Link from "next/link";
import { site, whatsappLink } from "@/data/site";

export default function FooterFrontend() {
  const year = new Date().getFullYear();
  const wa   = whatsappLink();

  return (
    <footer className="site-footer">
      <div className="container-wide">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link href="/frontend#top" className="brand-lockup" style={{ textDecoration: "none" }}>
              <span className="brand-mark">O</span>
              <span>
                <span className="brand-word">ONE STOP</span>
                <span className="brand-sub">FITNESS CENTER · LUCKNOW</span>
              </span>
            </Link>
            <p>Full-service fitness for people who choose to show up. Building stronger days in Lucknow since {site.established}.</p>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/frontend#why-us">Why One Stop</Link>
            <Link href="/frontend#services">Services</Link>
            <Link href="/frontend#classes">Group classes</Link>
            <Link href="/frontend#plans">Memberships</Link>
          </div>

          {/* Visit */}
          <div className="footer-col">
            <h4>Visit</h4>
            <Link href="/frontend#contact">Location</Link>
            <Link href="/frontend#faq">FAQs</Link>
            <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link href="/login">Member Login</Link>
          </div>

          {/* Social */}
          <div className="footer-col">
            <h4>Follow the work</h4>
            {site.instagram && (
              <a href={site.instagram} target="_blank" rel="noreferrer">
                📸 Instagram {site.instagramHandle}
              </a>
            )}
            {site.mapsUrl && (
              <a href={site.mapsUrl} target="_blank" rel="noreferrer">
                📍 Google Maps
              </a>
            )}
            {site.facebook && (
              <a href={site.facebook} target="_blank" rel="noreferrer">
                👤 Facebook
              </a>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} One Stop Fitness Center · {site.address.split(",")[2]?.trim()}</span>
          <span>Be your best.</span>
        </div>
      </div>
    </footer>
  );
}
