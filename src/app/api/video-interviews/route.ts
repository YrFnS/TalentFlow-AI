// @ts-nocheck - Prisma payloads are tenant-checked and validated before writes.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const VIDEO_STATUSES = new Set([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
]);

const questionSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  type: z.string().trim().min(1).max(50).default('general'),
});

const createVideoInterviewSchema = z.object({
  companyId: z.string().max(200).optional(),
  applicationId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(250),
  description: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.string().trim().max(10000).optional(),
    ),
  questions: z.array(questionSchema).min(1).max(30),
  responseDeadline: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'responseDeadline must be a valid date',
      }).optional(),
    ),
  maxRetakes: z.coerce.number().int().min(0).max(5).default(1),
  timePerQuestion: z.coerce.number().int().min(30).max(900).default(90),
});

function parseQuestions(value: string): Array<{ text: string; type: string }> {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeInterview(interview: any, application: any) {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    title: interview.title,
    description: interview.description,
    questions: parseQuestions(interview.questions),
    responseDeadline: interview.responseDeadline,
    maxRetakes: interview.maxRetakes,
    timePerQuestion: interview.timePerQuestion,
    status: interview.status,
    completedAt: interview.completedAt,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
    responses: interview.responses || [],
    application: application
      ? {
          id: application.id,
          status: application.status,
          candidate: {
            id: application.candidate.id,
            user: application.candidate.user,
          },
          job: application.job,
        }
      : null,
  };
}

async function getCompanyApplications(companyId: string) {
  return db.application.findMany({
    where: { job: { companyId } },
    include: {
      candidate: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      job: {
        select: { id: true, title: true, companyId: true },
      },
    },
    orderBy: { appliedAt: 'desc' },
    take: 300,
  });
}

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
    if (status && status !== 'all' && !VIDEO_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    const applications = await getCompanyApplications(companyId);
    if (applications.length === 0) return NextResponse.json([]);

    const applicationById = new Map(
      applications.map((application) => [application.id, application]),
    );

    const interviews = await db.videoInterview.findMany({
      where: {
        applicationId: { in: [...applicationById.keys()] },
        ...(status && status !== 'all' ? { status: status as never } : {}),
      },
      include: {
        responses: { orderBy: { questionIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(
      interviews.map((interview) =>
        serializeInterview(interview, applicationById.get(interview.applicationId)),
      ),
    );
  } catch (error) {
    console.error('Video interviews GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video interviews' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = createVideoInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues
            .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
            .join(', '),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const companyId = resolveCompanyId(auth, input.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const application = await db.application.findFirst({
      where: {
        id: input.applicationId,
        job: { companyId },
        status: { notIn: ['HIRED', 'REJECTED', 'WITHDRAWN'] },
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        job: { select: { id: true, title: true, companyId: true } },
      },
    });
    if (!application) {
      return NextResponse.json(
        { error: 'Eligible application not found' },
        { status: 404 },
      );
    }

    const deadline = input.responseDeadline
      ? new Date(input.responseDeadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (deadline <= new Date()) {
      return NextResponse.json(
        { error: 'responseDeadline must be in the future' },
        { status: 400 },
      );
    }

    const existing = await db.videoInterview.findFirst({
      where: {
        applicationId: application.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This application already has an active video interview' },
        { status: 409 },
      );
    }

    const interview = await db.$transaction(async (transaction) => {
      const created = await transaction.videoInterview.create({
        data: {
          applicationId: application.id,
          title: input.title,
          description: input.description || null,
          questions: JSON.stringify(input.questions),
          responseDeadline: deadline,
          maxRetakes: input.maxRetakes,
          timePerQuestion: input.timePerQuestion,
          status: 'PENDING',
        },
        include: { responses: true },
      });

      if (application.status !== 'INTERVIEW') {
        await transaction.application.update({
          where: { id: application.id },
          data: { status: 'INTERVIEW' },
        });
      }

      await transaction.notification.create({
        data: {
          userId: application.candidate.user.id,
          title: 'Video interview assigned',
          message: `${application.job.title} has a new video interview assignment.`,
          type: 'interview',
          link: '/candidate/video-interview',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'video_interview.create',
          resource: 'video_interview',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            applicationId: application.id,
            deadline,
            questionCount: input.questions.length,
          }),
        },
      });

      return created;
    });

    return NextResponse.json(serializeInterview(interview, application), {
      status: 201,
    });
  } catch (error) {
    console.error('Video interviews POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create video interview' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const id = request.nextUrl.searchParams.get('id');
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await db.videoInterview.findUnique({
      where: { id },
      include: { responses: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Video interview not found' }, { status: 404 });
    }

    const application = await db.application.findFirst({
      where: { id: existing.applicationId, job: { companyId } },
      include: {
        candidate: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        job: { select: { id: true, title: true, companyId: true } },
      },
    });
    if (!application) {
      return NextResponse.json({ error: 'Video interview not found' }, { status: 404 });
    }
    if (!['PENDING', 'IN_PROGRESS'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Only active video interviews can be cancelled' },
        { status: 409 },
      );
    }

    const updated = await db.$transaction(async (transaction) => {
      const result = await transaction.videoInterview.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { responses: true },
      });

      await transaction.notification.create({
        data: {
          userId: application.candidate.user.id,
          title: 'Video interview cancelled',
          message: `The video interview for ${application.job.title} was cancelled.`,
          type: 'interview',
          link: '/candidate/video-interview',
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'video_interview.cancel',
          resource: 'video_interview',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId, applicationId: application.id }),
        },
      });

      return result;
    });

    return NextResponse.json(serializeInterview(updated, application));
  } catch (error) {
    console.error('Video interviews DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel video interview' },
      { status: 500 },
    );
  }
}
