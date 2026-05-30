import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/career-advice
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { currentRole, experience, goals, skills } = body;

    if (!currentRole || !goals) {
      return NextResponse.json(
        { error: 'currentRole and goals are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are a professional career advisor and coach with deep knowledge of industry trends, career paths, and professional development. Provide personalized, actionable career advice based on the user's background and goals.

You MUST respond with a valid JSON object only (no markdown, no code fences, no additional text) with these exact fields:
{
  "advice": "<a comprehensive 3-5 paragraph career advice string, providing strategic guidance tailored to the user's situation>",
  "suggestedRoles": [<array of 3-5 objects, each with: {
    "title": "<suggested job title>",
    "matchScore": <number 0-100 representing how well this role matches the user's profile>,
    "reason": "<a concise explanation of why this role is a good fit>"
  }>],
  "skillsToDevelop": [<array of 3-6 objects, each with: {
    "skill": "<name of the skill to develop>",
    "priority": "<one of: high, medium, low>",
    "resources": "<specific resources or approaches to develop this skill, as a concise string>"
  }>]
}

Guidelines:
- Be specific and actionable, not generic
- Consider the user's current experience level when suggesting roles
- Match scores should be realistic (not all 90+)
- Suggest roles that are achievable next steps, not unrealistic jumps
- Skills should be directly relevant to the user's career goals
- Resources should be practical and specific (e.g., specific certifications, platforms, project types)
- Prioritize skills based on impact and relevance to stated goals`;

    const userInfo = [
      `Current Role: ${currentRole}`,
      experience && `Experience: ${experience}`,
      `Career Goals: ${goals}`,
      skills && `Current Skills: ${skills}`,
    ]
      .filter(Boolean)
      .join('\n');

    const userMessage = `Please provide personalized career advice:\n\n${userInfo}`;

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
        advice: content,
        suggestedRoles: [],
        skillsToDevelop: [],
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error providing career advice:', error);
    const message =
      error instanceof Error ? error.message : 'Career advice generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
