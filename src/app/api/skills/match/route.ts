import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// POST /api/skills/match
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { candidateId, jobRequirements } = body as {
      candidateId: string;
      jobRequirements: string[];
    };

    if (!candidateId || !jobRequirements || !Array.isArray(jobRequirements)) {
      return NextResponse.json(
        { error: 'candidateId and jobRequirements (string array) are required' },
        { status: 400 }
      );
    }

    // Get candidate skills
    const candidateProfile = await db.candidateProfile.findUnique({
      where: { id: candidateId },
      include: {
        candidateSkills: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    const candidateSkillNames = candidateProfile.candidateSkills.map((cs: { id: string; level: string; yearsExperience: number | null; skillId: string }) => {
      return cs.skillId; // We'll resolve names from taxonomy
    });

    // Get taxonomy for all relevant skills
    const allTaxonomy = await db.skillsTaxonomy.findMany();
    const taxonomyMap = new Map(allTaxonomy.map((t: { id: string; name: string; category: string }) => [t.id, t]));

    const candidateSkillInfo = candidateProfile.candidateSkills.map((cs: { skillId: string; level: string; yearsExperience: number | null }) => {
      const tax = taxonomyMap.get(cs.skillId);
      return {
        name: tax?.name || cs.skillId,
        level: cs.level,
        yearsExperience: cs.yearsExperience,
      };
    });

    const candidateSkillNameSet = new Set(candidateSkillInfo.map((s: { name: string }) => s.name.toLowerCase()));

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const extraSkills: string[] = [];

    for (const req of jobRequirements) {
      if (candidateSkillNameSet.has(req.toLowerCase())) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    for (const cs of candidateSkillInfo) {
      if (!jobRequirements.some((r: string) => r.toLowerCase() === cs.name.toLowerCase())) {
        extraSkills.push(cs.name);
      }
    }

    // Calculate base match score
    const totalRequired = jobRequirements.length || 1;
    const baseScore = (matchedSkills.length / totalRequired) * 100;

    // Use AI for semantic matching and score refinement
    let matchScore = Math.round(baseScore);
    let aiAnalysis = '';

    try {
      const zai = await ZAI.create();
      const systemPrompt = `You are an expert skills matcher for hiring. Compare candidate skills against job requirements.
Consider semantic similarity (e.g., "JS" ≈ "JavaScript", "React" ≈ "React.js").
Also consider skill levels and years of experience when evaluating match quality.

Respond with a JSON object only:
{
  "matchScore": <number 0-100>,
  "analysis": "<brief analysis of the match, strengths, and gaps>"
}`;

      const userMessage = `Job Requirements: ${JSON.stringify(jobRequirements)}

Candidate Skills: ${JSON.stringify(candidateSkillInfo)}

Initial exact match: ${matchedSkills.length}/${jobRequirements.length} (${matchedSkills.join(', ') || 'none'})
Missing: ${missingSkills.join(', ') || 'none'}
Extra: ${extraSkills.join(', ') || 'none'}

Provide a refined match score considering semantic similarity and skill levels.`;

      const response = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);
      matchScore = typeof parsed.matchScore === 'number' ? parsed.matchScore : matchScore;
      aiAnalysis = parsed.analysis || '';
    } catch {
      // AI call failed, use base score
      aiAnalysis = `Exact match: ${matchedSkills.length}/${jobRequirements.length} skills matched.`;
    }

    return NextResponse.json({
      matchScore,
      matchedSkills,
      missingSkills,
      extraSkills,
      aiAnalysis,
      candidateSkillInfo,
    });
  } catch (error) {
    console.error('Error matching skills:', error);
    return NextResponse.json(
      { error: 'Failed to match skills' },
      { status: 500 }
    );
  }
}
