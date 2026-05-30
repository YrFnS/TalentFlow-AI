/**
 * CSRF Protection — Edge Runtime Compatible
 *
 * This module contains ONLY functions that are safe to use in
 * Next.js middleware (Edge Runtime). It uses Web Crypto API instead
 * of Node.js crypto.
 *
 * For the full CSRF module (including token generation for API routes),
 * see @/lib/security/csrf which uses Node.js crypto.
 */

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Hash a token using SHA-256 (Web Crypto API — Edge Runtime compatible)
 * Returns hex-encoded hash string
 */
async function hashTokenEdge(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from raw values (Edge Runtime compatible — for middleware)
 *
 * Compares the header token against a SHA-256 hash of the cookie value
 * and checks that the token has not expired.
 *
 * @param headerToken - The token from x-csrf-token header
 * @param cookieValue - The value from the csrf-token cookie
 * @returns true if valid, false if invalid
 */
export async function validateCsrfTokenValues(headerToken: string, cookieValue: string): Promise<boolean> {
  // Check token freshness
  const parts = cookieValue.split(':');
  const timestamp = parseInt(parts[parts.length - 1] || '0', 10);
  if (isNaN(timestamp) || Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
    return false;
  }

  // Hash the cookie value and compare with header token
  const hashedCookie = await hashTokenEdge(cookieValue);
  return hashedCookie === headerToken;
}

/**
 * Check if a path should be exempt from CSRF validation
 * These are public endpoints that don't require an existing session
 */
export function isCsrfExemptPath(pathname: string): boolean {
  const exemptPaths = [
    '/api/auth/register',
    '/api/auth/csrf-token',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/resend-verification',
    '/api/auth/[...nextauth]',
    '/api/stripe/webhook',
    '/api/jobs/[id]/quick-apply',
    '/api/seed',
  ];

  return exemptPaths.some((exempt) => {
    // Exact match
    if (pathname === exempt) return true;
    // Pattern match for dynamic segments like [id]
    const pattern = exempt.replace(/\[.*?\]/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
}
