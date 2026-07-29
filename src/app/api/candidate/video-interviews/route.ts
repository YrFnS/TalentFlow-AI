// @ts-nocheck - Prisma results are shaped for the candidate portal.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';

function parseQuestions(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const profile = await db.candidateProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ pending: [], completed: [] });
    }

    const interviews = await db.videoInterview.findMany({
      where: { application: { candidateId: profile.id } },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: { select: { id: true, name: true, logo: true } },
              },
            },
          },
        },
        responses: {
          where: { candidateId: profile.id },
          orderBy: { questionIndex: 'asc' },
        },
      },
      orderBy: { responseDeadline: 'asc' },
    });

    const serialize = (interview: (typeof interviews)[number]) => ({
      id: interview.id,
      title: interview.title,
      description: interview.description,
      job: interview.application?.job?.title || '',
      company: interview.application?.job?.company?.name || '',
      companyLogo: interview.application?.job?.company?.logo || null,
      deadline: interview.responseDeadline?.toISOString() || '',
      status: interview.status,
      questions: parseQuestions(interview.questions),
      maxRetakes: interview.maxRetakes,
      timePerQuestion: interview.timePerQuestion || 0,
      completedAt: interview.completedAt?.toISOString() || null,
      responses: interview.responses.map((response) => ({
        questionIndex: response.questionIndex,
        duration: response.duration || 0,
        aiScore: response.aiScore,
        aiFeedback: response.aiFeedback,
        retakes: response.retakes,
        completedAt: response.completedAt,
      })),
    });

    return NextResponse.json({
      pending: interviews
        .filter(
          (interview) =>
            interview.status === 'PENDING' || interview.status === 'IN_PROGRESS',
        )
        .map(serialize),
      completed: interviews
        .filter((interview) => interview.status === 'COMPLETED')
        .map(serialize),
    });
  } catch (error) {
    console.error('Candidate video interviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video interviews' },
      { status: 500 },
    );
  }
}
