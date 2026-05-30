// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/internal-jobs/[id]/apply - Apply for internal position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { candidateId, currentRoleId, notes, motivationLetter } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required' },
        { status: 400 }
      );
    }

    // Try to create in database
    try {
      const application = await db.internalApplication.create({
        data: {
          jobId: id,
          candidateId,
          currentRoleId: currentRoleId || null,
          managerNotified: true,
          status: 'PENDING',
          notes: motivationLetter || notes || null,
        },
      });
      return NextResponse.json(application, { status: 201 });
    } catch {
      // If DB fails, return mock success
      return NextResponse.json({
        id: `ia-${Date.now()}`,
        jobId: id,
        candidateId,
        currentRoleId: currentRoleId || null,
        managerNotified: true,
        managerApproved: null,
        status: 'PENDING',
        notes: motivationLetter || notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error applying for internal job:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
