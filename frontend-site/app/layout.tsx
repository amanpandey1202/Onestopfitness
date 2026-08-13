import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONE STOP FITNESS — Lucknow's #1 Gym | Be Your Best",
  description:
    "Cardio, Weight Training, Martial Arts, Personal Training & group classes in Rajajipuram, Lucknow. Join ONE STOP FITNESS and Be Your Best.",
  keywords: [
    "gym in Lucknow",
    "ONE STOP FITNESS",
    "fitness center",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gym-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
