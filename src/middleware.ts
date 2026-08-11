import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  authSprayLimiter,
  getLimiterForPath,
  type RateLimitResult,
  type RateLimiter,
} from '@/lib/security/rate-limiter';
import { generateNonce } from '@/lib/security/nonce';
import {
  getSecurityHeaders,
  getCORSHeaders,
  getCORSHeadersForRequest,
  createCORSPreflightResponse,
} from '@/lib/security/headers';
import {
  validateCsrfTokenValues,
  isCsrfExemptPath,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/lib/security/csrf-edge';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}

function getRateLimitKeyFromRequest(
  req: NextRequest,
  userId?: string,
): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim();
  if (ip) return `ip:${ip}`;

  const userAgent = req.headers.get('user-agent') || '';
  const language = req.headers.get('accept-language') || '';
  if (userAgent || language) {
    return `anon:${simpleHash(`${userAgent}:${language}`)}`;
  }

  return 'anon:no-headers';
}

async function getCredentialAttemptKey(
  req: NextRequest,
  clientKey: string,
): Promise<string> {
  try {
    const formData = await req.clone().formData();
    const rawEmail = formData.get('email');
    const email =
      typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (email) {
      return `${clientKey}:account:${simpleHash(email)}`;
    }
  } catch {
    // Fall back to the client key if the callback payload cannot be parsed.
  }

  return `${clientKey}:account:unknown`;
}

function withSecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  response.headers.delete('X-Powered-By');

  for (const [key, value] of Object.entries(getSecurityHeaders(nonce))) {
    response.headers.set(key, value);
  }

  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  if (commit) response.headers.set('x-deployment-commit', commit);

  return response;
}

function withCORSHeaders(
  response: NextResponse,
  request?: NextRequest,
): NextResponse {
  const requestOrigin = request?.headers.get('origin') || null;
  const corsHeaders = requestOrigin
    ? getCORSHeadersForRequest(requestOrigin)
    : getCORSHeaders();

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

function createRateLimitResponse(
  req: NextRequest,
  limiter: RateLimiter,
  result: RateLimitResult,
): NextResponse {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
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
    },
  );

  return withSecurityHeaders(withCORSHeaders(response, req));
}

function isRouteAtOrBelow(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api/');
  const nonce = isApiRoute ? undefined : generateNonce();

  if (isApiRoute && req.method === 'OPTIONS') {
    return withSecurityHeaders(
      withCORSHeaders(createCORSPreflightResponse(), req),
    );
  }

  const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    req.method.toUpperCase(),
  );

  if (isApiRoute && isStateChangingMethod && !isCsrfExemptPath(path)) {
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    const cookieValue = req.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (
      !headerToken ||
      !cookieValue ||
      !(await validateCsrfTokenValues(headerToken, cookieValue))
    ) {
      const response = NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 },
      );
      return withSecurityHeaders(withCORSHeaders(response, req));
    }
  }

  const BODY_SIZE_LIMIT = 10 * 1024 * 1024;
  const FILE_UPLOAD_BODY_SIZE_LIMIT = 50 * 1024 * 1024;
  const FILE_UPLOAD_PATHS = ['/api/resume/upload'];

  if (
    isApiRoute &&
    ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
  ) {
    const contentLength = Number.parseInt(
      req.headers.get('content-length') || '0',
      10,
    );

    if (contentLength > 0) {
      const isFileUpload = FILE_UPLOAD_PATHS.some((prefix) =>
        path.startsWith(prefix),
      );
      const limit = isFileUpload
        ? FILE_UPLOAD_BODY_SIZE_LIMIT
        : BODY_SIZE_LIMIT;

      if (contentLength > limit) {
        const response = NextResponse.json(
          {
            error: 'Payload Too Large',
            message: `Request body exceeds the ${isFileUpload ? '50MB' : '10MB'} size limit.`,
            limit,
            contentLength,
          },
          { status: 413 },
        );
        return withSecurityHeaders(withCORSHeaders(response, req));
      }
    }
  }

  let rateLimitResult: {
    remaining: number;
    resetAt: number;
    limit: number;
  } | null = null;

  if (isApiRoute) {
    const limiter = getLimiterForPath(path);
    let userId: string | undefined;

    try {
      const token = await getToken({ req });
      if (token?.sub) userId = String(token.sub);
    } catch {
      // Anonymous rate-limit key will be used.
    }

    const clientKey = getRateLimitKeyFromRequest(req, userId);

    if (path.includes('/api/auth/callback/credentials')) {
      // Keep a broad per-client ceiling for password spraying while assigning
      // the tight five-attempt budget to the specific account being targeted.
      const sprayResult = authSprayLimiter.checkWithKey(clientKey);
      if (!sprayResult.allowed) {
        return createRateLimitResponse(
          req,
          authSprayLimiter,
          sprayResult,
        );
      }
    }

    const rateLimitKey = path.includes('/api/auth/callback/credentials')
      ? await getCredentialAttemptKey(req, clientKey)
      : clientKey;
    const result = limiter.checkWithKey(rateLimitKey);

    if (!result.allowed) {
      return createRateLimitResponse(req, limiter, result);
    }

    rateLimitResult = {
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit: limiter['maxRequests'],
    };
  }

  const isAdminRoute = isRouteAtOrBelow(path, '/admin');
  const isCompanyRoute = isRouteAtOrBelow(path, '/company');
  const isCandidateRoute = isRouteAtOrBelow(path, '/candidate');
  const isProtectedRoute = isAdminRoute || isCompanyRoute || isCandidateRoute;

  if (isProtectedRoute) {
    const token = await getToken({ req });

    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set(
        'callbackUrl',
        req.nextUrl.pathname + req.nextUrl.search,
      );
      return withSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
    }

    const role = String(token.role || '');

    if (
      isAdminRoute &&
      !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)
    ) {
      return withSecurityHeaders(
        NextResponse.rewrite(new URL('/not-found', req.url)),
        nonce,
      );
    }

    if (
      isCompanyRoute &&
      ![
        'SUPER_ADMIN',
        'ADMIN',
        'MODERATOR',
        'COMPANY_ADMIN',
        'HR_MANAGER',
        'RECRUITER',
        'REVIEWER',
      ].includes(role)
    ) {
      return withSecurityHeaders(
        NextResponse.rewrite(new URL('/not-found', req.url)),
        nonce,
      );
    }

    if (
      isCandidateRoute &&
      role !== 'CANDIDATE' &&
      !['SUPER_ADMIN', 'ADMIN'].includes(role)
    ) {
      return withSecurityHeaders(
        NextResponse.rewrite(new URL('/not-found', req.url)),
        nonce,
      );
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (nonce) {
    requestHeaders.set('x-csp-nonce', nonce);
    requestHeaders.set(
      'Content-Security-Policy',
      getSecurityHeaders(nonce)['Content-Security-Policy'],
    );
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  withSecurityHeaders(response, nonce);

  if (isApiRoute) {
    withCORSHeaders(response, req);

    if (rateLimitResult) {
      response.headers.set(
        'X-RateLimit-Limit',
        String(rateLimitResult.limit),
      );
      response.headers.set(
        'X-RateLimit-Remaining',
        String(rateLimitResult.remaining),
      );
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(rateLimitResult.resetAt / 1000)),
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
