import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_DAYS,
  SESSION_MAX_AGE_HOURS,
} from "@/lib/constants";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 min
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Password hashing — bcrypt (one-way, salted). We never store plaintext.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a DB-backed session and sets the HTTP-only cookie.
 * Cookie is httpOnly + SameSite=Lax (+ Secure in production) so it can't be
 * read by JS and is not sent cross-site.
 *
 * `rememberMe=false` shortens the session to a few hours (browser session
 * anti-persistence); `rememberMe=true` persists for 30 days.
 */
export async function createSession(userId: string, rememberMe = true): Promise<void> {
  const ttlMs = rememberMe
    ? SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000  // days
    : SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;     // hours
  const expiresAt = new Date(Date.now() + ttlMs);
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    store.delete(SESSION_COOKIE);
  }
}

/**
 * Resolves the authenticated user from the session cookie.
 * Returns null when unauthenticated, expired, or the user is inactive.
 */
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  if (!session.user.isActive) return null;

  return session.user;
}

/** Generates a one-time random token (hex) for reset/verify links. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Sets (or clears) the user's password-reset token with an expiry.
 * `token=null` clears it.
 */
export async function setResetToken(userId: string, token: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      resetToken: token,
      resetTokenExpires: token ? new Date(Date.now() + RESET_TOKEN_TTL_MS) : null,
    },
  });
}

/**
 * Sets (or clears) the user's email-verification token with an expiry.
 * `token=null` clears it. Uses its own columns so it never collides with a
 * pending password-reset token.
 */
export async function setVerifyToken(userId: string, token: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      verifyToken: token,
      verifyTokenExpires: token ? new Date(Date.now() + VERIFY_TOKEN_TTL_MS) : null,
    },
  });
}
