// Small in-memory limiter for public forms. It resets when the server restarts,
// which is fine for keeping casual bots and double submits out.

const hits = new Map<string, number[]>();

export function rateLimited(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
