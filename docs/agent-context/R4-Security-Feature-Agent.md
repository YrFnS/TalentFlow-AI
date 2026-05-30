# Task R4 - Security Feature Agent: Rate Limiting System Improvements

## Summary
Improved the rate limiting system by eliminating the shared 'unknown' bucket fallback, adding per-user rate limit keys, detailed configuration export, standard rate limit headers, and an admin monitoring endpoint.

## Changes Made

### 1. `/src/lib/security/rate-limiter.ts` - Complete rewrite
- **Eliminated 'unknown' fallback**: `defaultKeyGenerator` replaced with `getRateLimitKey()` that uses a priority chain: User ID > IP address > User-Agent+Accept-Language hash > fallback marker
- **Added `simpleHash()` function**: Edge Runtime-compatible hash (no Node.js `crypto` dependency) for generating stable fingerprints from User-Agent + Accept-Language
- **Added `getRateLimitKey(request, userId?)`**: Exportable key generation function supporting authenticated user IDs
- **Added `getRateLimitKeyWithSession(request, session?)`**: Convenience wrapper for API route handlers with session context
- **Added `RATE_LIMIT_CONFIG`**: Detailed configuration export with per-endpoint limits for auth, api, ai, and strict categories
- **Added `checkWithKey(key)` method**: Allows middleware to pass pre-computed user-aware keys
- **Added `getStats()` method**: Returns totalKeys, totalRequests, windowMs, maxRequests, topKeys for admin monitoring
- **Added `getAllRateLimiterStats()`**: Aggregates stats from all 4 rate limiters (auth, api, ai, strict)
- **Added `key` field to `RateLimitResult`**: Tracks which key was used for the check
- **Rate limit headers**: `withRateLimit()` already added X-RateLimit-Limit/Remaining/Reset headers (no changes needed)

### 2. `/src/lib/security/index.ts` - Updated exports
- **Added exports**: `getRateLimitKey`, `getRateLimitKeyWithSession`, `getAllRateLimiterStats`, `RATE_LIMIT_CONFIG`
- **Added `import { createHash } from 'crypto'`**: For `getClientIp` fingerprint fallback
- **Updated `getClientIp()`**: No longer returns 'unknown'. Falls back to User-Agent+Accept-Language hash (`anon-{hash}`) or `anon-no-headers`

### 3. `/src/middleware.ts` - Improved rate limiting
- **Added `simpleHash()` function**: Edge Runtime-compatible hash for key generation
- **Added `getRateLimitKeyFromRequest()`**: Priority: JWT user ID > IP > UA fingerprint > fallback
- **Uses `limiter.checkWithKey(rateLimitKey)`**: Passes user-aware key instead of relying on default key generator
- **Added JWT token extraction**: Attempts to get user ID from `getToken()` before rate limit check
- **Added `X-RateLimit-Limit` header**: Now included in all rate-limited responses (was missing before)

### 4. `/src/lib/security/auth-logger.ts` - Updated getClientIp
- **Updated `getClientIp(req)`**: No longer returns 'unknown'. Uses same UA+lang fingerprint fallback.

### 5. `/src/lib/security/config.ts` - Updated security config
- **Added `keyStrategy`**: Documents the priority chain for rate limit keys
- **Added `noSharedBuckets: true`**: Documents that no shared 'unknown' bucket exists

### 6. `/src/app/api/jobs/[id]/quick-apply/route.ts` - Updated getClientIp
- **Updated local `getClientIp()`**: No longer returns 'unknown'. Uses UA+lang fingerprint fallback.

### 7. `/src/app/api/admin/rate-limits/route.ts` - New endpoint
- **GET `/api/admin/rate-limits`**: Admin-only endpoint that returns:
  - Current rate limit configuration (all 4 categories with per-endpoint details)
  - Live usage stats per limiter (totalKeys, totalRequests, utilization %, top 20 keys)
  - Key strategy documentation (priority chain explanation)
  - Human-readable time windows (minutes, hours, days)
- **Requires admin authentication** via `requireAdmin()`

## Key Design Decisions

1. **Edge Runtime compatibility**: Used `simpleHash()` (bit-shift based) instead of `crypto.createHash('sha256')` in middleware and rate-limiter default key generator, since Edge Runtime doesn't support Node.js `crypto` module.

2. **`checkWithKey()` method**: Added to RateLimiter class so middleware can pass pre-computed keys (with JWT user ID) without modifying the class's default key generator.

3. **Fingerprint stability**: The simpleHash function produces deterministic output for the same input, ensuring the same browser gets the same rate limit bucket across requests.

4. **Backward compatibility**: All existing API routes that use `checkRateLimit()` or `withRateLimit()` continue to work unchanged. The `getClientIp()` function still returns IP addresses when available, just with better fallbacks.

## QA Results
- Lint: **Clean** with zero errors ✅
- Dev server: Running normally (pre-existing nonce.ts Edge Runtime warning is unrelated) ✅
- Admin rate-limits endpoint: Returns 401 (authentication required) as expected ✅
- No more 'unknown' fallback anywhere in the codebase ✅
