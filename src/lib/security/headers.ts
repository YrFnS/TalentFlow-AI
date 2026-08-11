/**
 * Security Headers - Applies security headers to all responses
 * Prevents clickjacking, XSS, MIME sniffing, and other attacks
 *
 * Supports nonce-based CSP for scripts. Inline styles remain explicitly
 * permitted because React, Radix UI, and animation libraries set style
 * attributes at runtime.
 */

import { NextResponse } from 'next/server';

/**
 * Get standard security headers for all responses.
 *
 * @param nonce - Optional CSP nonce. When provided, script-src uses the nonce
 *                instead of unsafe-inline.
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const scriptSrc = nonce
    ? "script-src 'self' 'nonce-" + nonce + "'"
    : "script-src 'self' 'unsafe-inline'";

  // Do not combine a nonce with unsafe-inline in style-src. CSP Level 3 browsers
  // ignore unsafe-inline when a nonce is present, which blocks React/Radix style
  // attributes and breaks the rendered interface.
  const styleSrc = "style-src 'self' 'unsafe-inline'";

  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
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
    ...(process.env.NODE_ENV === 'development'
      ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
      : []),
  ].filter(Boolean);

  const origin = allowedOrigins[0] || '';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-Transform-Port, x-csrf-token',
    'Access-Control-Max-Age': '86400',
    ...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

/**
 * Get CORS headers for a specific request origin.
 * Validates the request origin against allowed origins.
 */
export function getCORSHeadersForRequest(
  requestOrigin: string | null,
): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.NODE_ENV === 'development'
      ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
      : []),
  ].filter(Boolean);

  const origin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || '';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-Transform-Port, x-csrf-token',
    'Access-Control-Max-Age': '86400',
    ...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

/** Apply security headers to a NextResponse. */
export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  response.headers.delete('X-Powered-By');

  for (const [key, value] of Object.entries(getSecurityHeaders(nonce))) {
    response.headers.set(key, value);
  }

  if (nonce) {
    response.headers.set('x-csp-nonce', nonce);
  }

  return response;
}

/** Apply CORS headers to a NextResponse for API routes. */
export function applyCORSHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(getCORSHeaders())) {
    response.headers.set(key, value);
  }

  return response;
}

/** Apply both security and CORS headers to a NextResponse. */
export function applyAllSecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  applySecurityHeaders(response, nonce);
  applyCORSHeaders(response);
  return response;
}

/** Create a CORS preflight response for OPTIONS requests. */
export function createCORSPreflightResponse(nonce?: string): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  response.headers.delete('X-Powered-By');

  for (const [key, value] of Object.entries(getSecurityHeaders(nonce))) {
    response.headers.set(key, value);
  }

  for (const [key, value] of Object.entries(getCORSHeaders())) {
    response.headers.set(key, value);
  }

  return response;
}
