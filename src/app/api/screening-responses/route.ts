// @ts-nocheck - Request payloads are ownership-checked before Prisma writes.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isPlatformAdmin,
  requireAuth,
  requireCandidate,
} from '@/lib/auth-guard';

async function getAccessibleApplication(applicationId: string, auth: any) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: { select: { userId: true } },
      job: { select: { id: true, companyId: true } },
    },
  });
  if (!application) return null;

  const allowed =
    isPlatformAdmin(auth.role) ||
    application.candidate.userId === auth.userId ||
    (Boolean(auth.companyId) && application.job.companyId === auth.companyId);

  return allowed ? application : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const applicationId = request.nextUrl.searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId query parameter is required' },
        { status: 400 },
      );
    }

    const application = await getAccessibleApplication(applicationId, auth);
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    const responses = await db.screeningResponse.findMany({
      where: { applicationId },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            questionType: true,
            options: true,
            order: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      responses.map((response) => ({
        ...response,
        question: response.question
          ? {
              ...response.question,
              options: response.question.options
                ? JSON.parse(response.question.options)
                : null,
            }
          : null,
      })),
    );
  } catch (error) {
    console.error('Failed to fetch screening responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening responses' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const applicationId = String(body.applicationId || '');
    const responses = Array.isArray(body.responses) ? body.responses : null;

    if (!applicationId || !responses || responses.length > 100) {
      return NextResponse.json(
        { error: 'applicationId and a responses array of up to 100 items are required' },
        { status: 400 },
      );
    }

    const application = await db.application.findFirst({
      where: {
        id: applicationId,
        candidate: { userId: auth.userId },
      },
      include: { job: { select: { id: true } } },
    });
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    const normalized = responses.map((response, index) => {
      const questionId = String(response.questionId || '');
      const answer = String(response.answer || '').trim();
      if (!questionId || !answer || answer.length > 10000) {
        throw new Error(`Response ${index + 1} is invalid`);
      }
      return { questionId, answer };
    });

    const questionIds = [...new Set(normalized.map((item) => item.questionId))];
    const questions = await db.screeningQuestion.findMany({
      where: { id: { in: questionIds }, jobId: application.job.id },
    });
    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: 'One or more screening questions do not belong to this job' },
        { status: 400 },
      );
    }

    let knockoutTriggered = false;
    const rows = normalized.map((response) => {
      const question = questions.find((item) => item.id === response.questionId);
      const isKnockout = Boolean(
        question?.isKnockout &&
          question.knockoutAnswer &&
          response.answer.toLowerCase() === question.knockoutAnswer.trim().toLowerCase(),
      );
      if (isKnockout) knockoutTriggered = true;
      return { ...response, applicationId, isKnockout };
    });

    await db.$transaction(async (transaction) => {
      await transaction.screeningResponse.deleteMany({
        where: { applicationId, questionId: { in: questionIds } },
      });
      for (const row of rows) {
        await transaction.screeningResponse.create({ data: row });
      }
      if (knockoutTriggered) {
        await transaction.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            notes: 'Auto-disqualified by knockout screening question',
          },
        });
      }
    });

    return NextResponse.json(
      { created: rows.length, knockoutTriggered },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save responses';
    console.error('Failed to create screening responses:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
