// @ts-nocheck - Complex Prisma types, validated at runtime
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { executeWorkflow, parseStepResults } from '@/lib/workflow-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const workflow = await db.hiringWorkflow.findUnique({ where: { id } });
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Workflow must be ACTIVE to trigger' },
        { status: 400 }
      );
    }

    // Create a WorkflowExecution
    const execution = await db.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        applicationId: body.applicationId || null,
        candidateId: body.candidateId || null,
        status: 'RUNNING',
        currentStep: 0,
        stepResults: '[]',
        triggeredBy: auth.userId,
      },
    });

    // Execute steps in the background (fire and forget)
    const triggerData = {
      applicationId: body.applicationId,
      candidateId: body.candidateId,
      jobId: body.jobId,
      companyId: workflow.companyId,
      userId: auth.userId,
      ...body.data,
    };

    executeWorkflow(
      workflow as unknown as Parameters<typeof executeWorkflow>[0],
      execution as unknown as Parameters<typeof executeWorkflow>[1],
      triggerData
    ).catch((err) => {
      console.error('Workflow execution error:', err);
    });

    return NextResponse.json({
      success: true,
      executionId: execution.id,
      message: 'Workflow triggered successfully',
    });
  } catch (error) {
    console.error('Workflow trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger workflow' }, { status: 500 });
  }
}
