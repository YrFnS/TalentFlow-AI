/**
 * Security Headers - Applies security headers to all responses
 * Prevents clickjacking, XSS, MIME sniffing, and other attacks
 *
 * Supports nonce-based CSP to eliminate 'unsafe-inline' for scripts.
 * When a nonce is provided, only scripts with matching nonce attribute will execute.
 */

import { NextResponse } from 'next/server';

/**
 * Get standard security headers for all responses.
 *
 * @param nonce - Optional CSP nonce. When provided, script-src uses 'nonce-{nonce}'
 *                instead of 'unsafe-inline', significantly improving XSS protection.
 *                If omitted, falls back to 'unsafe-inline' for backward compatibility.
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  // Build script-src directive based on nonce availability
  // Nonce-based CSP eliminates 'unsafe-inline' for scripts — a major XSS mitigation
  const scriptSrc = nonce
    ? "script-src 'self' 'nonce-" + nonce + "'"
    : "script-src 'self' 'unsafe-inline'";

  // Note: 'unsafe-inline' is kept for style-src because Tailwind CSS
  // injects inline styles at runtime. Style injection is lower risk than
  // script injection since CSS cannot execute arbitrary code.
  const styleSrc = nonce
    ? "style-src 'self' 'unsafe-inline' 'nonce-" + nonce + "'"
    : "style-src 'self' 'unsafe-inline'";

  return {
    // Prevent clickjacking - page cannot be embedded in iframes
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing - browser must respect declared Content-Type
    'X-Content-Type-Options': 'nosniff',

    // Enable browser XSS filter
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information sent with requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Disable browser features that could be misused
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // Force HTTPS for all future requests (1 year, include subdomains)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Content Security Policy - nonce-based for scripts, strict defaults
    // Key improvements over unsafe-inline/unsafe-eval:
    //   - Scripts require matching nonce attribute to execute
    //   - 'unsafe-eval' removed (blocks eval(), new Function(), etc.)
    //   - frame-ancestors 'none' prevents all framing
    //   - object-src 'none' blocks plugins (Flash, Java, etc.)
    'Content-Security-Policy': [
      "default-src 'self'",
      scriptSrc,
      styleSrc,
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  };
}

/**
 * Get CORS headers for API routes.
 * In production, restrict to known origins.
 * In development, allow the dev server origin.
 */
export function getCORSHeaders(): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    // Only allow localhost in development
    ...(process.env.NODE_ENV === 'development' ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'] : []),
  ].filter(Boolean);

  // Default to first configured origin, fallback to same-origin policy
  const origin = allowedOrigins[0] || '';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Transform-Port, x-csrf-token',
    'Access-Control-Max-Age': '86400', // 24 hours
    // Only set Allow-Credentials when there is a specific origin (not wildcard or empty)
    ...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

/**
 * Get CORS headers for a specific request origin.
 * Validates the request origin against allowed origins.
 */
export function getCORSHeadersForRequest(requestOrigin: string | null): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    // Only allow localhost in development
    ...(process.env.NODE_ENV === 'development' ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'] : []),
  ].filter(Boolean);

  // If the request origin is in our allowed list, reflect it back
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : (allowedOrigins[0] || '');

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Transform-Port, x-csrf-token',
    'Access-Control-Max-Age': '86400', // 24 hours
    // Only set Allow-Credentials when there is a specific origin (not wildcard or empty)
    ...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

/**
 * Apply security headers to a NextResponse
 * Removes X-Powered-By header and adds security headers
 *
 * @param response - The NextResponse to apply headers to
 * @param nonce - Optional CSP nonce for nonce-based Content Security Policy
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Remove X-Powered-By header (information leakage)
  response.headers.delete('X-Powered-By');

  // Apply security headers with optional nonce
  const securityHeaders = getSecurityHeaders(nonce);

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Expose nonce to client via custom header so layout/components can read it
  if (nonce) {
    response.headers.set('x-csp-nonce', nonce);
  }

  return response;
}

/**
 * Apply CORS headers to a NextResponse for API routes
 */
export function applyCORSHeaders(response: NextResponse): NextResponse {
  const corsHeaders = getCORSHeaders();

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Apply both security and CORS headers to a NextResponse
 *
 * @param response - The NextResponse to apply headers to
 * @param nonce - Optional CSP nonce for nonce-based Content Security Policy
 */
export function applyAllSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  applySecurityHeaders(response, nonce);
  applyCORSHeaders(response);
  return response;
}

/**
 * Create a CORS preflight response for OPTIONS requests
 *
 * @param nonce - Optional CSP nonce (typically not needed for OPTIONS, but kept for consistency)
 */
export function createCORSPreflightResponse(nonce?: string): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  const securityHeaders = getSecurityHeaders(nonce);
  const corsHeaders = getCORSHeaders();

  // Remove X-Powered-By
  response.headers.delete('X-Powered-By');

  // Apply all headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
