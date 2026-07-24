import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Upstash Redis-backed Distributed Rate Limiter.
 *
 * Replaces the previous in-memory Map implementation which was scoped to a
 * single process instance and would be bypassed entirely in multi-instance
 * (serverless / Vercel Edge) deployments.
 *
 * This implementation uses Upstash's sliding window algorithm — accurate
 * across all instances and all regions simultaneously.
 *
 * Usage:
 *   const { allowed, remaining, resetTime } = await checkRateLimit(identifier, limit, windowMs);
 */

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        '[rate-limiter] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables.'
      );
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

/**
 * Returns (or creates) a cached Ratelimit instance for the given limit/window combination.
 * Caches by a key so we don't create a new Ratelimit object on every request.
 */
function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}_${windowMs}`;
  if (!limiters.has(cacheKey)) {
    limiters.set(
      cacheKey,
      new Ratelimit({
        redis: getRedis(),
        // Sliding window: accurate, no burst artifacts
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        analytics: false,
        prefix: 'resturant_rl',
      })
    );
  }
  return limiters.get(cacheKey)!;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp (ms) when the window resets
}

/**
 * Checks the rate limit for a given identifier using Upstash Redis sliding window.
 *
 * @param identifier - Unique key for the rate limit bucket (e.g. `"order_127.0.0.1"`)
 * @param limit - Max number of requests allowed within the window
 * @param windowMs - Window duration in milliseconds (default: 60000 = 1 minute)
 * @returns `{ allowed, remaining, resetTime }` — throws if Redis is unreachable
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetTime: result.reset, // already a Unix timestamp in ms from Upstash
  };
}
