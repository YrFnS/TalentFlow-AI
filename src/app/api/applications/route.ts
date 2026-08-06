// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  applicationUpdateSchema,
  companyApplicationCreateSchema,
  validateInput,
} from '@/lib/validation/schemas';
import { getClientIp } from '@/lib/security';

const APPLICATION_STATUSES = new Set([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFERED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

const WORKFLOW_CONTROLLED_STATUSES = new Set(['OFFERED', 'HIRED', 'WITHDRAWN']);

const applicationInclude = {
  job: {
    select: {
      id: true,
      title: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  },
  candidate: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  currentStage: true,
};

function isOfferControlledStage(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes('offer') || normalized.includes('hire');
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = request.nextUrl;
    const companyId = resolveCompanyId(auth, searchParams.get('companyId'));
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const where: Prisma.ApplicationWhereInput = { job: { companyId } };

    if (jobId) where.jobId = jobId;
    if (status && APPLICATION_STATUSES.has(status)) where.status = status as never;
    if (search) {
      where.OR = [
        {
          candidate: {
            user: { name: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          candidate: {
            user: { email: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          candidate: {
            currentTitle: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const applications = await db.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { appliedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(applicationUpdateSchema, body);
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

    if (
      input.status &&
      WORKFLOW_CONTROLLED_STATUSES.has(input.status)
    ) {
      return NextResponse.json(
        {
          error:
            input.status === 'WITHDRAWN'
              ? 'Only the candidate can withdraw an application'
              : 'Offer and hired statuses are managed by the secure offer workflow',
        },
        { status: 409 },
      );
    }

    if (
      input.status === undefined &&
      input.currentStageId === undefined &&
      input.notes === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one application field must be updated' },
        { status: 400 },
      );
    }

    const existing = await db.application.findFirst({
      where: { id: input.id, job: { companyId } },
      include: { job: { select: { title: true } }, currentStage: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    if (
      ['HIRED', 'WITHDRAWN'].includes(existing.status) &&
      (input.status !== undefined || input.currentStageId !== undefined)
    ) {
      return NextResponse.json(
        { error: 'This application is in a final state and cannot be moved' },
        { status: 409 },
      );
    }

    let targetStage: { id: string; name: string } | null = null;
    if (input.currentStageId) {
      targetStage = await db.pipelineStage.findFirst({
        where: { id: input.currentStageId, companyId },
        select: { id: true, name: true },
      });
      if (!targetStage) {
        return NextResponse.json(
          { error: 'Pipeline stage not found for this company' },
          { status: 400 },
        );
      }
      if (isOfferControlledStage(targetStage.name)) {
        return NextResponse.json(
          {
            error:
              'Offer and hired pipeline stages are managed by the secure offer workflow',
          },
          { status: 409 },
        );
      }
    }

    const application = await db.$transaction(async (transaction) => {
      if (
        input.currentStageId !== undefined &&
        input.currentStageId !== existing.currentStageId
      ) {
        await transaction.applicationStage.updateMany({
          where: { applicationId: input.id, exitedAt: null },
          data: { exitedAt: new Date() },
        });

        if (input.currentStageId) {
          await transaction.applicationStage.create({
            data: {
              applicationId: input.id,
              stageId: input.currentStageId,
            },
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (input.status !== undefined) updateData.status = input.status;
      if (input.currentStageId !== undefined) {
        updateData.currentStageId = input.currentStageId;
      }
      if (input.notes !== undefined) updateData.notes = input.notes;

      const updated = await transaction.application.update({
        where: { id: input.id },
        data: updateData,
        include: applicationInclude,
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'application.update',
          resource: 'application',
          resourceId: input.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            oldStatus: existing.status,
            newStatus: input.status,
            oldStageId: existing.currentStageId,
            newStageId: input.currentStageId,
            newStageName: targetStage?.name,
            jobTitle: existing.job.title,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Applications PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(companyApplicationCreateSchema, body);
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

    const [job, candidate] = await Promise.all([
      db.job.findFirst({
        where: { id: input.jobId, companyId },
        include: {
          company: {
            include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
          },
        },
      }),
      db.candidateProfile.findUnique({
        where: { id: input.candidateId },
        select: { id: true },
      }),
    ]);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const application = await db.$transaction(async (transaction) => {
      const created = await transaction.application.create({
        data: {
          jobId: input.jobId,
          candidateId: input.candidateId,
          coverLetter: input.coverLetter || null,
          source: input.source || 'recruiter',
          status: 'APPLIED',
          currentStageId: job.company.stages[0]?.id || null,
        },
      });

      if (job.company.stages[0]) {
        await transaction.applicationStage.create({
          data: {
            applicationId: created.id,
            stageId: job.company.stages[0].id,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'application.create_by_recruiter',
          resource: 'application',
          resourceId: created.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId, jobId: input.jobId }),
        },
      });

      return transaction.application.findUnique({
        where: { id: created.id },
        include: applicationInclude,
      });
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'This candidate already has an application for the job' },
        { status: 409 },
      );
    }

    console.error('Applications POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 },
    );
  }
}
