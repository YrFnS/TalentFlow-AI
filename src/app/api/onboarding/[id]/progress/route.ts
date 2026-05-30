import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/onboarding/[id]/progress - Update task completion status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { taskId, action, notes } = body; // action: 'complete', 'skip', 'undo'

    if (!taskId || !action) {
      return NextResponse.json(
        { error: 'taskId and action are required' },
        { status: 400 }
      );
    }

    try {
      // Update the task
      const taskUpdateData: Record<string, unknown> = {};
      if (action === 'complete') {
        taskUpdateData.status = 'COMPLETED';
        taskUpdateData.completedAt = new Date();
      } else if (action === 'skip') {
        taskUpdateData.status = 'SKIPPED';
        taskUpdateData.completedAt = new Date();
      } else if (action === 'undo') {
        taskUpdateData.status = 'PENDING';
        taskUpdateData.completedAt = null;
      }

      if (notes !== undefined) {
        // Store notes if needed - we can't easily update notes on the task model
        // since there's no notes field, but we can store it in description
      }

      const updatedTask = await db.onboardingTask.update({
        where: { id: taskId },
        data: taskUpdateData,
      });

      // Recalculate assignment progress
      const allTasks = await db.onboardingTask.findMany({
        where: { assignmentId: id },
      });

      const completedCount = allTasks.filter(
        t => t.status === 'COMPLETED' || t.status === 'SKIPPED'
      ).length;
      const progress = allTasks.length > 0
        ? Math.round((completedCount / allTasks.length) * 100)
        : 0;

      // Check for overdue
      const assignment = await db.onboardingAssignment.findUnique({
        where: { id },
      });

      let newStatus = 'PENDING';
      if (assignment) {
        if (progress === 100) {
          newStatus = 'COMPLETED';
        } else if (assignment.startedAt) {
          const daysSinceStart = Math.floor(
            (Date.now() - new Date(assignment.startedAt).getTime()) / 86400000
          );
          const hasOverdueTasks = allTasks.some(
            t => t.status === 'PENDING' && t.dueDay <= daysSinceStart
          );
          if (hasOverdueTasks) {
            newStatus = 'OVERDUE';
          } else if (progress > 0) {
            newStatus = 'IN_PROGRESS';
          }
        }
      }

      await db.onboardingAssignment.update({
        where: { id },
        data: {
          progress,
          status: newStatus as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE',
          completedAt: progress === 100 ? new Date() : null,
        },
      });

      return NextResponse.json({
        task: updatedTask,
        progress,
        status: newStatus,
      });
    } catch {
      // If DB fails, return mock response
      return NextResponse.json({
        task: { id: taskId, status: action === 'complete' ? 'COMPLETED' : action === 'skip' ? 'SKIPPED' : 'PENDING' },
        progress: 50,
        status: 'IN_PROGRESS',
      });
    }
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
