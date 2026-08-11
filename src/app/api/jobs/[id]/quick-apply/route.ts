import { NextResponse } from 'next/server';

/**
 * Guest quick-apply has been retired.
 *
 * The previous implementation accepted an arbitrary email address, attached
 * applications to an existing account without authentication, created active
 * passwordless users, and wrote resume files to the deployment filesystem.
 * Candidate applications now go through the authenticated candidate portal,
 * where identity, resume ownership, duplicate checks, and audit logging are
 * enforced by /api/applications/apply.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Guest quick apply is no longer available.',
      code: 'AUTHENTICATED_APPLICATION_REQUIRED',
      message:
        'Create or sign in to a candidate account, then submit the application from the job page.',
      loginUrl: '/auth/login',
      registerUrl: '/auth/register',
    },
    { status: 410 },
  );
}
