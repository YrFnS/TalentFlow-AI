/**
 * Security Middleware - Central export for all security utilities
 */

// Run environment variable validation on import
import './env';
import { createHash } from 'crypto';

// ============================================
// Rate Limiter
// ============================================
export {
  RateLimiter,
  authLimiter,
  apiLimiter,
  aiLimiter,
  strictLimiter,
  withRateLimit,
  getLimiterForPath,
  getRateLimitKey,
  getRateLimitKeyWithSession,
  getAllRateLimiterStats,
  RATE_LIMIT_CONFIG,
  startRateLimitCleanup,
  stopRateLimitCleanup,
} from './rate-limiter';

export type {
  RateLimitOptions,
  RateLimitResult,
} from './rate-limiter';

// ============================================
// CSP Nonce Generation
// ============================================
export {
  generateNonce,
  invalidateNonce,
  getNonceRotationInterval,
} from './nonce';

// ============================================
// Security Headers
// ============================================
export {
  getSecurityHeaders,
  getCORSHeaders,
  getCORSHeadersForRequest,
  applySecurityHeaders,
  applyCORSHeaders,
  applyAllSecurityHeaders,
  createCORSPreflightResponse,
} from './headers';

// ============================================
// Input Sanitization (comprehensive)
// ============================================
export {
  sanitizeString as sanitizeStringFull,
  sanitizeObject,
  sanitizeEmail as sanitizeEmailFull,
  isValidUUID,
  validatePagination,
  hasSQLInjection,
  hasXSSPattern,
  validateFileUpload,
  validateRequestBody,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
} from './sanitizer';

// ============================================
// Input Sanitization (legacy - used by existing routes)
// ============================================
export {
  stripHtml,
  sanitizeName,
  sanitizeEmail,
  validatePasswordStrength,
  validateName,
  sanitizeString,
} from './input-sanitizer';

// ============================================
// Auth Event Logger
// ============================================
export {
  logAuthEvent,
  getUserAgent,
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logRegister,
  logPasswordChange,
  logSocialLogin,
  logSuspiciousActivity,
  logAccountLocked,
  getRecentFailedAttempts,
} from './auth-logger';

export type {
  AuthEventType,
  AuthLogEntry,
} from './auth-logger';

// ============================================
// Brute Force Protection
// ============================================
export {
  checkLoginAttempt,
  recordFailedAttempt,
  recordSuccessfulLogin,
  getBruteForceStatus,
  unlock as unlockBruteForce,
  startBruteForceCleanup,
  stopBruteForceCleanup,
} from './brute-force';

export type {
  BruteForceCheck,
} from './brute-force';

// ============================================
// Encryption
// ============================================
export {
  encrypt,
  decrypt,
  isEncrypted,
} from './encryption';

// ============================================
// API Key Protection
// ============================================
export {
  encryptApiKey,
  decryptApiKey,
} from './api-key-protect';

// ============================================
// Security Config
// ============================================
export { SECURITY_CONFIG } from './config';

// ============================================
// CSRF Protection
// ============================================
export {
  generateCsrfToken,
  validateCsrfToken,
  csrfCheck,
  CSRF_COOKIE_NAME as CSRF_COOKIE_NAME_FULL,
  CSRF_HEADER_NAME as CSRF_HEADER_NAME_FULL,
} from './csrf';

// Edge Runtime compatible CSRF functions (for middleware)
export {
  validateCsrfTokenValues,
  isCsrfExemptPath,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from './csrf-edge';

// ============================================
// Error Handler
// ============================================
export {
  sanitizeErrorMessage,
  createSafeErrorResponse,
  handlePrismaError,
  isPrismaError,
  handleApiError,
} from './error-handler';

// ============================================
// Backward-compatible utilities
// ============================================

/**
 * Get client IP from request headers
 * Backward-compatible: accepts Headers object directly
 *
 * Improved: When no IP headers are present, generates a fingerprint from
 * User-Agent + Accept-Language instead of returning 'unknown'.
 * This prevents all anonymous clients from sharing a single rate limit bucket.
 */
export function getClientIp(headersOrRequest: Headers | Request): string {
  const headers = headersOrRequest instanceof Headers
    ? headersOrRequest
    : headersOrRequest.headers;

  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback: generate a stable fingerprint from User-Agent + Accept-Language
  // This is more unique than 'unknown' while still being privacy-respecting
  const ua = headers.get('user-agent') || '';
  const lang = headers.get('accept-language') || '';
  if (ua || lang) {
    const hash = createHash('sha256')
      .update(`${ua}:${lang}`)
      .digest('hex')
      .substring(0, 12);
    return `anon-${hash}`;
  }

  // Last resort: return a marker that at least indicates no identification
  // This should be extremely rare in production (every request has a UA)
  return 'anon-no-headers';
}

/**
 * Rate limit configurations for specific endpoints
 * Backward-compatible with existing API route imports
 */
export const RATE_LIMITS = {
  REGISTER: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  EXPORT: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  SEED: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  AI: { windowMs: 15 * 60 * 1000, maxRequests: 20 },
  API: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  PASSWORD_RESET: { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  STRICT: { windowMs: 15 * 60 * 1000, maxRequests: 3 },
} as const;

/**
 * In-memory store for backward-compatible checkRateLimit function
 */
const rateLimitStore: Map<string, { count: number; startTime: number }> = new Map();

/**
 * Check rate limit for a given key and configuration
 * Backward-compatible function used by existing API routes
 *
 * @param key - Unique identifier for rate limiting (e.g., "register:127.0.0.1")
 * @param config - Rate limit configuration with windowMs and maxRequests
 * @returns Object with allowed boolean and resetTime timestamp
 */
export function checkRateLimit(
  key: string,
  config: { windowMs: number; maxRequests: number }
): { allowed: boolean; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.startTime > config.windowMs) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!entry || now - entry.startTime > config.windowMs) {
    // No entry or window expired - start fresh
    rateLimitStore.set(key, { count: 1, startTime: now });
    return {
      allowed: true,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: entry.startTime + config.windowMs,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    resetTime: entry.startTime + config.windowMs,
  };
}

// ============================================
// Initialize all security subsystems
// ============================================

/**
 * Initialize all security subsystems
 * Call this once at application startup
 */
export async function initSecurity(): Promise<void> {
  // Start rate limit cleanup - use dynamic import to avoid circular deps
  try {
    const rateLimiter = await import('./rate-limiter');
    rateLimiter.startRateLimitCleanup();
  } catch {
    // Will be initialized when rate-limiter module is loaded
  }

  // Start brute force cleanup
  try {
    const bruteForce = await import('./brute-force');
    bruteForce.startBruteForceCleanup();
  } catch {
    // Will be initialized when brute-force module is loaded
  }
}

// Lazy initialization - don't auto-run at import time to avoid circular deps
// The cleanup intervals will start when the modules are first imported by routes
