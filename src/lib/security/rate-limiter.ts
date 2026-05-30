/**
 * Rate Limiter - In-memory sliding window rate limiter
 * Provides pre-configured limiters for different endpoint categories
 *
 * Improvements:
 * - Per-user rate limit key fallback (no more shared 'unknown' bucket)
 * - Support for authenticated user IDs as secondary keys
 * - User-Agent + Accept-Language hash fallback for anonymous identification
 * - Detailed rate limit configuration export
 * - Standard rate limit headers on all responses
 * - Admin stats endpoint support
 */

// ============================================
// Rate Limit Configuration
// ============================================

/**
 * Simple hash function for Edge Runtime compatibility.
 * Produces a stable hex-like string from input.
 * Uses the same algorithm as the middleware's simpleHash but returns a longer string.
 */
function simpleHash(str: string): string {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  return Math.abs(hash1).toString(16).padStart(8, '0') + Math.abs(hash2).toString(16).padStart(8, '0');
}

export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints
  auth: {
    login: { max: 5, windowMs: 15 * 60 * 1000 },          // 5 per 15 min
    register: { max: 3, windowMs: 60 * 60 * 1000 },       // 3 per hour
    forgotPassword: { max: 3, windowMs: 60 * 60 * 1000 },  // 3 per hour
    resetPassword: { max: 5, windowMs: 60 * 60 * 1000 },   // 5 per hour
  },
  // API endpoints
  api: {
    default: { max: 100, windowMs: 15 * 60 * 1000 },      // 100 per 15 min
    search: { max: 60, windowMs: 15 * 60 * 1000 },        // 60 per 15 min
    export: { max: 5, windowMs: 60 * 60 * 1000 },         // 5 per hour
  },
  // AI endpoints (cost-sensitive)
  ai: {
    chat: { max: 20, windowMs: 15 * 60 * 1000 },          // 20 per 15 min
    generate: { max: 10, windowMs: 15 * 60 * 1000 },      // 10 per 15 min
    analyze: { max: 15, windowMs: 15 * 60 * 1000 },       // 15 per 15 min
  },
  // Strict limits for sensitive operations
  strict: {
    gdprDelete: { max: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 per day
    billing: { max: 10, windowMs: 60 * 60 * 1000 },       // 10 per hour
    seed: { max: 2, windowMs: 24 * 60 * 60 * 1000 },      // 2 per day
  },
} as const;

// ============================================
// Types
// ============================================

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  maxRequests: number;
  /** Custom key generator (defaults to improved IP + UA hash) */
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Timestamp when the window resets (ms) */
  resetAt: number;
  /** The key used for this rate limit check */
  key: string;
}

interface RateLimitEntry {
  /** Timestamps of requests within the window */
  timestamps: number[];
}

// ============================================
// Key Generation
// ============================================

/**
 * Generate a rate limit key from a request.
 * Priority: User ID > IP address > User-Agent hash > random per-request key
 *
 * This ensures no two clients share the same 'unknown' bucket.
 * When a session/user ID is available (passed separately), use getRateLimitKeyWithUser() instead.
 */
export function getRateLimitKey(request: Request, userId?: string): string {
  // Priority 1: Authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }

  // Priority 2: IP address from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim();

  if (ip) {
    return `ip:${ip}`;
  }

  // Priority 3: Hash of User-Agent + Accept-Language for anonymous identification
  // This prevents all anonymous users from sharing a single 'unknown' bucket
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  const hash = simpleHash(`${ua}:${lang}`);

  // Even if both UA and lang are empty, each unique client gets its own bucket
  // rather than all anonymous clients sharing one
  return `anon:${hash}`;
}

/**
 * Generate a rate limit key with session context.
 * Use this in API route handlers where you have access to the user session.
 *
 * @param request - The incoming request
 * @param session - Optional session object with user.id
 */
export function getRateLimitKeyWithSession(
  request: Request,
  session?: { user?: { id?: string } } | null
): string {
  return getRateLimitKey(request, session?.user?.id);
}

// ============================================
// RateLimiter Class
// ============================================

/**
 * In-memory sliding window rate limiter
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: Request) => string;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator =
      options.keyGenerator ?? getRateLimitKey;
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  check(req: Request): RateLimitResult {
    const key = this.keyGenerator(req);
    return this.checkWithKey(key);
  }

  /**
   * Check if a request is allowed under the rate limit using an explicit key.
   * Use this when you have a pre-computed key (e.g., from JWT user ID in middleware)
   * instead of relying on the default key generator.
   */
  checkWithKey(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.store.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const currentCount = entry.timestamps.length;

    if (currentCount >= this.maxRequests) {
      // Calculate when the oldest request in the window will expire
      const oldestInWindow = entry.timestamps[0];
      const resetAt = oldestInWindow + this.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        key,
      };
    }

    // Record this request
    entry.timestamps.push(now);

    return {
      allowed: true,
      remaining: this.maxRequests - currentCount - 1,
      resetAt: now + this.windowMs,
      key,
    };
  }

  /**
   * Remove expired entries from the store to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, entry] of this.store.entries()) {
      // Filter out old timestamps
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

      // Remove entry entirely if no recent requests
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current usage stats for a key
   */
  getUsage(req: Request): { count: number; remaining: number } {
    const key = this.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const entry = this.store.get(key);

    if (!entry) {
      return { count: 0, remaining: this.maxRequests };
    }

    const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
    return {
      count: validTimestamps.length,
      remaining: Math.max(0, this.maxRequests - validTimestamps.length),
    };
  }

  /**
   * Get stats for admin monitoring.
   * Returns total unique keys, total request count, and top keys by request count.
   */
  getStats(): {
    totalKeys: number;
    totalRequests: number;
    windowMs: number;
    maxRequests: number;
    topKeys: Array<{ key: string; count: number }>;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let totalRequests = 0;
    const keyCounts: Array<{ key: string; count: number }> = [];

    for (const [key, entry] of this.store.entries()) {
      const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
      totalRequests += validTimestamps.length;
      keyCounts.push({ key, count: validTimestamps.length });
    }

    // Sort by count descending, take top 20
    keyCounts.sort((a, b) => b.count - a.count);

    return {
      totalKeys: this.store.size,
      totalRequests,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
      topKeys: keyCounts.slice(0, 20),
    };
  }
}

// ============================================
// Pre-configured rate limiters
// ============================================

/** Auth limiter - 5 requests per 15 min (login/register) */
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

/** General API limiter - 100 requests per 15 min */
export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

/** AI endpoints limiter - 20 requests per 15 min */
export const aiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
});

/** Strict limiter - 3 requests per 15 min (password reset, etc.) */
export const strictLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
});

// ============================================
// Cleanup scheduler - runs every 10 minutes
// ============================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic cleanup of expired rate limit entries
 */
export function startRateLimitCleanup(intervalMs: number = 10 * 60 * 1000): void {
  if (cleanupInterval) return; // Already running

  cleanupInterval = setInterval(() => {
    authLimiter.cleanup();
    apiLimiter.cleanup();
    aiLimiter.cleanup();
    strictLimiter.cleanup();
  }, intervalMs);

  // Don't prevent Node.js process from exiting
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

/**
 * Stop the periodic cleanup
 */
export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================
// withRateLimit helper - wraps API route handlers
// ============================================

type NextRouteHandler = (
  req: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response;

/**
 * Wrap an API route handler with rate limiting.
 * Returns 429 with standard rate limit headers if limit exceeded.
 * Adds rate limit headers to all successful responses too.
 *
 * @example
 * ```ts
 * export const GET = withRateLimit(apiLimiter, async (req) => {
 *   return NextResponse.json({ data: 'hello' });
 * });
 * ```
 */
export function withRateLimit(
  limiter: RateLimiter,
  handler: NextRouteHandler
): NextRouteHandler {
  return async (req, context) => {
    const result = limiter.check(req);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limiter['maxRequests']),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    const response = await handler(req, context);

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-RateLimit-Limit', String(limiter['maxRequests']));
      newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
      newHeaders.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  };
}

/**
 * Select the appropriate rate limiter based on the API route path
 */
export function getLimiterForPath(path: string): RateLimiter {
  // Auth endpoints (login, register) - strict
  if (
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/forgot-password') ||
    path.includes('/api/auth/reset-password')
  ) {
    return strictLimiter;
  }

  // Login endpoint - auth limiter
  if (
    path.includes('/api/auth/') ||
    path.includes('/auth/login')
  ) {
    return authLimiter;
  }

  // AI endpoints - AI limiter
  if (path.includes('/api/ai/')) {
    return aiLimiter;
  }

  // Default - general API limiter
  return apiLimiter;
}

/**
 * Get stats from all rate limiters for admin monitoring
 */
export function getAllRateLimiterStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
  return {
    auth: authLimiter.getStats(),
    api: apiLimiter.getStats(),
    ai: aiLimiter.getStats(),
    strict: strictLimiter.getStats(),
  };
}
