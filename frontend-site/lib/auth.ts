import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE_DAYS } from "@/lib/constants";

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
 */
export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

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
