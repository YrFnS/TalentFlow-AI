import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/screening-questions?jobId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 }
      );
    }

    const questions = await db.screeningQuestion.findMany({
      where: { jobId },
      orderBy: { order: 'asc' },
    });

    // Parse options JSON for each question
    const parsed = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Failed to fetch screening questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening questions' },
      { status: 500 }
    );
  }
}

// POST /api/screening-questions
// Body: { jobId, questions: [...] }  — creates/replaces all questions for a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, questions } = body;

    if (!jobId || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'jobId and questions array are required' },
        { status: 400 }
      );
    }

    // Delete existing questions for this job
    await db.screeningQuestion.deleteMany({
      where: { jobId },
    });

    // Create new questions
    const created = await Promise.all(
      questions.map((q: {
        question: string;
        questionType: string;
        options?: string[] | null;
        isRequired: boolean;
        isKnockout: boolean;
        knockoutAnswer?: string | null;
        order: number;
      }, index: number) =>
        db.screeningQuestion.create({
          data: {
            jobId,
            question: q.question,
            questionType: q.questionType || 'YES_NO',
            options: q.options ? JSON.stringify(q.options) : null,
            isRequired: q.isRequired ?? true,
            isKnockout: q.isKnockout ?? false,
            knockoutAnswer: q.knockoutAnswer || null,
            order: q.order ?? index,
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create screening questions:', error);
    return NextResponse.json(
      { error: 'Failed to create screening questions' },
      { status: 500 }
    );
  }
}

// DELETE /api/screening-questions?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    await db.screeningQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete screening question:', error);
    return NextResponse.json(
      { error: 'Failed to delete screening question' },
      { status: 500 }
    );
  }
}
