// @ts-nocheck
import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/generate-job-description
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, department, level, requirements } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are an expert HR copywriter and job description generator. Create a compelling, professional, and inclusive job description based on the provided information.

You MUST respond with a valid JSON object only (no markdown, no code fences, no additional text) with these exact fields:
{
  "description": "<a full, engaging 2-3 paragraph job description describing the role, team, and what makes this opportunity exciting>",
  "responsibilities": [<array of 5-7 specific responsibility strings>],
  "qualifications": [<array of 5-8 qualification strings including both required and preferred>],
  "benefits": [<array of 5-8 competitive benefit strings>]
}

Guidelines:
- Write in an engaging, professional tone
- Be inclusive and avoid biased language
- Make responsibilities specific and measurable where possible
- Include a mix of technical and soft skill qualifications
- Benefits should be realistic and competitive
- Do NOT use filler or generic content
- Tailor the description to the specified level and department`;

    const contextParts = [
      `Job Title: ${title}`,
      department && `Department: ${department}`,
      level && `Level: ${level}`,
      requirements && `Requirements: ${requirements}`,
    ]
      .filter(Boolean)
      .join('\n');

    const userMessage = `Please generate a comprehensive job description:\n\n${contextParts}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse AI response as JSON, stripping markdown code fences if present
    let jobDescription;
    try {
      const jsonStr = content
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();
      jobDescription = JSON.parse(jsonStr);
    } catch {
      jobDescription = {
        description: content,
        responsibilities: [],
        qualifications: [],
        benefits: [],
      };
    }

    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Error generating job description:', error);
    const message =
      error instanceof Error ? error.message : 'Job description generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
