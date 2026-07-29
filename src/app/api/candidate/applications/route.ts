// @ts-nocheck - Prisma result types are shaped for the candidate portal.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';

const APPLICATION_STATUSES = new Set([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFERED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const profile = await db.candidateProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!profile) return NextResponse.json([]);

    const status = request.nextUrl.searchParams.get('status');
    const applications = await db.application.findMany({
      where: {
        candidateId: profile.id,
        ...(status && APPLICATION_STATUSES.has(status)
          ? { status: status as never }
          : {}),
      },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logo: true } },
          },
        },
        currentStage: true,
        applicationStages: {
          include: { stage: { select: { name: true, color: true } } },
          orderBy: { enteredAt: 'asc' },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(
      applications.map((application) => ({
        id: application.id,
        jobId: application.jobId,
        jobTitle: application.job?.title || '',
        company: application.job?.company?.name || '',
        companyLogo: application.job?.company?.logo || null,
        location: application.job?.location || '',
        jobType: application.job?.jobType,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
        status: application.status,
        matchScore: application.matchScore || 0,
        currentStage: application.currentStage,
        timeline: application.applicationStages.map((history) => ({
          id: history.id,
          stageName: history.stage?.name || '',
          stageColor: history.stage?.color || null,
          date: history.enteredAt,
          exitedAt: history.exitedAt,
          note: history.notes || '',
        })),
        interviews: application.interviews,
      })),
    );
  } catch (error) {
    console.error('Candidate applications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 },
    );
  }
}
