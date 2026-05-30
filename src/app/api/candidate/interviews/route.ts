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
      return NextResponse.json([]);
    }

    // Get interviews for this candidate's applications
    const interviews = await db.interview.findMany({
      where: {
        application: { candidateId: profileId },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json(
      interviews.map((interview: any) => ({
        id: interview.id,
        jobTitle: interview.application?.job?.title || '',
        company: interview.application?.job?.company?.name || '',
        date: interview.scheduledAt?.toLocaleDateString() || '',
        time: interview.scheduledAt?.toLocaleTimeString() || '',
        type: interview.type,
        status: interview.status,
        duration: interview.durationMinutes,
        location: interview.location,
        meetingLink: interview.meetingLink,
      }))
    );
  } catch (error) {
    console.error('Candidate interviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}
