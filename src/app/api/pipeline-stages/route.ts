import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const stages = await db.pipelineStage.findMany({
      where: { companyId },
      include: {
        currentStageApplications: {
          include: {
            candidate: {
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
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
    return NextResponse.json({ error: 'Failed to fetch pipeline stages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const companyId = auth.companyId || body.companyId;
    const { name, color } = body;

    const maxOrder = await db.pipelineStage.aggregate({
      where: { companyId },
      _max: { order: true },
    });

    const stage = await db.pipelineStage.create({
      data: {
        companyId,
        name,
        color: color || '#14b8a6',
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Pipeline stages POST error:', error);
    return NextResponse.json({ error: 'Failed to create pipeline stage' }, { status: 500 });
  }
}
