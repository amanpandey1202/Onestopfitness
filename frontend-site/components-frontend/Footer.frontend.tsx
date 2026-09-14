import Link from "next/link";
import { site, whatsappLink, brandParts, copyrightLine } from "@/data/site";
import Icon from "./Icons.frontend";

export default function FooterFrontend() {
  const wa = whatsappLink();

  return (
    <footer className="site-footer">
      <div className="container-wide">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link href="/#top" className="brand-lockup" style={{ textDecoration: "none" }}>
              <span className="brand-mark">{brandParts().word1.charAt(0)}</span>
              <span>
                <span className="brand-word">{brandParts().word1} {brandParts().word2}</span>
                <span className="brand-sub">{site.subtitle}</span>
              </span>
            </Link>
            <p>Full-service fitness for people who choose to show up. Building stronger days in {site.city} since {site.established}.</p>
            <Link href={wa} target="_blank" rel="noreferrer" className="footer-cta">
              Start your membership
              <Icon name="arrowRight" className="footer-cta-icon" />
            </Link>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/#why-us">{site.sections.whyUs}</Link>
            <Link href="/services">Services</Link>
            <Link href="/#classes">Group classes</Link>
            <Link href="/pricing">Memberships</Link>
            <Link href="/gallery">{site.sections.gallery}</Link>
          </div>

          {/* Visit */}
          <div className="footer-col">
            <h4>Visit</h4>
            <Link href="/contact">Location</Link>
            <Link href="/faq">FAQs</Link>
            <a href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link href="/register">Join / Register</Link>
            <Link href="/login">Member Login</Link>
          </div>

          {/* Social */}
          <div className="footer-col">
            <h4>Follow the work</h4>
            {site.instagram && (
              <a className="footer-link-icon" href={site.instagram} target="_blank" rel="noreferrer">
                <Icon name="instagram" className="footer-link-ic" /> {site.instagramHandle}
              </a>
            )}
            {site.mapsUrl && (
              <a className="footer-link-icon" href={site.mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" className="footer-link-ic" /> Google Maps
              </a>
            )}
            {site.facebook && (
              <a className="footer-link-icon" href={site.facebook} target="_blank" rel="noreferrer">
                <Icon name="facebook" className="footer-link-ic" /> Facebook
              </a>
            )}
            {!site.facebook && (
              <a className="footer-link-icon" href={wa} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" className="footer-link-ic" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>{copyrightLine()}</span>
          <span>{site.tagline}.</span>
        </div>
      </div>
    </footer>
  );
}
