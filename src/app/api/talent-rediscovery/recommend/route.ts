import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Mock past candidates data for fallback
const mockCandidates = [
  {
    id: '1', name: 'Alex Rivera', currentTitle: 'Senior Full-Stack Developer', location: 'San Francisco, CA',
    experienceYears: 8, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    matchScore: 95, lastActive: '2025-02-15', matchReasons: ['React Expert', '8+ Years Exp', 'Previously Interviewed'],
    appliedBefore: 'Senior Frontend Engineer — Jan 2025', availability: 'open_to_work',
    confidence: 'High',
    reasoning: 'Strong React/TypeScript background matching the frontend engineer role. Previously interviewed and scored well. Currently open to work.',
  },
  {
    id: '2', name: 'Priya Patel', currentTitle: 'Product Designer Lead', location: 'Remote',
    experienceYears: 6, skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'CSS'],
    matchScore: 88, lastActive: '2025-01-28', matchReasons: ['Design Systems', 'Remote Ready', 'High Interview Score'],
    appliedBefore: 'UX Designer — Nov 2024', availability: 'available',
    confidence: 'High',
    reasoning: 'Design systems expertise aligns with the role. Previously applied and received positive feedback. Remote-capable.',
  },
  {
    id: '3', name: 'Marcus Johnson', currentTitle: 'DevOps Engineer', location: 'Austin, TX',
    experienceYears: 5, skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],
    matchScore: 82, lastActive: '2025-03-01', matchReasons: ['DevOps Skills', 'AWS Certified', 'Cultural Fit'],
    appliedBefore: 'Cloud Engineer — Dec 2024', availability: 'available',
    confidence: 'Medium',
    reasoning: 'Cloud infrastructure skills are transferable. AWS certification is a plus. Previously applied for a related role.',
  },
  {
    id: '6', name: 'Emma Williams', currentTitle: 'Engineering Manager', location: 'London, UK',
    experienceYears: 10, skills: ['Leadership', 'Agile', 'React', 'Node.js', 'Strategy'],
    matchScore: 78, lastActive: '2025-01-10', matchReasons: ['Leadership', 'Tech Background', 'Previously Offered'],
    appliedBefore: 'Tech Lead — Aug 2024', availability: 'available',
    confidence: 'Medium',
    reasoning: 'Previously offered a position but declined due to timing. Technical background with leadership experience may fit senior roles.',
  },
];

const jobSkillsMap: Record<string, string[]> = {
  j1: ['React', 'TypeScript', 'Next.js', 'Frontend', 'JavaScript'],
  j2: ['Figma', 'User Research', 'Design Systems', 'UI/UX', 'Prototyping'],
  j3: ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'Statistics'],
  j4: ['Java', 'Spring Boot', 'Microservices', 'REST API', 'Backend'],
  j5: ['Kubernetes', 'Docker', 'CI/CD', 'AWS', 'Terraform'],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, companyId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const jobSkills = jobSkillsMap[jobId] || ['React', 'TypeScript'];

    // Try AI-powered recommendation
    try {
      const zai = await ZAI.create();

      const prompt = `You are an AI talent recommendation engine. Given a job position, recommend the best past candidates from the database.

Job ID: ${jobId}
Required Skills: ${jobSkills.join(', ')}

Past Candidates:
${mockCandidates.map(c => `- ID: ${c.id}, Name: ${c.name}, Title: ${c.currentTitle}, Skills: ${c.skills.join(', ')}, Experience: ${c.experienceYears} years, Availability: ${c.availability}`).join('\n')}

Return a JSON array of recommended candidates with id, matchScore (0-100), confidence (High/Medium/Low), and reasoning (string explaining why). Return only valid JSON, no markdown.`;

      const result = await zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const content = result.choices[0]?.message?.content || '';
      if (content) {
        try {
          const jsonStr = content
            .replace(/^```(?:json)?\s*\n?/, '')
            .replace(/\n?```\s*$/, '')
            .trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            const enriched = parsed.map((aiResult: { id?: string; matchScore?: number; confidence?: string; reasoning?: string }, idx: number) => {
              const mock = mockCandidates[idx] || mockCandidates[0];
              return {
                ...mock,
                id: aiResult.id || mock.id,
                matchScore: aiResult.matchScore || mock.matchScore,
                confidence: aiResult.confidence || mock.confidence,
                reasoning: aiResult.reasoning || mock.reasoning,
              };
            }).sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore);

            return NextResponse.json({ recommendations: enriched });
          }
        } catch {
          // Fall through to mock
        }
      }
    } catch {
      // AI failed, use mock
    }

    // Filter and rank mock candidates based on job skills
    const ranked = mockCandidates.map(c => {
      const matchingSkills = c.skills.filter(s =>
        jobSkills.some(js => s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase()))
      );
      const scoreBoost = matchingSkills.length * 8;
      return {
        ...c,
        matchScore: Math.min(99, c.matchScore + scoreBoost),
        matchReasons: [...c.matchReasons, ...matchingSkills.map(s => `Skill Match: ${s}`)].slice(0, 5),
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ recommendations: ranked });
  } catch (error) {
    console.error('Talent rediscovery recommend error:', error);
    return NextResponse.json({ recommendations: mockCandidates });
  }
}
