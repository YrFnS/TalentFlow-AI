// @ts-nocheck - Prisma results are shaped for the candidate portal.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCandidate } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const profile = await db.candidateProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!profile) return NextResponse.json([]);

    const interviews = await db.interview.findMany({
      where: {
        application: { candidateId: profile.id },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
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
        assignments: {
          include: { interviewer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json(
      interviews.map((interview) => ({
        id: interview.id,
        jobId: interview.application?.job?.id || '',
        jobTitle: interview.application?.job?.title || '',
        company: interview.application?.job?.company?.name || '',
        companyLogo: interview.application?.job?.company?.logo || null,
        scheduledAt: interview.scheduledAt,
        date: interview.scheduledAt?.toLocaleDateString() || '',
        time: interview.scheduledAt?.toLocaleTimeString() || '',
        type: interview.type,
        status: interview.status,
        duration: interview.durationMinutes,
        location: interview.location,
        meetingLink: interview.meetingLink,
        interviewers: interview.assignments.map(
          (assignment) => assignment.interviewer.name,
        ),
      })),
    );
  } catch (error) {
    console.error('Candidate interviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 },
    );
  }
}
