import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface AuthResult {
  session: Awaited<ReturnType<typeof getServerSession>>;
  userId: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
}

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as const;
export const COMPANY_MEMBER_ROLES = [
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
  'REVIEWER',
] as const;
export const COMPANY_EDITOR_ROLES = [
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
] as const;
export const COMPANY_ADMIN_ROLES = ['COMPANY_ADMIN'] as const;
export const CANDIDATE_ROLES = ['CANDIDATE'] as const;

export function isPlatformAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isCompanyMemberRole(role: string): boolean {
  return (COMPANY_MEMBER_ROLES as readonly string[]).includes(role);
}

export function isCompanyEditorRole(role: string): boolean {
  return (COMPANY_EDITOR_ROLES as readonly string[]).includes(role);
}

/**
 * Resolve the current authorization state from the database rather than
 * trusting role and company claims that may be stale in a long-lived JWT.
 * This makes company removal, role changes, user deactivation, and company
 * deactivation effective on the next protected API request.
 */
export async function getOptionalAuth(): Promise<AuthResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const sessionUser = session.user as typeof session.user & {
    id?: string;
    companyId?: string | null;
  };
  if (!sessionUser.id) return null;

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyMemberships: {
        where: { company: { isActive: true } },
        orderBy: { joinedAt: 'asc' },
        select: {
          role: true,
          companyId: true,
          company: { select: { id: true, name: true, isActive: true } },
        },
      },
    },
  });

  if (!user?.isActive) return null;

  if (isPlatformAdmin(user.role)) {
    const preferredMembership =
      user.companyMemberships.find(
        (membership) => membership.companyId === sessionUser.companyId,
      ) || user.companyMemberships[0];

    return {
      session,
      userId: user.id,
      role: user.role,
      companyId: preferredMembership?.company.id || null,
      companyName: preferredMembership?.company.name || null,
    };
  }

  const membership =
    user.companyMemberships.find(
      (candidate) => candidate.companyId === sessionUser.companyId,
    ) || user.companyMemberships[0];

  if (membership) {
    return {
      session,
      userId: user.id,
      role: membership.role,
      companyId: membership.company.id,
      companyName: membership.company.name,
    };
  }

  if (user.role !== 'CANDIDATE') return null;

  return {
    session,
    userId: user.id,
    role: 'CANDIDATE',
    companyId: null,
    companyName: null,
  };
}

export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const auth = await getOptionalAuth();
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }
  return auth;
}

export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isPlatformAdmin(auth.role)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }

  return auth;
}

export async function requireCompanyMember(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isPlatformAdmin(auth.role) && !isCompanyMemberRole(auth.role)) {
    return NextResponse.json(
      { error: 'Company member access required' },
      { status: 403 },
    );
  }

  return auth;
}

export async function requireCompanyEditor(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isPlatformAdmin(auth.role) && !isCompanyEditorRole(auth.role)) {
    return NextResponse.json(
      { error: 'Recruiting editor access required' },
      { status: 403 },
    );
  }

  return auth;
}

export async function requireCompanyAdmin(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (
    !isPlatformAdmin(auth.role) &&
    !(COMPANY_ADMIN_ROLES as readonly string[]).includes(auth.role)
  ) {
    return NextResponse.json(
      { error: 'Company administrator access required' },
      { status: 403 },
    );
  }

  return auth;
}

export async function requireCandidate(): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (
    !isPlatformAdmin(auth.role) &&
    !(CANDIDATE_ROLES as readonly string[]).includes(auth.role)
  ) {
    return NextResponse.json(
      { error: 'Candidate access required' },
      { status: 403 },
    );
  }

  return auth;
}

/**
 * Resolve the company that an API request is allowed to operate on.
 * Company users are always locked to their live database membership. Platform
 * admins may explicitly supply another company ID for support operations.
 */
export function resolveCompanyId(
  auth: AuthResult,
  requestedCompanyId?: string | null,
): string | null {
  if (isPlatformAdmin(auth.role)) {
    return requestedCompanyId || auth.companyId || null;
  }

  if (!auth.companyId) return null;
  if (requestedCompanyId && requestedCompanyId !== auth.companyId) return null;
  return auth.companyId;
}

export async function requireCompanyAccess(
  companyId: string,
): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (isPlatformAdmin(auth.role)) return auth;

  if (!auth.companyId || auth.companyId !== companyId) {
    return NextResponse.json(
      { error: 'You do not have access to this company' },
      { status: 403 },
    );
  }

  return auth;
}
