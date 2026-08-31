import type { Metadata } from "next";
import { Anton, Barlow_Condensed, DM_Sans, Poppins, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${anton.variable} ${barlowCondensed.variable} ${dmSans.variable} ${poppins.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-screen bg-gym-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
