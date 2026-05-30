// @ts-nocheck
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCandidate } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const userId = auth.userId;
    const status = searchParams.get('status');

    let profileId = candidateId;

    // If userId provided, find the candidate profile
    if (!profileId && userId) {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      profileId = profile?.id;
    }

    // If still no profile, try first candidate
    if (!profileId) {
      const firstCandidate = await db.candidateProfile.findFirst({
        select: { id: true },
      });
      profileId = firstCandidate?.id;
    }

    if (!profileId) {
      return NextResponse.json([]);
    }

    const where: Record<string, unknown> = { candidateId: profileId };
    if (status) where.status = status;

    const applications = await db.application.findMany({
      where,
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logo: true } },
          },
        },
        currentStage: true,
        applicationStages: {
          orderBy: { enteredAt: 'asc' },
        },
        interviews: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(
      applications.map((app: any) => ({
        id: app.id,
        jobTitle: app.job?.title || '',
        company: app.job?.company?.name || '',
        location: app.job?.location || '',
        appliedAt: app.appliedAt,
        status: app.status,
        matchScore: app.matchScore || 0,
        timeline: app.applicationStages.map((stage: any) => ({
          status: stage.stageId ? 'SCREENING' : 'APPLIED',
          date: new Date(stage.enteredAt).toLocaleDateString(),
          note: stage.notes || '',
        })),
        interviews: app.interviews,
      }))
    );
  } catch (error) {
    console.error('Candidate applications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
