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

    let profileId = candidateId;

    if (!profileId && userId) {
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      profileId = profile?.id;
    }

    if (!profileId) {
      const firstCandidate = await db.candidateProfile.findFirst({
        select: { id: true },
      });
      profileId = firstCandidate?.id;
    }

    if (!profileId) {
      return NextResponse.json({ pending: [], completed: [] });
    }

    // Get video interview responses for this candidate
    const responses = await db.videoInterviewResponse.findMany({
      where: { candidateId: profileId },
      include: {
        videoInterview: {
          include: {
            application: {
              include: {
                job: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    // Get all video interviews assigned through applications
    const applications = await db.application.findMany({
      where: { candidateId: profileId },
      include: {
        job: { select: { title: true } },
        interviews: {
          where: { type: 'ASYNC_VIDEO' },
        },
      },
    });

    // Separate into pending and completed
    const completedInterviewIds = new Set(responses.map((r: any) => r.videoInterviewId));

    const allVideoInterviews = await db.videoInterview.findMany({
      include: {
        application: {
          include: {
            job: { select: { title: true } },
          },
        },
        responses: {
          where: { candidateId: profileId || undefined },
        },
      },
    });

    // Filter to interviews related to this candidate's applications
    const candidateAppIds = new Set(applications.map((a: any) => a.id));
    const relevantInterviews = allVideoInterviews.filter((vi: any) =>
      candidateAppIds.has(vi.applicationId)
    );

    const pending = relevantInterviews
      .filter((vi: any) => vi.status === 'PENDING' || vi.status === 'IN_PROGRESS')
      .map((vi: any) => ({
        id: vi.id,
        title: vi.title,
        job: vi.application?.job?.title || '',
        deadline: vi.responseDeadline?.toISOString() || '',
        status: vi.status,
        questions: vi.questions ? JSON.parse(vi.questions) : [],
        maxRetakes: vi.maxRetakes,
        timePerQuestion: vi.timePerQuestion || 0,
        completedAt: null,
        responses: [],
      }));

    const completed = relevantInterviews
      .filter((vi: any) => vi.status === 'COMPLETED')
      .map((vi: any) => {
        const interviewResponses = responses.filter(
          (r: any) => r.videoInterviewId === vi.id
        );
        return {
          id: vi.id,
          title: vi.title,
          job: vi.application?.job?.title || '',
          deadline: vi.responseDeadline?.toISOString() || '',
          status: vi.status,
          questions: vi.questions ? JSON.parse(vi.questions) : [],
          maxRetakes: vi.maxRetakes,
          timePerQuestion: vi.timePerQuestion || 0,
          completedAt: vi.completedAt?.toISOString() || '',
          responses: interviewResponses.map((r: any) => ({
            questionIndex: r.questionIndex,
            duration: r.duration || 0,
            aiScore: r.aiScore,
            aiFeedback: r.aiFeedback,
            retakes: r.retakes,
          })),
        };
      });

    return NextResponse.json({ pending, completed });
  } catch (error) {
    console.error('Video interviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch video interviews' }, { status: 500 });
  }
}
