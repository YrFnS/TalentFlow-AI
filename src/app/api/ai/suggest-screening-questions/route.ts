// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, jobDescription } = await request.json();

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'jobTitle is required' },
        { status: 400 }
      );
    }

    const sdk = ZAI.create();

    const result = await sdk.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an HR screening question generator. Generate 3-5 relevant screening questions for a job position. Return ONLY a valid JSON array of objects with this structure: [{"question": "string", "questionType": "YES_NO|MULTIPLE_CHOICE|TEXT|NUMBER|DATE", "options": ["option1","option2"] (only for MULTIPLE_CHOICE), "isRequired": true, "isKnockout": boolean, "knockoutAnswer": "string or null"}]. Ensure at least 1-2 are knockout questions. questionType must be one of: YES_NO, MULTIPLE_CHOICE, TEXT, NUMBER, DATE. Do NOT wrap in markdown code blocks.',
        },
        {
          role: 'user',
          content: `Job Title: ${jobTitle}\n${jobDescription ? `Job Description: ${jobDescription}` : ''}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = result.choices?.[0]?.message?.content || '[]';

    let questions;
    try {
      // Strip markdown code blocks if present
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      questions = JSON.parse(cleaned);
    } catch {
      questions = [];
    }

    if (!Array.isArray(questions)) {
      questions = [];
    }

    // Validate and normalize questions
    const validTypes = ['YES_NO', 'MULTIPLE_CHOICE', 'TEXT', 'NUMBER', 'DATE'];
    const normalized = questions
      .filter(
        (q: { question?: string; questionType?: string }) =>
          q.question && q.questionType && validTypes.includes(q.questionType)
      )
      .map(
        (
          q: {
            question: string;
            questionType: string;
            options?: string[];
            isRequired?: boolean;
            isKnockout?: boolean;
            knockoutAnswer?: string | null;
          },
          index: number
        ) => ({
          question: q.question,
          questionType: q.questionType,
          options:
            q.questionType === 'MULTIPLE_CHOICE' && Array.isArray(q.options)
              ? q.options
              : null,
          isRequired: q.isRequired ?? true,
          isKnockout: q.isKnockout ?? false,
          knockoutAnswer: q.isKnockout ? q.knockoutAnswer || null : null,
          order: index,
        })
      );

    return NextResponse.json({ questions: normalized });
  } catch (error) {
    console.error('Failed to suggest screening questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate screening questions' },
      { status: 500 }
    );
  }
}
