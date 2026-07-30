import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';

const EVENT_TYPES = new Set([
  'EMAIL_SENT',
  'EMAIL_OPENED',
  'EMAIL_CLICKED',
  'INTERVIEW_SCHEDULED',
  'APPLIED',
  'VIEWED_PROFILE',
]);

function parseDetails(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return { message: value };
  }
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

    const requestedType = request.nextUrl.searchParams.get('type');
    const type =
      requestedType && EVENT_TYPES.has(requestedType)
        ? requestedType
        : undefined;

    const events = await db.candidateEngagement.findMany({
      where: {
        companyId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const candidateIds = [...new Set(events.map((event) => event.candidateId))];
    const campaignIds = [
      ...new Set(
        events
          .map((event) => event.campaignId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [candidates, campaigns] = await Promise.all([
      candidateIds.length
        ? db.candidateProfile.findMany({
            where: { id: { in: candidateIds } },
            select: {
              id: true,
              currentTitle: true,
              user: { select: { name: true, image: true } },
            },
          })
        : Promise.resolve([]),
      campaignIds.length
        ? db.sourcingCampaign.findMany({
            where: { id: { in: campaignIds }, companyId },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const candidateMap = new Map(
      candidates.map((candidate) => [candidate.id, candidate]),
    );
    const campaignMap = new Map(
      campaigns.map((campaign) => [campaign.id, campaign.name]),
    );

    return NextResponse.json({
      events: events.map((event) => {
        const candidate = candidateMap.get(event.candidateId);
        const details = parseDetails(event.details);
        return {
          id: event.id,
          candidateId: event.candidateId,
          candidateName: candidate?.user.name || 'Former candidate',
          candidateTitle: candidate?.currentTitle || null,
          candidateImage: candidate?.user.image || null,
          type: event.type,
          campaignName: event.campaignId
            ? campaignMap.get(event.campaignId) || null
            : null,
          details,
          date: event.createdAt,
        };
      }),
      counts: Object.fromEntries(
        [...EVENT_TYPES].map((eventType) => [
          eventType,
          events.filter((event) => event.type === eventType).length,
        ]),
      ),
    });
  } catch (error) {
    console.error('Error fetching talent engagement history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement history' },
      { status: 500 },
    );
  }
}
