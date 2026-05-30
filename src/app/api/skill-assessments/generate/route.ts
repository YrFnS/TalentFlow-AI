import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// POST /api/skill-assessments/generate
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { skillIds, type, difficulty, count } = body as {
      skillIds: string[];
      type: string;
      difficulty: string;
      count: number;
    };

    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json(
        { error: 'skillIds (non-empty array) is required' },
        { status: 400 }
      );
    }

    // Get skill names from taxonomy
    const taxonomy = await db.skillsTaxonomy.findMany({
      where: { id: { in: skillIds } },
    });
    const skillNames = taxonomy.map((t: { id: string; name: string; category: string }) => ({
      id: t.id,
      name: t.name,
      category: t.category,
    }));

    if (skillNames.length === 0) {
      return NextResponse.json(
        { error: 'No valid skills found for given IDs' },
        { status: 400 }
      );
    }

    const questionCount = Math.min(Math.max(count || 5, 1), 20);
    const questionType = type || 'CUSTOM';
    const questionDifficulty = difficulty || 'MEDIUM';

    try {
      const zai = await ZAI.create();

      const typeInstruction = questionType === 'CODING'
        ? 'coding/programming questions with code snippets'
        : questionType === 'SITUATIONAL'
        ? 'situational judgment questions with workplace scenarios'
        : questionType === 'BEHAVIORAL'
        ? 'behavioral questions about past experiences'
        : 'mixed type questions (multiple choice, true/false, short answer)';

      const systemPrompt = `You are an expert assessment creator for a skills-based hiring platform.
Generate ${questionCount} ${typeInstruction} at ${questionDifficulty} difficulty level for the following skills.

For each question, provide:
- question: the question text
- type: "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", or "CODING"
- options: array of options (for multiple choice only, empty array otherwise)
- correctAnswer: the correct answer
- skillId: the skill ID this question tests
- difficulty: "${questionDifficulty}"
- points: point value (default 1)

Respond with a JSON object only:
{
  "questions": [<array of question objects>]
}

Ensure questions are practical, relevant to real-world scenarios, and properly mapped to the skills.`;

      const userMessage = `Skills to assess:
${skillNames.map((s: { id: string; name: string; category: string }) => `- ${s.name} (${s.category}) [ID: ${s.id}]`).join('\n')}

Generate ${questionCount} questions at ${questionDifficulty} difficulty.`;

      const response = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      return NextResponse.json({
        questions: parsed.questions || [],
        skills: skillNames,
      });
    } catch (aiError) {
      console.error('AI generation failed, creating fallback questions:', aiError);

      // Fallback: generate simple questions without AI
      const fallbackQuestions = skillNames.flatMap((skill: { id: string; name: string }) => {
        const qTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
        return Array.from({ length: Math.ceil(questionCount / skillNames.length) }, (_, i) => ({
          question: `Question ${i + 1} about ${skill.name}: How would you demonstrate proficiency in ${skill.name}?`,
          type: qTypes[i % qTypes.length],
          options: qTypes[i % qTypes.length] === 'MULTIPLE_CHOICE'
            ? ['Strong proficiency', 'Moderate proficiency', 'Basic knowledge', 'No experience']
            : [],
          correctAnswer: qTypes[i % qTypes.length] === 'MULTIPLE_CHOICE' ? 'Strong proficiency'
            : qTypes[i % qTypes.length] === 'TRUE_FALSE' ? 'true' : '',
          skillId: skill.id,
          difficulty: questionDifficulty,
          points: 1,
        }));
      }).slice(0, questionCount);

      return NextResponse.json({
        questions: fallbackQuestions,
        skills: skillNames,
      });
    }
  } catch (error) {
    console.error('Error generating assessment questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate assessment questions' },
      { status: 500 }
    );
  }
}
