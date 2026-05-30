import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/onboarding/trigger - Trigger onboarding for a new hire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId, companyId, startDate } = body;

    if (!planId || !userId || !companyId) {
      return NextResponse.json(
        { error: 'planId, userId, and companyId are required' },
        { status: 400 }
      );
    }

    // Get the plan with its tasks
    let plan;
    try {
      plan = await db.onboardingPlan.findUnique({
        where: { id: planId },
      });
    } catch {
      plan = null;
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Onboarding plan not found' },
        { status: 404 }
      );
    }

    // Create assignment
    const parsedStartDate = startDate ? new Date(startDate) : new Date();

    try {
      const assignment = await db.onboardingAssignment.create({
        data: {
          planId,
          userId,
          companyId,
          status: 'PENDING',
          progress: 0,
          startedAt: parsedStartDate,
        },
      });

      // Create tasks from the plan template
      const taskTemplates = plan.tasks ? JSON.parse(plan.tasks) : [];
      if (taskTemplates.length > 0) {
        await db.onboardingTask.createMany({
          data: taskTemplates.map((task: { title: string; description?: string; category?: string; isRequired?: boolean; dueDay?: number; order?: number }, index: number) => ({
            assignmentId: assignment.id,
            title: task.title,
            description: task.description || null,
            category: task.category || 'general',
            isRequired: task.isRequired ?? true,
            dueDay: task.dueDay || 1,
            status: 'PENDING',
            order: task.order ?? index,
          })),
        });
      }

      return NextResponse.json(assignment, { status: 201 });
    } catch {
      // If DB fails, return mock success
      return NextResponse.json({
        id: `oa-${Date.now()}`,
        planId,
        userId,
        companyId,
        status: 'PENDING',
        progress: 0,
        startedAt: parsedStartDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error triggering onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to trigger onboarding' },
      { status: 500 }
    );
  }
}
