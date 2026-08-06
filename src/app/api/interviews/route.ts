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
import { BUILTIN_EMAIL_TEMPLATES, sendEmail } from '@/lib/email-service';

const INTERVIEW_STATUSES = new Set([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

const interviewInclude = {
  application: {
    include: {
      candidate: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
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
        ...(status && INTERVIEW_STATUSES.has(status)
          ? { status: status as never }
          : {}),
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
        job: { select: { id: true, title: true } },
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }
    if (['REJECTED', 'WITHDRAWN', 'HIRED'].includes(application.status)) {
      return NextResponse.json(
        { error: 'This application is not eligible for an interview' },
        { status: 409 },
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
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Interview time must be in the future' },
        { status: 400 },
      );
    }

    const interviewStage = await db.pipelineStage.findFirst({
      where: {
        companyId,
        name: { contains: 'interview', mode: 'insensitive' },
      },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

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
          feedback: input.notes || null,
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

      if (interviewStage && application.currentStageId !== interviewStage.id) {
        await transaction.applicationStage.updateMany({
          where: { applicationId: application.id, exitedAt: null },
          data: { exitedAt: new Date() },
        });
        await transaction.applicationStage.create({
          data: {
            applicationId: application.id,
            stageId: interviewStage.id,
          },
        });
      }

      await transaction.application.update({
        where: { id: application.id },
        data: {
          status: 'INTERVIEW',
          ...(interviewStage ? { currentStageId: interviewStage.id } : {}),
        },
      });

      await transaction.notification.create({
        data: {
          userId: application.candidate.user.id,
          title: 'Interview scheduled',
          message: `Your interview for ${application.job.title} is scheduled for ${scheduledAt.toLocaleString()}.`,
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
            type: input.type,
          }),
        },
      });

      return transaction.interview.findUnique({
        where: { id: created.id },
        include: interviewInclude,
      });
    });

    try {
      await sendEmail({
        to: application.candidate.user.email,
        subject: `Interview scheduled — ${application.job.title}`,
        body: BUILTIN_EMAIL_TEMPLATES.interviewScheduled(
          application.candidate.user.name,
          application.job.title,
          scheduledAt.toLocaleDateString(),
          scheduledAt.toLocaleTimeString(),
          input.meetingLink || input.location || input.type.replaceAll('_', ' '),
        ),
        companyId,
        userId: application.candidate.user.id,
      });
    } catch (emailError) {
      console.error('Interview email failed:', emailError);
    }

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
      include: { application: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }
    if (
      input.status &&
      ['COMPLETED', 'CANCELLED'].includes(existing.status) &&
      input.status !== existing.status
    ) {
      return NextResponse.json(
        { error: 'A completed or cancelled interview cannot be reopened' },
        { status: 409 },
      );
    }

    const data: Record<string, unknown> = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.feedback !== undefined) data.feedback = input.feedback;
    if (input.rating !== undefined) data.rating = input.rating;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'At least one interview field must be updated' },
        { status: 400 },
      );
    }

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
          details: JSON.stringify({
            companyId,
            oldStatus: existing.status,
            newStatus: input.status,
            changedFields: Object.keys(data),
          }),
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
      include: {
        application: {
          include: {
            candidate: { include: { user: { select: { id: true } } } },
            job: { select: { title: true } },
          },
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'A completed interview cannot be cancelled' },
        { status: 409 },
      );
    }
    if (existing.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This interview is already cancelled' },
        { status: 409 },
      );
    }

    const interview = await db.$transaction(async (transaction) => {
      const updated = await transaction.interview.update({
        where: { id: interviewId },
        data: { status: 'CANCELLED' },
        include: interviewInclude,
      });

      await transaction.notification.create({
        data: {
          userId: existing.application.candidate.user.id,
          title: 'Interview cancelled',
          message: `Your interview for ${existing.application.job.title} has been cancelled.`,
          type: 'interview',
          link: '/candidate/interview-prep',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'interview.cancel',
          resource: 'interview',
          resourceId: interviewId,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId }),
        },
      });

      return updated;
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
