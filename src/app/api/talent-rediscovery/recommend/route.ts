import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  findCompanyTalent,
  parseStoredStringList,
} from '@/lib/talent-matching';

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
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
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 },
      );
    }

    const job = await db.job.findFirst({
      where: { id: jobId, companyId, status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        title: true,
        skills: true,
        location: true,
        experienceMin: true,
        experienceMax: true,
        status: true,
      },
    });
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found for this company' },
        { status: 404 },
      );
    }

    const criteria = {
      skills: parseStoredStringList(job.skills),
      experienceMin: job.experienceMin ?? undefined,
      experienceMax: job.experienceMax ?? undefined,
      location: job.location || undefined,
      jobTitle: job.title,
    };

    const recommendations = await findCompanyTalent({
      companyId,
      criteria,
      excludeJobId: job.id,
      limit: 50,
    });

    return NextResponse.json({
      job,
      recommendations,
      total: recommendations.length,
      scoring: 'deterministic',
    });
  } catch (error) {
    console.error('Talent rediscovery recommend error:', error);
    return NextResponse.json(
      { error: 'Failed to recommend previous candidates' },
      { status: 500 },
    );
  }
}
