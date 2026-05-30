// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/interviews/[id]/scorecard
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { templateId, ratings, overallRecommendation, overallNotes, interviewerId } = body;

    if (!templateId || !ratings || !overallRecommendation) {
      return NextResponse.json({ error: 'templateId, ratings, and overallRecommendation are required' }, { status: 400 });
    }

    // Verify interview exists
    const interview = await db.interview.findUnique({ where: { id } });
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Get template
    const template = await db.scorecardTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Build scorecard data
    const scorecardData = {
      templateId,
      templateName: template.name,
      criteria: ratings,
      overallRecommendation,
      overallNotes: overallNotes || '',
      submittedAt: new Date().toISOString(),
    };

    // Update the interview assignment with the scorecard
    if (interviewerId) {
      await db.interviewAssignment.updateMany({
        where: { interviewId: id, interviewerId },
        data: {
          scorecard: JSON.stringify(scorecardData),
          notes: overallNotes || undefined,
        },
      });
    }

    // Also update the interview feedback
    await db.interview.update({
      where: { id },
      data: {
        feedback: JSON.stringify(scorecardData),
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ success: true, scorecard: scorecardData }, { status: 201 });
  } catch (error) {
    console.error('Error submitting scorecard:', error);
    return NextResponse.json({ error: 'Failed to submit scorecard' }, { status: 500 });
  }
}
