// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/onboarding - List onboarding plans and assignments for the company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const plans = await db.onboardingPlan.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const assignments = await db.onboardingAssignment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // Get tasks for each assignment
    const assignmentsWithTasks = await Promise.all(
      assignments.map(async (assignment) => {
        const tasks = await db.onboardingTask.findMany({
          where: { assignmentId: assignment.id },
          orderBy: { order: 'asc' },
        });
        return { ...assignment, tasks };
      })
    );

    return NextResponse.json({
      plans: plans.map(p => ({
        ...p,
        tasks: p.tasks ? JSON.parse(p.tasks) : [],
      })),
      assignments: assignmentsWithTasks,
    });
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding data' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Create new onboarding plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, description, duration, tasks } = body;

    if (!companyId || !name) {
      return NextResponse.json(
        { error: 'companyId and name are required' },
        { status: 400 }
      );
    }

    const plan = await db.onboardingPlan.create({
      data: {
        companyId,
        name,
        description: description || null,
        duration: duration || 14,
        tasks: JSON.stringify(tasks || []),
        isActive: true,
      },
    });

    return NextResponse.json({
      ...plan,
      tasks: JSON.parse(plan.tasks),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding plan:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding plan' },
      { status: 500 }
    );
  }
}
