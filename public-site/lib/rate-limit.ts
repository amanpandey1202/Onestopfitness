// Simple in-memory sliding-window rate limiter.
// Suitable for a single server instance / local development.
// For distributed deployments, move this to Redis.

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
