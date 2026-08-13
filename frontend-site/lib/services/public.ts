import { CompetitionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Membership plan features are stored as a JSON string; parse into an array. */
export function parseFeatures(json: string): string[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function getActivePlans() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans.map((p) => ({ ...p, features: parseFeatures(p.features) }));
}

export async function getPublishedGallery(limit?: number) {
  return prisma.galleryImage.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getActiveOffers() {
  const now = new Date();
  return prisma.offer.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isPublished: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedCompetitions() {
  const now = new Date();
  return prisma.competition.findMany({
    where: {
      status: CompetitionStatus.PUBLISHED,
      OR: [{ endDate: { gte: now } }, { endDate: null }]
    },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { participants: true } } },
  });
}

export async function getCompetitionById(id: string) {
  return prisma.competition.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
}

/** Parses a stored JSON string array (e.g. plan features, founder titles). */
export function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export async function getPublishedTrainers() {
  const profiles = await prisma.trainerProfile.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { isFounder: "desc" },
  });
  return profiles.map((tp) => ({
    id: tp.id,
    name: tp.user.name,
    specialization: tp.specialization,
    bio: tp.bio,
    experience: tp.experience,
    profileImageUrl: tp.profileImageUrl,
    instagram: tp.instagram,
    isFounder: tp.isFounder,
    founderNote: tp.founderNote,
    founderTitles: parseStringArray(tp.founderTitles),
  }));
}

export async function getPublishedAnnouncements() {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      isPublished: true,
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: { publishAt: "desc" },
  });
}

export async function getPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });
}
