import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

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

export async function getOptionalAuth(): Promise<AuthResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as typeof session.user & {
    id?: string;
    role?: string;
    companyId?: string | null;
    companyName?: string | null;
  };

  if (!user.id || !user.role) return null;

  return {
    session,
    userId: user.id,
    role: user.role,
    companyId: user.companyId || null,
    companyName: user.companyName || null,
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
 * Company users are always locked to their session company. Platform admins
 * may explicitly supply a company ID for support/administration operations.
 */
export function resolveCompanyId(
  auth: AuthResult,
  requestedCompanyId?: string | null,
): string | null {
  if (auth.companyId) {
    if (
      requestedCompanyId &&
      requestedCompanyId !== auth.companyId &&
      !isPlatformAdmin(auth.role)
    ) {
      return null;
    }
    return auth.companyId;
  }

  if (isPlatformAdmin(auth.role)) return requestedCompanyId || null;
  return null;
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
