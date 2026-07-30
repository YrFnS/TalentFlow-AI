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

const ALLOWED_STATUSES = new Set(['ACTIVE', 'PAUSED', 'COMPLETED']);

function parsedCriteria(value: string): TalentCriteria {
  try {
    return normalizeTalentCriteria(JSON.parse(value));
  } catch {
    return normalizeTalentCriteria({});
  }
}

function parsedMatches(value: string): Array<Record<string, unknown>> {
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

async function serializeCampaign(campaign: {
  id: string;
  companyId: string;
  name: string;
  jobId: string | null;
  criteria: string;
  status: string;
  matchedCandidates: string;
  contactedCount: number;
  respondedCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  const job = campaign.jobId
    ? await db.job.findFirst({
        where: { id: campaign.jobId, companyId: campaign.companyId },
        select: { title: true },
      })
    : null;
  const matchedCandidates = parsedMatches(campaign.matchedCandidates);

  return {
    id: campaign.id,
    name: campaign.name,
    jobId: campaign.jobId,
    jobTitle: job?.title || null,
    criteria: parsedCriteria(campaign.criteria),
    matchedCount: matchedCandidates.length,
    matchedCandidates,
    contactedCount: campaign.contactedCount,
    respondedCount: campaign.respondedCount,
    status: campaign.status,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const campaign = await db.sourcingCampaign.findFirst({
      where: { id, companyId },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ campaign: await serializeCampaign(campaign) });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const existing = await db.sourcingCampaign.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json(
          { error: 'Status must be ACTIVE, PAUSED, or COMPLETED' },
          { status: 400 },
        );
      }
      data.status = status;
      changedFields.push('status');
    }

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 160) {
        return NextResponse.json(
          { error: 'Campaign name is invalid' },
          { status: 400 },
        );
      }
      data.name = name;
      changedFields.push('name');
    }

    let jobId = existing.jobId;
    if (body.jobId !== undefined) {
      jobId =
        typeof body.jobId === 'string' && body.jobId.trim()
          ? body.jobId.trim()
          : null;
      if (jobId) {
        const job = await db.job.findFirst({
          where: { id: jobId, companyId, status: { not: 'ARCHIVED' } },
          select: { id: true },
        });
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found for this company' },
            { status: 404 },
          );
        }
      }
      data.jobId = jobId;
      changedFields.push('jobId');
    }

    if (body.criteria !== undefined || body.jobId !== undefined) {
      const criteria =
        body.criteria !== undefined
          ? normalizeTalentCriteria(body.criteria)
          : parsedCriteria(existing.criteria);
      const matches = await findCompanyTalent({
        companyId,
        criteria,
        excludeJobId: jobId || undefined,
        limit: 200,
      });
      data.criteria = JSON.stringify(criteria);
      data.matchedCandidates = JSON.stringify(
        matches.map((candidate) => ({
          candidateId: candidate.id,
          matchScore: candidate.matchScore,
          matchReasons: candidate.matchReasons,
        })),
      );
      changedFields.push('criteria', 'matchedCandidates');
    }

    if (changedFields.length === 0) {
      return NextResponse.json(
        { error: 'No supported fields were provided' },
        { status: 400 },
      );
    }

    const campaign = await db.$transaction(async (transaction) => {
      const updated = await transaction.sourcingCampaign.update({
        where: { id },
        data,
      });
      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'sourcing_campaign.update',
          resource: 'sourcing_campaign',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId, changedFields }),
        },
      });
      return updated;
    });

    return NextResponse.json({ campaign: await serializeCampaign(campaign) });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
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

    const { id } = await params;
    const existing = await db.sourcingCampaign.findFirst({
      where: { id, companyId },
      select: { id: true, name: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.sourcingCampaign.delete({ where: { id } });
      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'sourcing_campaign.delete',
          resource: 'sourcing_campaign',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId, name: existing.name }),
        },
      });
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 },
    );
  }
}
