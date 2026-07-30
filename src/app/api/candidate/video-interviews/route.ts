// @ts-nocheck - Prisma results are explicitly joined through applicationId.
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

    const applications = await db.application.findMany({
      where: { candidateId: profile.id },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    if (!applications.length) {
      return NextResponse.json({ pending: [], completed: [] });
    }

    const applicationById = new Map(
      applications.map((application) => [application.id, application]),
    );

    const interviews = await db.videoInterview.findMany({
      where: { applicationId: { in: [...applicationById.keys()] } },
      include: {
        responses: {
          where: { candidateId: profile.id },
          orderBy: { questionIndex: 'asc' },
        },
      },
      orderBy: [{ responseDeadline: 'asc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    const serialize = (interview: (typeof interviews)[number]) => {
      const application = applicationById.get(interview.applicationId);
      const effectiveStatus =
        interview.status === 'PENDING' &&
        interview.responseDeadline &&
        interview.responseDeadline <= now
          ? 'EXPIRED'
          : interview.status;

      return {
        id: interview.id,
        applicationId: interview.applicationId,
        title: interview.title,
        description: interview.description,
        job: application?.job?.title || '',
        company: application?.job?.company?.name || '',
        companyLogo: application?.job?.company?.logo || null,
        deadline: interview.responseDeadline?.toISOString() || '',
        status: effectiveStatus,
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
      };
    };

    const serialized = interviews.map(serialize);
    return NextResponse.json({
      pending: serialized.filter(
        (interview) =>
          interview.status === 'PENDING' || interview.status === 'IN_PROGRESS',
      ),
      completed: serialized.filter(
        (interview) => interview.status === 'COMPLETED',
      ),
    });
  } catch (error) {
    console.error('Candidate video interviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video interviews' },
      { status: 500 },
    );
  }
}
