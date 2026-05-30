import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

// GET: List interviews for a company's jobs
export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json([]);
    }

    // Get all jobs for this company
    const jobs = await db.job.findMany({
      where: { companyId },
      select: { id: true },
    });

    const jobIds = jobs.map((j) => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get applications for these jobs
    const applications = await db.application.findMany({
      where: { jobId: { in: jobIds } },
      select: { id: true },
    });

    const applicationIds = applications.map((a) => a.id);

    if (applicationIds.length === 0) {
      return NextResponse.json([]);
    }

    const where: Record<string, unknown> = {
      applicationId: { in: applicationIds },
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    const interviews = await db.interview.findMany({
      where,
      include: {
        application: {
          include: {
            candidate: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            job: {
              select: { title: true },
            },
          },
        },
        assignments: {
          include: {
            interviewer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// POST: Schedule a new interview
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { applicationId, type, scheduledAt, durationMinutes, interviewerId, notes, location, meetingLink } = body;

    if (!applicationId || !type || !scheduledAt) {
      return NextResponse.json(
        { error: 'applicationId, type, and scheduledAt are required' },
        { status: 400 }
      );
    }

    const interview = await db.interview.create({
      data: {
        applicationId,
        type: type as never,
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 30,
        location: location || null,
        meetingLink: meetingLink || null,
      },
    });

    // If interviewerId provided, create assignment
    if (interviewerId) {
      await db.interviewAssignment.create({
        data: {
          interviewId: interview.id,
          interviewerId,
          notes: notes || null,
        },
      });
    }

    // Fetch with relations
    const fullInterview = await db.interview.findUnique({
      where: { id: interview.id },
      include: {
        application: {
          include: {
            candidate: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            job: { select: { title: true } },
          },
        },
        assignments: {
          include: {
            interviewer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(fullInterview, { status: 201 });
  } catch (error) {
    console.error('Failed to schedule interview:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    );
  }
}

// PUT: Update interview status/feedback
export async function PUT(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { interviewId, status, feedback, rating } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: 'interviewId is required' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (feedback !== undefined) data.feedback = feedback;
    if (rating !== undefined) data.rating = rating;

    const interview = await db.interview.update({
      where: { id: interviewId },
      data,
      include: {
        application: {
          include: {
            candidate: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            job: { select: { title: true } },
          },
        },
        assignments: {
          include: {
            interviewer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to update interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel interview
export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json(
        { error: 'interviewId is required' },
        { status: 400 }
      );
    }

    // Instead of deleting, mark as cancelled
    const interview = await db.interview.update({
      where: { id: interviewId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to cancel interview:', error);
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    );
  }
}
