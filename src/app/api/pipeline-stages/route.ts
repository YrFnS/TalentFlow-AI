// @ts-nocheck - Prisma input types are validated with Zod at runtime.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import {
  pipelineStageCreateSchema,
  validateInput,
} from '@/lib/validation/schemas';

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

    const stages = await db.pipelineStage.findMany({
      where: { companyId },
      include: {
        currentStageApplications: {
          where: { job: { companyId } },
          include: {
            candidate: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
            job: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error('Pipeline stages GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(pipelineStageCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const companyId = resolveCompanyId(auth, input.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const duplicate = await db.pipelineStage.findFirst({
      where: {
        companyId,
        name: { equals: input.name, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'A pipeline stage with this name already exists' },
        { status: 409 },
      );
    }

    const maxOrder = await db.pipelineStage.aggregate({
      where: { companyId },
      _max: { order: true },
    });

    const stage = await db.pipelineStage.create({
      data: {
        companyId,
        name: input.name,
        color: input.color || '#14b8a6',
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Pipeline stages POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline stage' },
      { status: 500 },
    );
  }
}
