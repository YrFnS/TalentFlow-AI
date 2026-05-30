import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getLimiterForPath } from '@/lib/security/rate-limiter';
import { generateNonce } from '@/lib/security/nonce';
import {
  getSecurityHeaders,
  getCORSHeaders,
  getCORSHeadersForRequest,
  createCORSPreflightResponse,
} from '@/lib/security/headers';
import { validateCsrfTokenValues, isCsrfExemptPath, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/security/csrf-edge';

/**
 * Simple hash function for Edge Runtime (no crypto module available).
 * Produces a stable 32-bit hash from a string.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get a rate limit key from a NextRequest.
 * Priority: User ID (from JWT) > IP address > User-Agent fingerprint > fallback
 * Never returns a single shared 'unknown' bucket.
 */
function getRateLimitKeyFromRequest(req: NextRequest, userId?: string): string {
  // Priority 1: Authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }

  // Priority 2: IP address from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim();

  if (ip) {
    return `ip:${ip}`;
  }

  // Priority 3: User-Agent + Accept-Language fingerprint
  const ua = req.headers.get('user-agent') || '';
  const lang = req.headers.get('accept-language') || '';
  if (ua || lang) {
    const hash = simpleHash(`${ua}:${lang}`);
    return `anon:${hash}`;
  }

  // Last resort: extremely rare (every browser sends a UA)
  return 'anon:no-headers';
}

/**
 * Apply security headers to a NextResponse, including nonce-based CSP
 */
function withSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Remove X-Powered-By header (information leakage)
  response.headers.delete('X-Powered-By');

  // Apply security headers with nonce for CSP
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
 * Uses origin-aware CORS to reflect back the requesting origin if allowed
 */
function withCORSHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  const requestOrigin = request?.headers.get('origin') || null;
  const corsHeaders = requestOrigin
    ? getCORSHeadersForRequest(requestOrigin)
    : getCORSHeaders();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Main middleware function - handles security, rate limiting, CORS, auth, and nonce-based CSP
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api/');

  // ============================================
  // 1. Generate CSP nonce for all non-static requests
  // ============================================
  // API routes don't need a nonce (they return JSON, not HTML)
  // Only page requests need nonce for inline script tags
  const nonce = isApiRoute ? undefined : generateNonce();

  // ============================================
  // 2. CORS preflight for API routes
  // ============================================
  if (isApiRoute && req.method === 'OPTIONS') {
    const response = createCORSPreflightResponse();
    return response;
  }

  // ============================================
  // 3. CSRF protection for state-changing API requests
  // ============================================
  const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  if (isApiRoute && isStateChangingMethod && !isCsrfExemptPath(path)) {
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    const cookieValue = req.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (!headerToken || !cookieValue || !(await validateCsrfTokenValues(headerToken, cookieValue))) {
      const response = NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
      return withSecurityHeaders(response);
    }
  }

  // ============================================
  // 3b. Request body size limit for state-changing API requests
  // ============================================
  const BODY_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
  const FILE_UPLOAD_BODY_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
  const FILE_UPLOAD_PATHS = ['/api/resume/upload'];

  if (
    isApiRoute &&
    ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
  ) {
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 0) {
      const isFileUpload = FILE_UPLOAD_PATHS.some((p) => path.startsWith(p));
      const limit = isFileUpload ? FILE_UPLOAD_BODY_SIZE_LIMIT : BODY_SIZE_LIMIT;

      if (contentLength > limit) {
        const response = NextResponse.json(
          {
            error: 'Payload Too Large',
            message: `Request body exceeds the ${isFileUpload ? '50MB' : '10MB'} size limit.`,
            limit,
            contentLength,
          },
          { status: 413 }
        );
        return withSecurityHeaders(withCORSHeaders(response, req));
      }
    }
  }

  // ============================================
  // 4. Rate limiting for API routes
  // ============================================
  let rateLimitResult: { remaining: number; resetAt: number; limit: number } | null = null;

  if (isApiRoute) {
    const limiter = getLimiterForPath(path);

    // Try to get user ID for per-user rate limiting
    let userId: string | undefined;
    try {
      const token = await getToken({ req });
      if (token?.sub) {
        userId = token.sub as string;
      }
    } catch {
      // Token check failed - use IP/fingerprint instead
    }

    // Use user-aware key for rate limiting (JWT user ID > IP > UA fingerprint)
    const rateLimitKey = getRateLimitKeyFromRequest(req, userId);
    const result = limiter.checkWithKey(rateLimitKey);
    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(
        (result.resetAt - Date.now()) / 1000
      );

      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limiter['maxRequests']),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );

      return withSecurityHeaders(withCORSHeaders(response, req));
    }

    // Store result for adding headers to the response
    rateLimitResult = { remaining: result.remaining, resetAt: result.resetAt, limit: limiter['maxRequests'] };
  }

  // ============================================
  // 5. Auth checks for protected routes
  // ============================================
  const isProtectedRoute =
    path.startsWith('/admin/') ||
    path.startsWith('/company/') ||
    path.startsWith('/candidate/');

  if (isProtectedRoute) {
    const token = await getToken({ req });

    // Not authenticated - redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return withSecurityHeaders(redirectResponse);
    }

    const role = token.role as string;

    // Admin routes require admin roles
    if (
      path.startsWith('/admin/') &&
      !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)
    ) {
      const rewriteResponse = NextResponse.rewrite(
        new URL('/not-found', req.url)
      );
      return withSecurityHeaders(rewriteResponse);
    }

    // Company routes require company roles
    if (
      path.startsWith('/company/') &&
      !['COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER', 'REVIEWER'].includes(role)
    ) {
      const rewriteResponse = NextResponse.rewrite(
        new URL('/not-found', req.url)
      );
      return withSecurityHeaders(rewriteResponse);
    }

    // Candidate routes require candidate role or admin
    if (
      path.startsWith('/candidate/') &&
      role !== 'CANDIDATE' &&
      !['SUPER_ADMIN', 'ADMIN'].includes(role)
    ) {
      const rewriteResponse = NextResponse.rewrite(
        new URL('/not-found', req.url)
      );
      return withSecurityHeaders(rewriteResponse);
    }
  }

  // ============================================
  // 6. Continue and apply security headers with nonce
  // ============================================
  const response = NextResponse.next();

  // Apply security headers to all responses (with nonce for page requests)
  withSecurityHeaders(response, nonce);

  // Apply CORS headers to API routes
  if (isApiRoute) {
    withCORSHeaders(response, req);

    // Add rate limit headers
    if (rateLimitResult) {
      response.headers.set(
        'X-RateLimit-Limit',
        String(rateLimitResult.limit)
      );
      response.headers.set(
        'X-RateLimit-Remaining',
        String(rateLimitResult.remaining)
      );
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(rateLimitResult.resetAt / 1000))
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This ensures security headers are applied to ALL responses
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
