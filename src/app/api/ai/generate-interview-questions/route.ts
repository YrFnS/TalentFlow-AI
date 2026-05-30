import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/generate-interview-questions
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { role, level, type, count } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      );
    }

    const questionType = type || 'mixed';
    const questionCount = Math.min(Math.max(count || 5, 1), 20);

    const zai = await ZAI.create();

    const typeLabel =
      questionType === 'technical'
        ? 'Technical'
        : questionType === 'behavioral'
          ? 'Behavioral'
          : 'Mixed (Technical and Behavioral)';

    const systemPrompt = `You are an expert interview coach and hiring manager. Generate high-quality interview questions for the specified role and level.

You MUST respond with a valid JSON object only (no markdown, no code fences, no additional text) with these exact fields:
{
  "questions": [<array of ${questionCount} objects, each with: {
    "question": "<the interview question as a string>",
    "category": "<one of: technical, behavioral, situational, cultural-fit>",
    "difficulty": "<one of: easy, medium, hard>",
    "evaluationCriteria": "<what to look for in the candidate's answer, as a concise string>"
  }>]
}

Guidelines:
- Generate exactly ${questionCount} questions of type: ${typeLabel}
- Tailor questions to the ${level || 'mid'} level for a ${role} position
- For technical questions, focus on practical skills and problem-solving
- For behavioral questions, use scenarios relevant to the role
- For situational questions, present realistic workplace challenges
- Make evaluation criteria specific and actionable
- Vary difficulty levels appropriately for the specified level
- Avoid generic questions; make each one specific to the role`;

    const userMessage = `Generate ${questionCount} ${typeLabel.toLowerCase()} interview questions for a ${level || 'mid-level'} ${role} position.`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse AI response as JSON, stripping markdown code fences if present
    let result;
    try {
      const jsonStr = content
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();
      result = JSON.parse(jsonStr);
    } catch {
      result = {
        questions: [
          {
            question: content,
            category: 'general',
            difficulty: 'medium',
            evaluationCriteria: 'Evaluate the overall response quality and relevance.',
          },
        ],
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating interview questions:', error);
    const message =
      error instanceof Error ? error.message : 'Interview question generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
