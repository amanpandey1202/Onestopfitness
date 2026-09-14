import type { Metadata } from "next";
import "./frontend.css";
import HeaderFrontend from "@/components-frontend/Header.frontend";
import FooterFrontend from "@/components-frontend/Footer.frontend";
import WhatsAppFloatFrontend from "@/components-frontend/WhatsAppFloat.frontend";
import ScrollChrome from "@/components/ScrollChrome";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: site.seo.title,
  description: site.seo.description,
  keywords: site.seo.keywords,
  openGraph: {
    title: site.seo.ogTitle,
    description: site.seo.ogDescription,
    type: "website",
  },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="frontend-root">
      <ScrollChrome />
      <HeaderFrontend />
      <main>{children}</main>
      <FooterFrontend />
      <WhatsAppFloatFrontend />
    </div>
  );
}
