import { NextRequest, NextResponse } from 'next/server';
import {
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  findCompanyTalent,
  normalizeTalentCriteria,
} from '@/lib/talent-matching';

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const companyId = resolveCompanyId(
      auth,
      typeof body.companyId === 'string' ? body.companyId : null,
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const criteria = normalizeTalentCriteria({
      skills: body.skills,
      experienceMin: body.experienceMin,
      experienceMax: body.experienceMax,
      location: body.location,
      jobTitle: body.jobTitle,
    });

    const candidates = await findCompanyTalent({
      companyId,
      criteria,
      limit: 100,
    });

    return NextResponse.json({
      candidates,
      total: candidates.length,
      criteria,
      scoring: 'deterministic',
    });
  } catch (error) {
    console.error('Talent rediscovery search error:', error);
    return NextResponse.json(
      { error: 'Failed to search previous candidates' },
      { status: 500 },
    );
  }
}
