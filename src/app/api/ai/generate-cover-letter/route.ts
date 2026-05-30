import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/generate-cover-letter
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { jobDescription, candidateName, candidateEmail, candidateSkills, candidateExperience, candidateCurrentTitle, candidateBio } = body;

    if (!userId || !jobDescription) {
      return NextResponse.json(
        { error: 'userId and jobDescription are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert professional cover letter writer. Generate a compelling, personalized cover letter based on the job description and candidate information provided.

Guidelines:
- Write in a professional but engaging tone
- Connect the candidate's experience directly to the job requirements
- Use specific examples and metrics where possible
- Keep it concise (3-4 paragraphs, under 400 words)
- Include a strong opening that grabs attention
- End with a confident call-to-action
- Do NOT use generic filler phrases
- Address the hiring manager professionally
- Format with proper paragraphs and spacing

Return ONLY the cover letter text, no additional commentary or metadata.`;

    const candidateInfo = [
      candidateName && `Name: ${candidateName}`,
      candidateEmail && `Email: ${candidateEmail}`,
      candidateCurrentTitle && `Current Title: ${candidateCurrentTitle}`,
      candidateSkills && `Skills: ${candidateSkills}`,
      candidateExperience && `Experience: ${candidateExperience}`,
      candidateBio && `Bio: ${candidateBio}`,
    ].filter(Boolean).join('\n');

    const userMessage = `**JOB DESCRIPTION:**\n${jobDescription}\n\n**CANDIDATE INFO:**\n${candidateInfo || 'No additional candidate info provided.'}\n\nPlease write a professional cover letter for this candidate applying to this position.`;

    const result = await aiChat({
      userId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      feature: 'cover_letter',
    });

    return NextResponse.json({
      coverLetter: result.content.trim(),
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    const message = error instanceof Error ? error.message : 'Cover letter generation failed';
    const status = message.includes('No active AI provider') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
