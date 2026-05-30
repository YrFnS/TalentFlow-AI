import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireCandidate } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// POST /api/skill-assessments/[id]/take
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCandidate();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { answers } = body as { answers: unknown[] };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'answers array is required' },
        { status: 400 }
      );
    }

    const assessment = await db.skillAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (!assessment.isActive) {
      return NextResponse.json(
        { error: 'Assessment is not active' },
        { status: 400 }
      );
    }

    const questions: { question: string; type: string; options?: string[]; correctAnswer?: string; skillId: string; difficulty: string }[] = JSON.parse(assessment.questions || '[]');

    // Score the assessment
    let correctCount = 0;
    const totalQuestions = questions.length || 1;
    const skillScores: Record<string, { correct: number; total: number; score: number }> = {};

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const answer = answers[i];
      const skillId = q.skillId || 'unknown';

      if (!skillScores[skillId]) {
        skillScores[skillId] = { correct: 0, total: 0, score: 0 };
      }
      skillScores[skillId].total++;

      // For multiple choice / true-false, check exact match
      if (q.correctAnswer && typeof answer === 'string') {
        const isCorrect = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        if (isCorrect) {
          correctCount++;
          skillScores[skillId].correct++;
        }
      }
    }

    // Calculate per-skill scores
    for (const skillId of Object.keys(skillScores)) {
      skillScores[skillId].score = Math.round(
        (skillScores[skillId].correct / (skillScores[skillId].total || 1)) * 100
      );
    }

    const overallScore = Math.round((correctCount / totalQuestions) * 100);

    // Use AI for open-ended answers evaluation
    const openEndedQuestions = questions.filter((q, i) => q.type === 'TEXT' || q.type === 'OPEN_ENDED' || !q.correctAnswer);
    let aiFeedback: Record<string, string> = {};

    if (openEndedQuestions.length > 0) {
      try {
        const zai = await ZAI.create();
        const openEndedData = openEndedQuestions.map((q, idx) => {
          const qIndex = questions.indexOf(q);
          return {
            question: q.question,
            answer: answers[qIndex] || '',
            skillId: q.skillId,
          };
        });

        const systemPrompt = `You are an expert skills assessor. Evaluate the candidate's open-ended answers.
For each answer, provide brief constructive feedback.
Respond with a JSON object mapping skill names to feedback strings:
{ "SkillName": "Brief feedback about the candidate's proficiency in this area" }`;

        const userMessage = `Please evaluate these answers:

${JSON.stringify(openEndedData, null, 2)}`;

        const response = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });

        const content = response.choices[0]?.message?.content || '';
        const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        aiFeedback = JSON.parse(jsonStr);
      } catch {
        aiFeedback = { general: 'Assessment completed successfully.' };
      }
    }

    // Determine overall level
    let overallLevel = 'BEGINNER';
    if (overallScore >= 90) overallLevel = 'EXPERT';
    else if (overallScore >= 70) overallLevel = 'ADVANCED';
    else if (overallScore >= 50) overallLevel = 'INTERMEDIATE';

    // Get candidate profile
    const candidateProfile = await db.candidateProfile.findFirst({
      where: { userId: auth.userId },
    });

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    // Save result
    const result = await db.skillAssessmentResult.create({
      data: {
        assessmentId: id,
        candidateId: candidateProfile.id,
        answers: JSON.stringify(answers),
        score: overallScore,
        skillScores: JSON.stringify(skillScores),
        overallLevel,
        aiFeedback: JSON.stringify(aiFeedback),
      },
    });

    // Get skill names for response
    const skillIds = Object.keys(skillScores);
    const taxonomy = await db.skillsTaxonomy.findMany({
      where: { id: { in: skillIds } },
    });
    const taxonomyMap = new Map(taxonomy.map((t: { id: string; name: string }) => [t.id, t.name]));

    const enrichedSkillScores = Object.entries(skillScores).map(([sid, data]) => ({
      skillId: sid,
      skillName: taxonomyMap.get(sid) || sid,
      ...data,
    }));

    return NextResponse.json({
      result: {
        id: result.id,
        score: overallScore,
        overallLevel,
        skillScores: enrichedSkillScores,
        aiFeedback,
        passed: overallScore >= assessment.passingScore,
        passingScore: assessment.passingScore,
      },
    });
  } catch (error) {
    console.error('Error taking assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
