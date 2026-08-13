/**
 * Single source of truth for business details.
 * Edit these values to update the whole site.
 */
export const site = {
  name: "ONE STOP FITNESS",
  tagline: "BE YOUR BEST",
  established: 2002,
  mission: "Aiming for a fitter world",

  // Contact
  phoneDisplay: "+91 92369 58881",
  phoneRaw: "09236958881",
  whatsappNumber: "919236958881",
  defaultWhatsAppMessage:
    "Hi ONE STOP FITNESS, I'm interested in joining the gym. Please share pricing details.",
  address:
    "Sheela Garden, 356/KC426 A, Alamnagar, Rajajipuram, Lucknow, Uttar Pradesh 226017",
  mapsUrl: "https://maps.app.goo.gl/amZhxaFBhXKka9xZ6",
  mapsEmbed:
    "https://www.google.com/maps?q=Sheela%20Garden%2C%20Alamnagar%2C%20Rajajipuram%2C%20Lucknow%2C%20Uttar%20Pradesh%20226017&z=15&output=embed",
  hours: "Monday – Saturday · 6:00 AM – 10:00 PM",
  email: null as string | null, // add later once the owner has one

  // Socials
  instagram: "https://instagram.com/1onestopacademyin",
  instagramHandle: "@1onestopacademyin",
  ownerInstagram: "@deepakindia",
  facebook: null as string | null,
};

/** Builds a WhatsApp deep-link with a custom pre-filled message. */
export function whatsappLink(message?: string): string {
  const text = message ?? site.defaultWhatsAppMessage;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
