/**
 * =========================================================================
 * 🏢 GYM BRAND & WHITE-LABEL CONFIGURATION
 * =========================================================================
 * When selling this software to a new gym, THIS IS THE ONLY FILE YOU NEED
 * TO EDIT. Every page, email, WhatsApp message, QR code, receipt, and SEO
 * tag across the entire website and app reads from this single file.
 * =========================================================================
 */

// ── Extracted constants (used inside the site object itself) ────────────
const ESTABLISHED = 2025;

export const site = {
  // ── 1. BRAND IDENTITY ──────────────────────────────────────────────────
  name: "POWERHOUSE FITNESS",
  shortName: "PHF",
  tagline: "Train with champions.",
  subtitle: "Fitness Center · Lucknow",
  established: ESTABLISHED,
  mission:
    "To empower every individual to achieve their fitness goals through expert coaching, state-of-the-art facilities, and a supportive community.",

  // ── 2. FOUNDER / HEAD COACH ────────────────────────────────────────────
  ownerName: "AMAN PANDEY",
  ownerTitle: "Founder & Head Coach",
  ownerAchievements: "Mr. Lucknow 2014 · Mr. UP 2025",
  ownerInstagram: "@AMANOTIC",
  ownerSearchName: "aman", // used to find founder in trainer DB
  ownerFallbackBio:
    "Aman Pandey is a certified fitness coach and the founder of POWERHOUSE FITNESS. With over a decade of experience in personal training and bodybuilding, Aman has helped countless individuals transform their lives through fitness. His dedication to health and wellness has earned him recognition as Mr. Lucknow 2014 and Mr. UP 2025.",

  // ── 3. CONTACT & LOCATION ─────────────────────────────────────────────
  phoneDisplay: "+91 8400754341",
  phoneRaw: "08400754341",
  whatsappNumber: "918400754341",
  address:
    "E-BLOCK Rajajipuram, Lucknow, Uttar Pradesh 226017",
  addressShort: "Rajajipuram, Lucknow",
  city: "Lucknow",
  pincode: "226017",
  mapsUrl: "https://maps.app.goo.gl/amZhxaFBhXKka9xZ6",
  mapsEmbed:
    "https://www.google.com/maps?q=E-BLOCK%20Rajajipuram%2C%20Lucknow%2C%20Uttar%20Pradesh%20226017&z=15&output=embed",
  hours: "Monday – Saturday · 6:00 AM – 10:00 PM",
  email: "AMANPANDEY@GMAIL.COM" as string | null,
  domain: "AMANPANDEY8162@GMAIL.COM", // shown on receipts, emails

  // ── 4. OFFLINE UPI / QR PAYMENT DETAILS ────────────────────────────────
  payment: {
    upiId: "9236958881@upi",
    payeeName: "One Stop Fitness",
  },

  // ── 5. SOCIALS ─────────────────────────────────────────────────────────
  instagram: "https://instagram.com/AMANOTIC",
  instagramHandle: "@AMANOTIC",
  facebook: null as string | null,

  // ── 6. MEMBER CODES ────────────────────────────────────────────────────
  memberCodePrefix: "PHF", // generates OSF001, OSF002, etc.

  // ── 7. SEO METADATA ────────────────────────────────────────────────────
  seo: {
    title: "POWERHOUSE FITNESS — Lucknow's #1 Gym | Cardio · Weight Training · Martial Arts",
    description:
      "Cardio, Weight Training, Martial Arts, Personal Training & group classes in Rajajipuram, Lucknow. Join POWERHOUSE FITNESS and Be Your Best.",
    keywords: [
      "gym in Lucknow",
      "POWERHOUSE FITNESS",
      "fitness center Lucknow",
      "cardio",
      "weight training",
      "martial arts",
      "personal training",
      "Rajajipuram gym",
    ],
    ogTitle: "POWERHOUSE FITNESS — Be Your Best",
    ogDescription:
      "Lucknow's premium fitness center. Cardio, Weight Training, Martial Arts, Personal Training. Since 2015.",
  },

  // ── 8. WHATSAPP PRE-FILLED MESSAGES ────────────────────────────────────
  messages: {
    defaultLead: `Hi POWER HOUSE FITNESS, I'm interested in joining the gym. Please share pricing details.`,
    planInquiry: (planName: string, price: number, period: string) =>
      `Hi POWER HOUSE FITNESS, I'm interested in the ${planName} plan (₹${price} / ${period}). Please share the details.`,
    tourBooking: `Hi POWER HOUSE FITNESS, I'd like to book a facility tour.`,
    joinMessage: `Hi POWER HOUSE FITNESS, I'd like to join.`,
    testimonial: (message: string, name: string) =>
      `Hi POWER HOUSE FITNESS! I'd like to share my experience:\n\n"${message}"\n\n— ${name || "A member"}`,
    absentReminder: (name: string, days: number) =>
      `Hey ${name}! 💪 We've missed you at POWER HOUSE FITNESS — ${days} days since your last visit. Come back and let's keep the momentum going!`,
    expiryWarning: (name: string, planName: string, price: number, days: number) =>
      `Hey ${name}! ⏰ A quick reminder — your *${planName}* membership (₹${price.toLocaleString("en-IN")}) expires in *${Math.max(days, 0)} day${days === 1 ? "" : "s"}*.\n\nRenew now and don't break your streak. Talk to us at the front desk or reply here to continue!\n\nPOWER HOUSE FITNESS — Train Different. 💚`,
    expiredFollowup: (name: string, planName: string, price: number, daysAgo: number) =>
      `Hey ${name}! ⚠️ Your *${planName}* membership expired *${daysAgo} day${daysAgo === 1 ? "" : "s"} ago*.\n\nWe want you back! Renew at ₹${price.toLocaleString("en-IN")}/month and restart your fitness journey — no gap in your progress.\n\nPOWER HOUSE FITNESS is waiting for you. 💚`,
    engagementReach: (name: string, summary: string) =>
      `Hi ${name}, this is POWER HOUSE FITNESS. ${summary}. Can we help you get back on track?`,
    absenteeBroadcast: (name: string, daysAbsent: number) =>
      `Hey ${name}! 💪 We've noticed you haven't visited POWER HOUSE FITNESS in ${daysAbsent} days — the machines and trainers are missing you!\n\nYour fitness journey matters to us. Come back and let's get back on track together. We're here 6 days a week!\n\nSee you soon! 🔥`,
  },

  // ── 9. HOMEPAGE HERO CONTENT ───────────────────────────────────────────
  hero: {
    title: "Be your best.",
    subtitle: "Where showing up becomes a standard.",
    kicker: "Lucknow's training ground",
    sideNote: "Train with intent / Lucknow, India",
  },

  // ── 10. SECTION HEADINGS (Homepage) ────────────────────────────────────
  sections: {
    whyUs: "Why POWER HOUSE FITNESS?",
    gallery: "Inside POWER HOUSE FITNESS",
  },

  // ── 11. FAQ DATA ───────────────────────────────────────────────────────
  faqLocationQuestion: "Where is POWER HOUSE FITNESS located?",
  faqLocationAnswer:
    "We're at E-BLOCK, Alamnagar, Rajajipuram, Lucknow, Uttar Pradesh 226017. You can find us on the map on our Contact page.",

  // ── 12. AUTH PAGE ──────────────────────────────────────────────────────
  auth: {
    registerSubtitle: "Join POWER HOUSE FITNESS — start your transformation today.",
    loginKicker: "Lucknow's Premium Fitness Center",
    loginTagline: "Train with champions at POWER HOUSE FITNESS.",
    badges: [`Since ${ESTABLISHED}`, "7+ Programs", "Expert Coaches"],
  },

  // ── 13. ANDROID APP CONFIG ─────────────────────────────────────────────
  // Change these 5 values when selling to a new gym. Everything else auto-updates.
  app: {
    id: "com.powerhousefitness.members",        // Android package ID (no spaces)
    displayName: "Powerhouse Fitness",          // Name shown on Android launcher
    version: "1.0.0",                           // App version
    scheme: "powerhousefitness",               // Deep-link scheme (powerhousefitness://attendance)
    serverUrl: "https://onestopfitness-pink.vercel.app", // Live backend the app talks to
  },
};

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────────

/** The gym name split into two parts for styled logo rendering */
export function brandParts(): { word1: string; word2: string } {
  const parts = site.name.split(" ");
  // e.g. "POWER HOUSE FITNESS" → word1="POWER HOUSE", word2="FITNESS"
  const last = parts.pop() || "";
  return { word1: parts.join(" "), word2: last };
}

/** Builds a WhatsApp deep-link with a custom pre-filled message. */
export function whatsappLink(message?: string): string {
  const text = message ?? site.messages.defaultLead;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/** Builds a direct UPI payment link for GPay / PhonePe / Paytm */
export function upiPayLink(
  amount: number,
  note: string = "Gym Membership"
): string {
  const params = new URLSearchParams({
    pa: site.payment.upiId,
    pn: site.payment.payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

/** Copyright line: "© 2026 POWER HOUSE FITNESS · Lucknow" */
export function copyrightLine(): string {
  return `© ${new Date().getFullYear()} ${site.name} · ${site.city}`;
}

/** Footer tagline: "Since 2015 · Lucknow" */
export function establishedLine(): string {
  return `Since ${site.established} · ${site.city}`;
}

/** Years of operation: e.g. 24 */
export function yearsOfOperation(): number {
  return new Date().getFullYear() - site.established;
}
