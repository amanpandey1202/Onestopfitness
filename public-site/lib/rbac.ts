import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";

/** Thrown by auth guards and rendered as a clean HTTP response. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

/**
 * Backend authorization — the source of truth for access control.
 * Every protected API handler calls one of these guards; never trust the browser.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You don't have permission to do that");
  }
  return user;
}

export function requireAdmin() {
  return requireRole(Role.ADMIN);
}

export function requireMember() {
  return requireRole(Role.MEMBER);
}
