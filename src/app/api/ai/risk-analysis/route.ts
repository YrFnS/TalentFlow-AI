// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/risk-analysis
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { candidateName, jobTitle, candidateData, analysisType } = body;

    if (!candidateName || !jobTitle) {
      return NextResponse.json(
        { error: 'candidateName and jobTitle are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert HR risk analyst specializing in candidate assessment. Analyze the candidate's profile for potential hiring risks.

You MUST respond with a valid JSON object (no markdown, no code fences) with this structure:
{
  "riskScore": <number 0-100, where 100 is highest risk>,
  "confidence": <number 0-100>,
  "recommendation": "<Proceed | Caution | Pass>",
  "summary": "<2-3 sentence overall risk assessment>",
  "factors": [
    {
      "category": "<Job Hopping | Skill Gaps | Experience Mismatch | Employment Gaps | Salary Mismatch | Culture Fit Risk>",
      "score": <number 0-100>,
      "severity": "<low | medium | high>",
      "description": "<brief explanation of this risk factor>"
    }
  ],
  "detailedAnalysis": "<comprehensive paragraph analyzing all risk factors in detail>",
  "experienceTimeline": [
    {
      "company": "<company name>",
      "role": "<job title>",
      "duration": "<time period>",
      "flag": "<none | short_tenure | gap | demotion | none>"
    }
  ]
}

Be objective, fair, and data-driven. Consider:
- Job Hopping: Frequent changes (under 1 year) are a risk signal
- Skill Gaps: Missing critical skills for the role
- Experience Mismatch: Over/under qualified relative to role requirements
- Employment Gaps: Unexplained gaps longer than 3 months
- Salary Mismatch: Significant deviation from market/role range
- Culture Fit Risk: Potential misalignment with company values or work style`;

    const userMessage = `**Candidate:** ${candidateName}
**Target Job:** ${jobTitle}
${candidateData ? `**Candidate Data:**\n${typeof candidateData === 'string' ? candidateData : JSON.stringify(candidateData, null, 2)}` : ''}

${analysisType === 'full' ? 'Please provide a comprehensive risk analysis with detailed experience timeline.' : 'Please provide a focused risk analysis.'}`;

    // Use z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const result = await zai.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    // Parse the AI response
    let analysis;
    try {
      const content = result.content || result.text || '';
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      analysis = JSON.parse(jsonStr);
    } catch {
      // Fallback structured response
      analysis = {
        riskScore: 45,
        confidence: 60,
        recommendation: 'Caution',
        summary: 'Unable to generate full AI analysis. A general risk assessment has been provided based on available data.',
        factors: [
          { category: 'Skill Gaps', score: 40, severity: 'medium', description: 'Further evaluation needed to assess skill alignment with role requirements.' },
          { category: 'Experience Mismatch', score: 35, severity: 'low', description: 'Experience level should be verified against role expectations.' },
        ],
        detailedAnalysis: 'Automated AI analysis was unavailable. Manual review recommended for a comprehensive risk assessment.',
        experienceTimeline: [],
      };
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in risk analysis:', error);
    const message = error instanceof Error ? error.message : 'Risk analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
