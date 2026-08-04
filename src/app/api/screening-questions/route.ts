// @ts-nocheck - Request payloads are normalized before Prisma writes.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getOptionalAuth,
  isPlatformAdmin,
  requireCompanyEditor,
  resolveCompanyId,
} from '@/lib/auth-guard';

const QUESTION_TYPES = new Set([
  'YES_NO',
  'MULTIPLE_CHOICE',
  'TEXT',
  'NUMBER',
  'DATE',
]);

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 },
      );
    }

    const auth = await getOptionalAuth();
    const isCandidateView = !auth || auth.role === 'CANDIDATE';
    const job = await db.job.findFirst({
      where: isCandidateView
        ? { id: jobId, status: 'OPEN', publishedAt: { not: null } }
        : isPlatformAdmin(auth.role)
          ? { id: jobId }
          : auth.companyId
            ? { id: jobId, companyId: auth.companyId }
            : { id: '__forbidden__' },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const questions = await db.screeningQuestion.findMany({
      where: { jobId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(
      questions.map((question) => ({
        id: question.id,
        jobId: question.jobId,
        question: question.question,
        questionType: question.questionType,
        options: question.options ? JSON.parse(question.options) : null,
        isRequired: question.isRequired,
        isKnockout: isCandidateView ? undefined : question.isKnockout,
        knockoutAnswer: isCandidateView ? undefined : question.knockoutAnswer,
        order: question.order,
      })),
    );
  } catch (error) {
    console.error('Failed to fetch screening questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening questions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { jobId, questions } = body as {
      jobId?: string;
      companyId?: string;
      questions?: Array<Record<string, unknown>>;
    };

    if (!jobId || !Array.isArray(questions) || questions.length > 100) {
      return NextResponse.json(
        { error: 'jobId and a questions array of up to 100 items are required' },
        { status: 400 },
      );
    }

    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const job = await db.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const normalized = questions.map((raw, index) => {
      const question = String(raw.question || '').trim();
      const questionType = String(raw.questionType || 'YES_NO');
      const options = Array.isArray(raw.options)
        ? raw.options.map(String).map((option) => option.trim()).filter(Boolean)
        : null;

      if (!question || question.length > 2000) {
        throw new Error(`Question ${index + 1} is empty or too long`);
      }
      if (!QUESTION_TYPES.has(questionType)) {
        throw new Error(`Question ${index + 1} has an invalid type`);
      }

      return {
        jobId,
        question,
        questionType,
        options: options ? JSON.stringify(options) : null,
        isRequired: raw.isRequired !== false,
        isKnockout: raw.isKnockout === true,
        knockoutAnswer: raw.knockoutAnswer
          ? String(raw.knockoutAnswer).slice(0, 1000)
          : null,
        order: Number.isInteger(raw.order) ? Number(raw.order) : index,
      };
    });

    const created = await db.$transaction(async (transaction) => {
      await transaction.screeningQuestion.deleteMany({ where: { jobId } });
      for (const question of normalized) {
        await transaction.screeningQuestion.create({ data: question });
      }
      return transaction.screeningQuestion.findMany({
        where: { jobId },
        orderBy: { order: 'asc' },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save questions';
    console.error('Failed to save screening questions:', error);
    return NextResponse.json({ error: message }, { status: 400 });
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
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 },
      );
    }
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const question = await db.screeningQuestion.findUnique({
      where: { id },
      select: { id: true, jobId: true },
    });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const owningJob = await db.job.findFirst({
      where: { id: question.jobId, companyId },
      select: { id: true },
    });
    if (!owningJob) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await db.screeningQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete screening question:', error);
    return NextResponse.json(
      { error: 'Failed to delete screening question' },
      { status: 500 },
    );
  }
}
