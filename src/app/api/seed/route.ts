import { NextResponse } from 'next/server';

/**
 * Browser-triggered database seeding was removed because production pages were
 * depending on it and the old route created accounts with known passwords.
 * Development data must be created through the Prisma seed command instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'HTTP database seeding has been disabled',
      message: 'Run `npx prisma db seed` from a trusted development environment.',
    },
    { status: 410 },
  );
}
