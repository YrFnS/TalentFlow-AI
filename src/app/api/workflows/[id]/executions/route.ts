import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const workflow = await db.hiringWorkflow.findUnique({ where: { id } });
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const executions = await db.workflowExecution.findMany({
      where: { workflowId: id },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.workflowExecution.count({
      where: { workflowId: id },
    });

    return NextResponse.json({ executions, total });
  } catch (error) {
    console.error('Workflow executions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
  }
}
