// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/skill-gap-analysis
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { currentSkills, targetRole, currentRole } = body;

    if (!userId || !currentSkills || !targetRole) {
      return NextResponse.json(
        { error: 'userId, currentSkills, and targetRole are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a career development expert and skills analyst. Analyze the gap between the candidate's current skills and the skills needed for their target role.

You MUST respond with a valid JSON object (no markdown, no code fences) with these fields:
{
  "matchScore": <number 0-100>,
  "targetRole": "<the target role>",
  "currentSkills": {
    "matched": [<array of objects: { "skill": string, "level": "beginner|intermediate|advanced|expert", "relevance": "high|medium|low" }>],
    "transferable": [<array of strings of skills that can transfer>]
  },
  "missingSkills": {
    "critical": [<array of objects: { "skill": string, "why": string, "priority": "critical" }>],
    "important": [<array of objects: { "skill": string, "why": string, "priority": "important" }>],
    "nice": [<array of objects: { "skill": string, "why": string, "priority": "nice_to_have" }>]
  },
  "learningResources": [<array of objects: { "skill": string, "resource": string, "type": "course|book|project|certification", "duration": string, "url": string|null }>],
  "marketDemand": {
    "trend": "growing|stable|declining",
    "averageSalary": "<salary range string>",
    "topCompanies": [<array of strings>],
    "outlook": "<brief outlook string>"
  },
  "recommendedPath": [<array of objects: { "step": number, "action": string, "timeline": string }>],
  "summary": "<2-3 sentence overall assessment>"
}

Be specific, realistic, and actionable. Provide real learning resource suggestions when possible.`;

    const userMessage = `**CURRENT SKILLS:**\n${Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills}\n\n**TARGET ROLE:** ${targetRole}\n${currentRole ? `**CURRENT ROLE:** ${currentRole}\n` : ''}\nPlease provide a comprehensive skill gap analysis.`;

    const result = await aiChat({
      userId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      feature: 'skill_gap_analysis',
    });

    // Try to parse the AI response as JSON
    let analysis;
    try {
      const content = result.content.trim();
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        rawText: result.content,
        matchScore: null,
      };
    }

    return NextResponse.json({
      analysis,
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error('Error in skill gap analysis:', error);
    const message = error instanceof Error ? error.message : 'Skill gap analysis failed';
    const status = message.includes('No active AI provider') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
