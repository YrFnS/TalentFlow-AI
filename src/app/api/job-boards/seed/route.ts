import { NextResponse } from 'next/server';

/**
 * The job-board catalog is platform configuration and must be provisioned by a
 * trusted migration or Prisma seed. Runtime pages must never create shared
 * catalog records through an HTTP request.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'HTTP job-board seeding has been disabled',
      message:
        'Provision the job-board catalog through a trusted database migration or `npx prisma db seed`.',
    },
    { status: 410 },
  );
}
