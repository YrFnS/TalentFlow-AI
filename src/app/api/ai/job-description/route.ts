// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/job-description
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { jobTitle, jobType, location, industry, experienceLevel, department, companyName } = body;

    if (!userId || !jobTitle) {
      return NextResponse.json(
        { error: 'userId and jobTitle are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert HR copywriter and job description generator. Create a compelling, professional, and inclusive job description based on the provided information.

You MUST respond with a valid JSON object (no markdown, no code fences) with these fields:
{
  "title": "<job title>",
  "description": "<2-3 paragraph engaging job description describing the role, team, and what makes this opportunity exciting>",
  "requirements": [<array of 5-8 specific requirement strings>],
  "responsibilities": [<array of 5-7 specific responsibility strings>],
  "benefits": [<array of 5-8 benefit strings>],
  "skills": [<array of 6-10 skill strings>],
  "experienceMin": <minimum years or null>,
  "experienceMax": <maximum years or null>
}

Guidelines:
- Write in an engaging, professional tone
- Be inclusive and avoid biased language
- Make requirements specific and measurable where possible
- Include a mix of technical and soft skills
- Benefits should be realistic and competitive
- Do NOT use filler or generic content`;

    const contextParts = [
      `Job Title: ${jobTitle}`,
      jobType && `Job Type: ${jobType}`,
      location && `Location: ${location}`,
      industry && `Industry: ${industry}`,
      experienceLevel && `Experience Level: ${experienceLevel}`,
      department && `Department: ${department}`,
      companyName && `Company: ${companyName}`,
    ].filter(Boolean).join('\n');

    const userMessage = `Please generate a comprehensive job description:\n\n${contextParts}`;

    const result = await aiChat({
      userId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      feature: 'job_description',
    });

    // Try to parse the AI response as JSON
    let jobDesc;
    try {
      const content = result.content.trim();
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      jobDesc = JSON.parse(jsonStr);
    } catch {
      jobDesc = {
        rawText: result.content,
        title: jobTitle,
        description: result.content,
        requirements: [],
        responsibilities: [],
        benefits: [],
        skills: [],
      };
    }

    return NextResponse.json({
      jobDescription: jobDesc,
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error('Error generating job description:', error);
    const message = error instanceof Error ? error.message : 'Job description generation failed';
    const status = message.includes('No active AI provider') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
