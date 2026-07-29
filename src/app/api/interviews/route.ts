// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  interviewCreateSchema,
  interviewUpdateSchema,
  validateInput,
} from '@/lib/validation/schemas';
import { getClientIp } from '@/lib/security';

const interviewInclude = {
  application: {
    include: {
      candidate: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      job: { select: { id: true, title: true, companyId: true } },
    },
  },
  assignments: {
    include: { interviewer: { select: { id: true, name: true } } },
  },
};

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

    const status = request.nextUrl.searchParams.get('status');
    const interviews = await db.interview.findMany({
      where: {
        application: { job: { companyId } },
        ...(status && status !== 'all' ? { status: status as never } : {}),
      },
      include: interviewInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(interviewCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const application = await db.application.findFirst({
      where: { id: input.applicationId, job: { companyId } },
      include: {
        job: { select: { title: true } },
        candidate: { include: { user: { select: { id: true } } } },
      },
    });
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    if (input.interviewerId) {
      const interviewer = await db.companyMember.findFirst({
        where: { companyId, userId: input.interviewerId },
        select: { id: true },
      });
      if (!interviewer) {
        return NextResponse.json(
          { error: 'The interviewer is not a member of this company' },
          { status: 400 },
        );
      }
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: 'scheduledAt must be a valid date' },
        { status: 400 },
      );
    }

    const interview = await db.$transaction(async (transaction) => {
      const created = await transaction.interview.create({
        data: {
          applicationId: input.applicationId,
          type: input.type,
          status: 'SCHEDULED',
          scheduledAt,
          durationMinutes: input.durationMinutes,
          location: input.location || null,
          meetingLink: input.meetingLink || null,
        },
      });

      if (input.interviewerId) {
        await transaction.interviewAssignment.create({
          data: {
            interviewId: created.id,
            interviewerId: input.interviewerId,
            notes: input.notes || null,
          },
        });
      }

      await transaction.notification.create({
        data: {
          userId: application.candidate.user.id,
          title: 'Interview scheduled',
          message: `Your interview for ${application.job.title} has been scheduled.`,
          type: 'interview',
          link: '/candidate/interview-prep',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'interview.create',
          resource: 'interview',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            applicationId: input.applicationId,
            scheduledAt,
          }),
        },
      });

      return transaction.interview.findUnique({
        where: { id: created.id },
        include: interviewInclude,
      });
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('Failed to schedule interview:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(interviewUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.interview.findFirst({
      where: {
        id: input.interviewId,
        application: { job: { companyId } },
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.feedback !== undefined) data.feedback = input.feedback;
    if (input.rating !== undefined) data.rating = input.rating;

    const interview = await db.$transaction(async (transaction) => {
      const updated = await transaction.interview.update({
        where: { id: input.interviewId },
        data,
        include: interviewInclude,
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'interview.update',
          resource: 'interview',
          resourceId: input.interviewId,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId, changedFields: Object.keys(data) }),
        },
      });
      return updated;
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to update interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const interviewId = request.nextUrl.searchParams.get('interviewId');
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!interviewId) {
      return NextResponse.json(
        { error: 'interviewId is required' },
        { status: 400 },
      );
    }
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.interview.findFirst({
      where: { id: interviewId, application: { job: { companyId } } },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }

    const interview = await db.interview.update({
      where: { id: interviewId },
      data: { status: 'CANCELLED' },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'interview.cancel',
        resource: 'interview',
        resourceId: interviewId,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({ companyId }),
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Failed to cancel interview:', error);
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 },
    );
  }
}
