// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { requireCompanyMember } from '@/lib/auth-guard';

// POST /api/candidates/compare
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { jobId, candidateIds, candidates, jobTitle, requiredSkills } = body;

    if (!jobId || !candidateIds || candidateIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 candidate IDs and a job ID are required' },
        { status: 400 }
      );
    }

    if (!candidates || candidates.length < 2) {
      return NextResponse.json(
        { error: 'Candidate data is required for comparison' },
        { status: 400 }
      );
    }

    // Build candidate summaries for the AI prompt
    const candidateSummaries = candidates.map((c: {
      name: string;
      currentTitle: string;
      skills: string[];
      experienceYears: number;
      education: string;
      matchScore: number;
      scores: { skills: number; experience: number; education: number; cultureFit: number; technical: number; communication: number };
    }) => {
      const matchedSkills = c.skills.filter((s: string) => requiredSkills.includes(s));
      const missingSkills = requiredSkills.filter((s: string) => !c.skills.includes(s));
      return `
**${c.name}** - ${c.currentTitle}
- Match Score: ${c.matchScore}%
- Experience: ${c.experienceYears} years
- Education: ${c.education}
- Skills Matched: ${matchedSkills.join(', ')} (${matchedSkills.length}/${requiredSkills.length})
- Skills Missing: ${missingSkills.join(', ') || 'None'}
- Score Breakdown: Skills=${c.scores.skills}, Experience=${c.scores.experience}, Education=${c.scores.education}, Culture Fit=${c.scores.cultureFit}, Technical=${c.scores.technical}, Communication=${c.scores.communication}`;
    }).join('\n');

    const systemPrompt = `You are an expert HR analyst and hiring consultant. You are comparing candidates for a position.

You MUST respond with a valid JSON object (no markdown, no code fences) with this structure:
{
  "insights": [
    {
      "candidateId": "<the candidate's id>",
      "candidateName": "<the candidate's name>",
      "pros": ["<strength 1>", "<strength 2>", "<strength 3>"],
      "cons": ["<concern 1>", "<concern 2>"],
      "recommendation": "<Strongly Recommended | Recommended | Consider with Reservations | Not Recommended>",
      "confidence": <number 0-100>
    }
  ]
}

Provide specific, actionable insights. Compare candidates relative to each other. Consider skills match, experience depth, and potential risks.`;

    const userMessage = `Compare the following candidates for the **${jobTitle}** position.

**Required Skills:** ${requiredSkills.join(', ')}

**Candidates:**
${candidateSummaries}

Please provide a detailed comparison with pros, cons, and a recommendation for each candidate.`;

    // Use z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const result = await zai.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    // Parse the AI response
    let insights;
    try {
      const content = result.content || result.text || '';
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      const parsed = JSON.parse(jsonStr);
      insights = parsed.insights || parsed;
    } catch {
      // If parsing fails, create fallback insights from the candidates data
      insights = candidates.map((c: {
        id: string;
        name: string;
        matchScore: number;
        skills: string[];
        scores: { technical: number; communication: number; cultureFit: number };
        experienceYears: number;
      }) => ({
        candidateId: c.id,
        candidateName: c.name,
        pros: [
          `Match score of ${c.matchScore}% indicates ${c.matchScore >= 85 ? 'strong' : 'good'} alignment`,
          `${c.experienceYears} years of professional experience`,
          `Technical proficiency rated at ${c.scores.technical}/100`,
        ],
        cons: [
          c.scores.cultureFit < 85 ? 'Culture fit requires further evaluation' : 'May need onboarding time for specific tools',
          c.skills.filter((s: string) => requiredSkills.includes(s)).length < requiredSkills.length
            ? `Missing ${requiredSkills.length - c.skills.filter((s: string) => requiredSkills.includes(s)).length} required skills`
            : 'No major skill gaps identified',
        ],
        recommendation: c.matchScore >= 90 ? 'Strongly Recommended' : c.matchScore >= 80 ? 'Recommended' : 'Consider with Reservations',
        confidence: c.matchScore >= 90 ? 90 : c.matchScore >= 80 ? 75 : 60,
      }));
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in candidate comparison:', error);
    const message = error instanceof Error ? error.message : 'Comparison failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
