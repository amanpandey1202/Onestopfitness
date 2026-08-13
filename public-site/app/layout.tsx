import type { Metadata } from "next";
import { Anton, Poppins } from "next/font/google";
import "./globals.css";

// Premium type system (matches the reference design): Anton for big bold
// italic display headings, Poppins for clean body text. Applied app-wide.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
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
    <html lang="en" className={`${anton.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gym-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
