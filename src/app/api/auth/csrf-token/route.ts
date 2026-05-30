import { NextResponse } from 'next/server';
import { generateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/security/csrf';

/**
 * GET /api/auth/csrf-token
 *
 * Generates a new CSRF token pair. The hashed token is returned in the response
 * body, and the raw cookie value is set as an httpOnly cookie.
 *
 * The client must send the token in the x-csrf-token header for all
 * state-changing requests (POST, PUT, PATCH, DELETE).
 */
export async function GET() {
  const { token, cookie } = await generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set(CSRF_COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return response;
}
