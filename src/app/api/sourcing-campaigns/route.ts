import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  findCompanyTalent,
  normalizeTalentCriteria,
  type TalentCriteria,
} from '@/lib/talent-matching';
import { getClientIp } from '@/lib/security';

function safeArray(value: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object',
        )
      : [];
  } catch {
    return [];
  }
}

function safeCriteria(value: string): TalentCriteria {
  try {
    return normalizeTalentCriteria(JSON.parse(value));
  } catch {
    return normalizeTalentCriteria({});
  }
}

function serializeCampaign(
  campaign: {
    id: string;
    name: string;
    jobId: string | null;
    criteria: string;
    status: string;
    matchedCandidates: string;
    contactedCount: number;
    respondedCount: number;
    createdAt: Date;
    updatedAt: Date;
  },
  jobTitle: string | null,
) {
  const matchedCandidates = safeArray(campaign.matchedCandidates);
  return {
    id: campaign.id,
    name: campaign.name,
    jobId: campaign.jobId,
    jobTitle,
    criteria: safeCriteria(campaign.criteria),
    matchedCount: matchedCandidates.length,
    matchedCandidates,
    contactedCount: campaign.contactedCount,
    respondedCount: campaign.respondedCount,
    status: campaign.status,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const [campaigns, jobs] = await Promise.all([
      db.sourcingCampaign.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.job.findMany({
        where: {
          companyId,
          status: { in: ['OPEN', 'DRAFT', 'PAUSED'] },
        },
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
    ]);

    const jobTitles = new Map(jobs.map((job) => [job.id, job.title]));

    return NextResponse.json({
      campaigns: campaigns.map((campaign) =>
        serializeCampaign(
          campaign,
          campaign.jobId ? jobTitles.get(campaign.jobId) || null : null,
        ),
      ),
      jobs,
    });
  } catch (error) {
    console.error('Error fetching sourcing campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
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

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const jobId =
      typeof body.jobId === 'string' && body.jobId.trim()
        ? body.jobId.trim()
        : null;
    const criteria = normalizeTalentCriteria(body.criteria);

    if (!name || name.length > 160) {
      return NextResponse.json(
        { error: 'Campaign name is required and must be 160 characters or fewer' },
        { status: 400 },
      );
    }

    let jobTitle: string | null = null;
    if (jobId) {
      const job = await db.job.findFirst({
        where: { id: jobId, companyId, status: { not: 'ARCHIVED' } },
        select: { id: true, title: true },
      });
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found for this company' },
          { status: 404 },
        );
      }
      jobTitle = job.title;
    }

    const matches = await findCompanyTalent({
      companyId,
      criteria,
      excludeJobId: jobId || undefined,
      limit: 200,
    });

    const campaign = await db.$transaction(async (transaction) => {
      const created = await transaction.sourcingCampaign.create({
        data: {
          companyId,
          name,
          jobId,
          criteria: JSON.stringify(criteria),
          matchedCandidates: JSON.stringify(
            matches.map((candidate) => ({
              candidateId: candidate.id,
              matchScore: candidate.matchScore,
              matchReasons: candidate.matchReasons,
            })),
          ),
          contactedCount: 0,
          respondedCount: 0,
          status: 'ACTIVE',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'sourcing_campaign.create',
          resource: 'sourcing_campaign',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            jobId,
            matchedCount: matches.length,
            criteria,
          }),
        },
      });

      return created;
    });

    return NextResponse.json(
      { campaign: serializeCampaign(campaign, jobTitle) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating sourcing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 },
    );
  }
}
