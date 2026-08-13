import { z } from "zod";

// Parses optional date strings from admin forms into a real Date (or null).
const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });

const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === "" ? null : v));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: optionalString,
  password: z.string().min(8).max(128),
  fitnessGoal: optionalString,
});

// ---------------------------------------------------------------------------
// Membership plans
// ---------------------------------------------------------------------------

export const planSchema = z.object({
  name: z.string().min(2).max(80),
  description: optionalString,
  price: z.number().int().min(0).max(100000),
  durationDays: z.number().int().min(1).max(3650).default(30),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Members (admin)
// ---------------------------------------------------------------------------

export const memberCreateSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: optionalString,
  password: z.string().min(8).max(128),
  fitnessGoal: optionalString,
  planId: optionalString,
  notes: optionalString,
  joiningDate: optionalDate,
  alternatePhone: optionalString,
  aadhaarNumber: optionalString,
  address: optionalString,
  parentName: optionalString,
  parentPhone: optionalString,
});

export const memberUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: optionalString,
  fitnessGoal: optionalString,
  notes: optionalString,
  isActive: z.boolean().optional(),
  joiningDate: optionalDate,
  alternatePhone: optionalString,
  aadhaarNumber: optionalString,
  address: optionalString,
  parentName: optionalString,
  parentPhone: optionalString,
});

// ---------------------------------------------------------------------------
// Trainers (admin)
// ---------------------------------------------------------------------------

export const trainerCreateSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: optionalString,
  password: z.string().min(8).max(128),
  specialization: z.string().min(2).max(120),
  bio: optionalString,
  experience: z.number().int().min(0).max(100).optional(),
  instagram: optionalString,
  founderNote: optionalString,
  founderTitles: z.array(z.string()).optional(),
  isFounder: z.boolean().optional(),
});

export const trainerUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: optionalString,
  specialization: z.string().min(2).max(120).optional(),
  bio: optionalString,
  experience: z.number().int().min(0).max(100).optional(),
  instagram: optionalString,
  isActive: z.boolean().optional(),
  profileImageUrl: optionalString,
  founderNote: optionalString,
  founderTitles: z.array(z.string()).optional(),
  isFounder: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Testimonials (admin)
// ---------------------------------------------------------------------------

export const testimonialSchema = z.object({
  name: z.string().min(1).max(80),
  role: optionalString,
  quote: z.string().min(3).max(1000),
  imageUrl: optionalString,
  isPublished: z.boolean().default(true),
});

export const testimonialUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: optionalString,
  quote: z.string().min(3).max(1000).optional(),
  imageUrl: optionalString,
  isPublished: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// CMS content
// ---------------------------------------------------------------------------

export const galleryCreateSchema = z.object({
  title: z.string().min(2).max(120),
  description: optionalString,
  imageUrl: z.string().min(1),
  mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  storagePublicId: z.string().optional(),
  isPublished: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: optionalString,
  imageUrl: optionalString,
  buttonText: optionalString,
  buttonLink: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  isPublished: z.boolean().default(true),
});

export const offerSchema = z.object({
  title: z.string().min(2).max(120),
  description: optionalString,
  discountValue: z.number().int().min(0).optional(),
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  imageUrl: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  isActive: z.boolean().default(true),
});

export const competitionSchema = z.object({
  title: z.string().min(2).max(120),
  description: optionalString,
  bannerUrl: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  maxParticipants: z.number().int().min(1).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(2000),
  imageUrl: optionalString,
  expiresAt: optionalDate,
  isPublished: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Partial update schemas (used by PATCH — no defaults applied on missing keys)
// ---------------------------------------------------------------------------

const optionalBool = z.boolean().optional();

export const planUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: optionalString,
  price: z.number().int().min(0).max(100000).optional(),
  durationDays: z.number().int().min(1).max(3650).optional(),
  features: z.array(z.string()).optional(),
  isActive: optionalBool,
});

export const galleryUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: optionalString,
  imageUrl: optionalString,
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  isPublished: optionalBool,
});

export const bannerUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  subtitle: optionalString,
  imageUrl: optionalString,
  buttonText: optionalString,
  buttonLink: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  isPublished: optionalBool,
});

export const offerUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: optionalString,
  discountValue: z.number().int().min(0).optional(),
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  imageUrl: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  isActive: optionalBool,
});

export const competitionUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: optionalString,
  bannerUrl: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  maxParticipants: z.number().int().min(1).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export const announcementUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  body: z.string().min(2).max(2000).optional(),
  imageUrl: optionalString,
  expiresAt: optionalDate,
  isPublished: optionalBool,
});
