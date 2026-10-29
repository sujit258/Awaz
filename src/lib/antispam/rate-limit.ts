// In-memory sliding-window rate limiter for API routes and form submissions
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 3600_000);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Checks and updates rate limits for a given identifier (e.g. IP or userId + action).
 * @param identifier Unique key (e.g. `report:user-123` or `auth:192.168.1.1`)
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetMs: number }
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) ?? { timestamps: [] };

  // Filter timestamps within window
  const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0];
    const resetMs = windowMs - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  activeTimestamps.push(now);
  rateLimitMap.set(identifier, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: limit - activeTimestamps.length,
    resetMs: windowMs,
  };
}
