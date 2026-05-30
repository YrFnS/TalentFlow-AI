import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/analyze-resume
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'resumeText and jobDescription are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are a professional resume analyst and ATS (Applicant Tracking System) expert. Analyze the given resume against the job description and provide a comprehensive, structured analysis.

You MUST respond with a valid JSON object only (no markdown, no code fences, no additional text) with these exact fields:
{
  "matchScore": <number 0-100 representing how well the resume matches the job>,
  "strengths": [<array of 3-5 strings describing what the candidate does well relative to the job>],
  "weaknesses": [<array of 3-5 strings describing areas where the candidate falls short>],
  "missingKeywords": [<array of important keywords/skills from the job description that are missing from the resume>],
  "recommendations": [<array of 3-5 specific, actionable strings for improving the resume for this job>]
}

Be specific, actionable, and realistic. Each string should be concise but informative.`;

    const userMessage = `Please analyze this resume against the job description:

**RESUME:**
${resumeText}

**JOB DESCRIPTION:**
${jobDescription}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse AI response as JSON, stripping markdown code fences if present
    let analysis;
    try {
      const jsonStr = content
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        matchScore: 0,
        strengths: [],
        weaknesses: [],
        missingKeywords: [],
        recommendations: [],
        rawText: content,
      };
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in resume analysis:', error);
    const message =
      error instanceof Error ? error.message : 'Resume analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
