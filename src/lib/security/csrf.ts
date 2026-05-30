/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Uses the double-submit cookie pattern with HMAC hashing:
 * 1. Server generates a token and stores it in an httpOnly cookie
 * 2. Client reads the hashed token and sends it in the x-csrf-token header
 * 3. Server validates that the header token matches the hashed cookie value
 *
 * This ensures that only same-origin requests can include both the cookie
 * (automatically sent by the browser) and the header (set by our JS code).
 *
 * IMPORTANT: Functions used by middleware must use Web Crypto API only,
 * since the Edge Runtime does not support Node.js 'crypto' module.
 */

import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Hash a token using SHA-256 (Node.js crypto — API routes only)
 */
function hashTokenNode(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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
 * Generate a random token (Node.js crypto — API routes only)
 */
function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Generate a new CSRF token pair (cookie value + header token)
 * Uses the double-submit cookie pattern with hashing
 *
 * NOTE: This function uses Node.js crypto and must only be called
 * from API route handlers, NOT from middleware.
 *
 * @returns Object with `token` (to send in response body) and `cookie` (to set as httpOnly cookie)
 */
export async function generateCsrfToken(): Promise<{ token: string; cookie: string }> {
  const token = generateToken();
  const cookieValue = `${token}:${Date.now()}`;
  const hashedCookie = hashTokenNode(cookieValue);
  return { token: hashedCookie, cookie: cookieValue };
}

/**
 * Validate a CSRF token from a request (for use in API route handlers)
 * Compares the token in the header with the hashed cookie value
 *
 * NOTE: This function uses Node.js crypto and must only be called
 * from API route handlers, NOT from middleware.
 *
 * @param request - The incoming Request object
 * @returns true if valid, false if invalid
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Skip for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Skip for webhook endpoints (they use their own verification)
  const url = new URL(request.url);
  if (url.pathname.includes('/api/stripe/webhook')) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }

  // Get cookie value
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return false;
  }

  // Validate the token (using Node.js crypto since this runs in API routes)
  const hashedCookie = hashTokenNode(cookieValue);

  // Check token freshness
  const parts = cookieValue.split(':');
  const timestamp = parseInt(parts[parts.length - 1] || '0', 10);
  if (isNaN(timestamp) || Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
    return false;
  }

  return hashedCookie === headerToken;
}

/**
 * Validate CSRF token from raw values (Edge Runtime compatible — for middleware)
 *
 * Uses Web Crypto API instead of Node.js crypto so it works in middleware.
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

  // Hash the cookie value using Web Crypto API (Edge Runtime compatible)
  const hashedCookie = await hashTokenEdge(cookieValue);
  return hashedCookie === headerToken;
}

/**
 * Middleware to check CSRF token on state-changing requests
 * Returns error response if validation fails, null if passes
 *
 * @param request - The incoming Request object
 * @returns Response with 403 if validation fails, null if passes
 */
export async function csrfCheck(request: Request): Promise<Response | null> {
  const valid = await validateCsrfToken(request);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'CSRF token validation failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
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
