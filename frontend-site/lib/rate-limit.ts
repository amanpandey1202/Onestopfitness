import type { NextRequest } from "next/server";

// Simple in-memory sliding-window rate limiter.
// Suitable for a single server instance / local development.
// For a distributed (serverless / multiple instance) deployment this must move
// to a shared store (Redis, or Postgres) — in-memory buckets are per-instance.

const buckets = new Map<string, number[]>();
// Housekeeping: drop fully-expired buckets so the map doesn't grow forever.
const MAX_WINDOW_MS = 15 * 60 * 1000;

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  maybeSweep();
  return true;
}

/** Clears a rate-limit bucket (e.g. on a successful login). */
export function reset(key: string): void {
  buckets.delete(key);
}

// Occasionally remove buckets whose newest hit is older than the longest window,
// keeping memory bounded.
let lastSweep = 0;
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const newest = hits[hits.length - 1];
    if (newest === undefined || now - newest > MAX_WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

/**
 * Best-effort real client IP.
 *
 * On Vercel / behind a trusted proxy, the platform overwrites X-Forwarded-For,
 * so its LAST value is the original client IP and earlier entries may be
 * attacker-supplied. We take the last comma-separated segment. If no usable
 * header exists we fall back to the socket address passed in the headers.
 *
 * This is not a substitute for per-account throttling (which works even when an
 * attacker spoofs their IP), but it makes the per-IP limit far harder to bypass.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    // Trusted proxies append the original client IP last.
    return parts[parts.length - 1] ?? "unknown";
  }
  return (
    req.headers.get("x-real-ip") ||
    (req as NextRequest & { ip?: string }).ip ||
    "unknown"
  );
}
