import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

/**
 * API health/status endpoint.
 * Requires authentication to access.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    status: 'ok',
    message: 'TalentFlow AI API',
    version: '1.0.0',
  });
}
