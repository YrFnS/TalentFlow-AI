// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/screening-responses?applicationId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId query parameter is required' },
        { status: 400 }
      );
    }

    const responses = await db.screeningResponse.findMany({
      where: { applicationId },
    });

    // If no responses, return empty
    if (responses.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch related questions
    const questionIds = responses.map((r) => r.questionId);
    const questions = await db.screeningQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    // Combine responses with questions
    const combined = responses.map((r) => {
      const question = questions.find((q) => q.id === r.questionId);
      return {
        ...r,
        question: question
          ? {
              ...question,
              options: question.options ? JSON.parse(question.options) : null,
            }
          : null,
      };
    });

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Failed to fetch screening responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening responses' },
      { status: 500 }
    );
  }
}

// POST /api/screening-responses
// Body: { applicationId, responses: [{ questionId, answer }] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, responses } = body;

    if (!applicationId || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'applicationId and responses array are required' },
        { status: 400 }
      );
    }

    // Create all responses
    const created = await Promise.all(
      responses.map((r: { questionId: string; answer: string }) => {
        return db.screeningResponse.create({
          data: {
            questionId: r.questionId,
            applicationId,
            answer: r.answer,
            isKnockout: false,
          },
        });
      })
    );

    // Now evaluate knockout logic
    const questionIds = responses.map((r: { questionId: string }) => r.questionId);
    const questions = await db.screeningQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    let anyKnockout = false;
    for (const response of responses) {
      const question = questions.find((q) => q.id === response.questionId);
      if (question?.isKnockout && question.knockoutAnswer) {
        const isDisqualified =
          response.answer.toLowerCase().trim() ===
          question.knockoutAnswer.toLowerCase().trim();

        if (isDisqualified) {
          anyKnockout = true;
          const createdResponse = created.find(
            (c) => c.questionId === response.questionId
          );
          if (createdResponse) {
            await db.screeningResponse.update({
              where: { id: createdResponse.id },
              data: { isKnockout: true },
            });
          }
        }
      }
    }

    // If any knockout triggered, update application status to REJECTED
    if (anyKnockout) {
      await db.application.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          notes: 'Auto-disqualified by knockout screening question',
        },
      });
    }

    return NextResponse.json(
      {
        created: created.length,
        knockoutTriggered: anyKnockout,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create screening responses:', error);
    return NextResponse.json(
      { error: 'Failed to create screening responses' },
      { status: 500 }
    );
  }
}
