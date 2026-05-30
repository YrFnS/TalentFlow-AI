import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export interface AuthResult {
  session: any;
  userId: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];
const COMPANY_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER', 'REVIEWER'];
const CANDIDATE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CANDIDATE'];

/**
 * Requires any authenticated user.
 * Returns AuthResult on success, or NextResponse (401) on failure.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = session.user as any;

  return {
    session,
    userId: user.id,
    role: user.role,
    companyId: user.companyId || null,
    companyName: user.companyName || null,
  };
}

/**
 * Requires an admin-level user (SUPER_ADMIN, ADMIN, or MODERATOR).
 * Returns AuthResult on success, or NextResponse (401/403) on failure.
 */
export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!ADMIN_ROLES.includes(auth.role)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Requires a company member or admin user.
 * Returns AuthResult on success, or NextResponse (401/403) on failure.
 */
export async function requireCompanyMember(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!COMPANY_ROLES.includes(auth.role)) {
    return NextResponse.json(
      { error: 'Company member access required' },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Requires a candidate or admin user.
 * Returns AuthResult on success, or NextResponse (401/403) on failure.
 */
export async function requireCandidate(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!CANDIDATE_ROLES.includes(auth.role)) {
    return NextResponse.json(
      { error: 'Candidate access required' },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Requires the authenticated user to be a member of the specified company.
 * Prevents IDOR by verifying company membership.
 * Super admins can access any company.
 */
export async function requireCompanyAccess(companyId: string): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Super admins can access any company
  if (ADMIN_ROLES.includes(auth.role)) return auth;

  // Check if user is a member of the specified company
  if (auth.companyId !== companyId) {
    return NextResponse.json(
      { error: 'You do not have access to this company' },
      { status: 403 }
    );
  }

  return auth;
}
