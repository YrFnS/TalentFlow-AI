// @ts-nocheck - Complex Prisma types, validated at runtime
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;

    const workflows = await db.hiringWorkflow.findMany({
      where,
      include: {
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Workflows GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const companyId = auth.companyId || body.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const { name, description, trigger, triggerConfig, steps, status } = body;

    if (!name || !trigger || !steps) {
      return NextResponse.json(
        { error: 'Name, trigger, and steps are required' },
        { status: 400 }
      );
    }

    const workflow = await db.hiringWorkflow.create({
      data: {
        companyId,
        name,
        description: description || null,
        trigger,
        triggerConfig: triggerConfig ? (typeof triggerConfig === 'string' ? triggerConfig : JSON.stringify(triggerConfig)) : null,
        steps: typeof steps === 'string' ? steps : JSON.stringify(steps),
        status: status || 'DRAFT',
      },
      include: {
        _count: { select: { executions: true } },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Workflows POST error:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
