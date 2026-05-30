import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const workflow = await db.hiringWorkflow.findUnique({
      where: { id },
      include: {
        _count: { select: { executions: true } },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.hiringWorkflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.trigger !== undefined) updateData.trigger = body.trigger;
    if (body.triggerConfig !== undefined) {
      updateData.triggerConfig = typeof body.triggerConfig === 'string'
        ? body.triggerConfig
        : JSON.stringify(body.triggerConfig);
    }
    if (body.steps !== undefined) {
      updateData.steps = typeof body.steps === 'string' ? body.steps : JSON.stringify(body.steps);
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;

    const workflow = await db.hiringWorkflow.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { executions: true } },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const existing = await db.hiringWorkflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    await db.hiringWorkflow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Workflow DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
