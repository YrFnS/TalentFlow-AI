/**
 * In-memory sliding-window rate limiting.
 *
 * The middleware provides a client key and, for credential callbacks, an
 * account-scoped key. Keeping account attempts separate prevents one office,
 * school, or CI runner behind a shared IP from blocking every user login.
 */

function simpleHash(str: string): string {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 &= hash1;
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 &= hash2;
  }
  return (
    Math.abs(hash1).toString(16).padStart(8, '0') +
    Math.abs(hash2).toString(16).padStart(8, '0')
  );
}

export const RATE_LIMIT_CONFIG = {
  auth: {
    login: { max: 5, windowMs: 15 * 60 * 1000 },
    spray: { max: 60, windowMs: 15 * 60 * 1000 },
    support: { max: 300, windowMs: 15 * 60 * 1000 },
    register: { max: 3, windowMs: 60 * 60 * 1000 },
    forgotPassword: { max: 3, windowMs: 60 * 60 * 1000 },
    resetPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  },
  api: {
    default: { max: 100, windowMs: 15 * 60 * 1000 },
    search: { max: 60, windowMs: 15 * 60 * 1000 },
    export: { max: 5, windowMs: 60 * 60 * 1000 },
  },
  ai: {
    chat: { max: 20, windowMs: 15 * 60 * 1000 },
    generate: { max: 10, windowMs: 15 * 60 * 1000 },
    analyze: { max: 15, windowMs: 15 * 60 * 1000 },
  },
  strict: {
    gdprDelete: { max: 3, windowMs: 24 * 60 * 60 * 1000 },
    billing: { max: 10, windowMs: 60 * 60 * 1000 },
    seed: { max: 2, windowMs: 24 * 60 * 60 * 1000 },
  },
} as const;

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  key: string;
}

interface RateLimitEntry {
  timestamps: number[];
}

export function getRateLimitKey(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim();
  if (ip) return `ip:${ip}`;

  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  return `anon:${simpleHash(`${ua}:${lang}`)}`;
}

export function getRateLimitKeyWithSession(
  request: Request,
  session?: { user?: { id?: string } } | null,
): string {
  return getRateLimitKey(request, session?.user?.id);
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: Request) => string;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.keyGenerator = options.keyGenerator ?? getRateLimitKey;
  }

  check(req: Request): RateLimitResult {
    return this.checkWithKey(this.keyGenerator(req));
  }

  checkWithKey(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const entry = this.store.get(key) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      this.store.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.timestamps[0] + this.windowMs,
        key,
      };
    }

    entry.timestamps.push(now);
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      resetAt: now + this.windowMs,
      key,
    };
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, entry] of this.store.entries()) {
      entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);
      if (entry.timestamps.length === 0) this.store.delete(key);
    }
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getUsage(req: Request): { count: number; remaining: number } {
    const key = this.keyGenerator(req);
    const now = Date.now();
    const entry = this.store.get(key);
    const count = entry
      ? entry.timestamps.filter((timestamp) => timestamp > now - this.windowMs).length
      : 0;

    return {
      count,
      remaining: Math.max(0, this.maxRequests - count),
    };
  }

  getStats(): {
    totalKeys: number;
    totalRequests: number;
    windowMs: number;
    maxRequests: number;
    topKeys: Array<{ key: string; count: number }>;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyCounts: Array<{ key: string; count: number }> = [];
    let totalRequests = 0;

    for (const [key, entry] of this.store.entries()) {
      const count = entry.timestamps.filter((timestamp) => timestamp > windowStart).length;
      totalRequests += count;
      keyCounts.push({ key, count });
    }

    keyCounts.sort((left, right) => right.count - left.count);

    return {
      totalKeys: this.store.size,
      totalRequests,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
      topKeys: keyCounts.slice(0, 20),
    };
  }
}

/** Five credential attempts per account/client pair every 15 minutes. */
export const authLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.auth.login.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.auth.login.max,
});

/** Broad protection against one client spraying many different accounts. */
export const authSprayLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.auth.spray.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.auth.spray.max,
});

/** NextAuth helper endpoints are read-heavy and should not consume API quota. */
export const authSupportLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.auth.support.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.auth.support.max,
});

export const apiLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.api.default.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.api.default.max,
});

export const aiLimiter = new RateLimiter({
  windowMs: RATE_LIMIT_CONFIG.ai.chat.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.ai.chat.max,
});

export const strictLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
});

const allLimiters = [
  authLimiter,
  authSprayLimiter,
  authSupportLimiter,
  apiLimiter,
  aiLimiter,
  strictLimiter,
];

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startRateLimitCleanup(
  intervalMs: number = 10 * 60 * 1000,
): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    for (const limiter of allLimiters) limiter.cleanup();
  }, intervalMs);

  if (
    cleanupInterval &&
    typeof cleanupInterval === 'object' &&
    'unref' in cleanupInterval
  ) {
    cleanupInterval.unref();
  }
}

export function stopRateLimitCleanup(): void {
  if (!cleanupInterval) return;
  clearInterval(cleanupInterval);
  cleanupInterval = null;
}

type NextRouteHandler = (
  req: Request,
  context?: { params: Promise<Record<string, string>> },
) => Promise<Response> | Response;

export function withRateLimit(
  limiter: RateLimiter,
  handler: NextRouteHandler,
): NextRouteHandler {
  return async (req, context) => {
    const result = limiter.check(req);

    if (!result.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000),
      );

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
        },
      );
    }

    const response = await handler(req, context);
    if (!(response instanceof Response)) return response;

    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(limiter['maxRequests']));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

export function getLimiterForPath(path: string): RateLimiter {
  if (
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/forgot-password') ||
    path.includes('/api/auth/reset-password')
  ) {
    return strictLimiter;
  }

  if (path.includes('/api/auth/callback/credentials')) {
    return authLimiter;
  }

  if (path.startsWith('/api/auth/')) {
    return authSupportLimiter;
  }

  if (path.includes('/api/ai/') || path.includes('/api/chatbot/')) {
    return aiLimiter;
  }

  return apiLimiter;
}

export function getAllRateLimiterStats(): Record<
  string,
  ReturnType<RateLimiter['getStats']>
> {
  return {
    auth: authLimiter.getStats(),
    authSpray: authSprayLimiter.getStats(),
    authSupport: authSupportLimiter.getStats(),
    api: apiLimiter.getStats(),
    ai: aiLimiter.getStats(),
    strict: strictLimiter.getStats(),
  };
}
