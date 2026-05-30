// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/interview-prep
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { jobDescription, candidateProfile, interviewType } = body;

    if (!userId || !jobDescription) {
      return NextResponse.json(
        { error: 'userId and jobDescription are required' },
        { status: 400 }
      );
    }

    const interviewTypeLabel = interviewType === 'technical'
      ? 'Technical Interview'
      : interviewType === 'behavioral'
        ? 'Behavioral Interview'
        : interviewType === 'system-design'
          ? 'System Design Interview'
          : interviewType === 'case-study'
            ? 'Case Study Interview'
            : 'General Interview';

    const systemPrompt = `You are an expert interview coach and career advisor. Prepare a comprehensive interview preparation guide for the candidate based on the job description and their profile.

You MUST respond with a valid JSON object (no markdown, no code fences) with these fields:
{
  "interviewType": "<type of interview>",
  "overview": "<brief overview of what to expect>",
  "commonQuestions": [<array of objects: { "question": string, "type": "technical|behavioral|situational", "suggestedApproach": string, "sampleAnswer": string }>],
  "technicalTopics": [<array of strings of key technical topics to study>],
  "behavioralQuestions": [<array of objects: { "question": string, "starExample": string }>],
  "tips": {
    "before": [<array of strings of preparation tips>],
    "during": [<array of strings of tips for during the interview>],
    "after": [<array of strings of post-interview tips>]
  },
  "practiceExercise": {
    "title": "<exercise title>",
    "description": "<what to practice>",
    "steps": [<array of strings>]
  },
  "questionsToAsk": [<array of strings of good questions to ask the interviewer>],
  "redFlags": [<array of strings of things to avoid>],
  "summary": "<encouraging closing statement>"
}

Provide at least 5 common questions and 3 behavioral questions. Make the sample answers specific to the role. Be encouraging but realistic.`;

    const candidateInfo = candidateProfile
      ? `\n**CANDIDATE PROFILE:**\n${candidateProfile}`
      : '';

    const userMessage = `**JOB DESCRIPTION:**\n${jobDescription}\n**INTERVIEW TYPE:** ${interviewTypeLabel}${candidateInfo}\n\nPlease provide a comprehensive interview preparation guide.`;

    const result = await aiChat({
      userId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      feature: 'interview_prep',
    });

    // Try to parse the AI response as JSON
    let guide;
    try {
      const content = result.content.trim();
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      guide = JSON.parse(jsonStr);
    } catch {
      guide = {
        rawText: result.content,
      };
    }

    return NextResponse.json({
      guide,
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error('Error in interview prep:', error);
    const message = error instanceof Error ? error.message : 'Interview preparation failed';
    const status = message.includes('No active AI provider') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
