import type { Metadata } from "next";
import "./frontend.css";
import HeaderFrontend from "@/components-frontend/Header.frontend";
import FooterFrontend from "@/components-frontend/Footer.frontend";
import WhatsAppFloatFrontend from "@/components-frontend/WhatsAppFloat.frontend";
import ScrollChrome from "@/components/ScrollChrome";

export const metadata: Metadata = {
  title: "ONE STOP FITNESS — Lucknow's #1 Gym | Be Your Best",
  description:
    "Cardio, Weight Training, Martial Arts, Personal Training & group classes in Rajajipuram, Lucknow. Join ONE STOP FITNESS and Be Your Best.",
  keywords: [
    "gym in Lucknow",
    "ONE STOP FITNESS",
    "fitness center Lucknow",
    "cardio",
    "weight training",
    "martial arts",
    "personal training",
    "Rajajipuram gym",
  ],
  openGraph: {
    title: "ONE STOP FITNESS — Be Your Best",
    description:
      "Lucknow's premium fitness center. Cardio, Weight Training, Martial Arts, Personal Training. Since 2002.",
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
