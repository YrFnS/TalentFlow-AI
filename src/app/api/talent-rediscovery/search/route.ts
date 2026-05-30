import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Mock past candidates data for fallback
const mockCandidates = [
  {
    id: '1', name: 'Alex Rivera', currentTitle: 'Senior Full-Stack Developer', location: 'San Francisco, CA',
    experienceYears: 8, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    matchScore: 92, lastActive: '2025-02-15', matchReasons: ['React Expert', '8+ Years Exp', 'Previously Interviewed'],
    appliedBefore: 'Senior Frontend Engineer — Jan 2025', availability: 'open_to_work',
  },
  {
    id: '2', name: 'Priya Patel', currentTitle: 'Product Designer Lead', location: 'Remote',
    experienceYears: 6, skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'CSS'],
    matchScore: 87, lastActive: '2025-01-28', matchReasons: ['Design Systems', 'Remote Ready', 'High Interview Score'],
    appliedBefore: 'UX Designer — Nov 2024', availability: 'available',
  },
  {
    id: '3', name: 'Marcus Johnson', currentTitle: 'DevOps Engineer', location: 'Austin, TX',
    experienceYears: 5, skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],
    matchScore: 84, lastActive: '2025-03-01', matchReasons: ['DevOps Skills', 'AWS Certified', 'Cultural Fit'],
    appliedBefore: 'Cloud Engineer — Dec 2024', availability: 'available',
  },
  {
    id: '4', name: 'Sophie Chen', currentTitle: 'Data Scientist', location: 'New York, NY',
    experienceYears: 4, skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Visualization'],
    matchScore: 79, lastActive: '2024-12-20', matchReasons: ['ML Experience', 'Python Skills', 'Strong Portfolio'],
    appliedBefore: 'ML Engineer — Sep 2024', availability: 'not_available',
  },
  {
    id: '5', name: 'Omar Al-Farsi', currentTitle: 'Backend Developer', location: 'Dubai, UAE',
    experienceYears: 7, skills: ['Java', 'Spring Boot', 'Microservices', 'Redis', 'MongoDB'],
    matchScore: 76, lastActive: '2025-02-05', matchReasons: ['Backend Expert', '7+ Years Exp', 'International'],
    appliedBefore: 'Senior Backend Dev — Oct 2024', availability: 'open_to_work',
  },
  {
    id: '6', name: 'Emma Williams', currentTitle: 'Engineering Manager', location: 'London, UK',
    experienceYears: 10, skills: ['Leadership', 'Agile', 'React', 'Node.js', 'Strategy'],
    matchScore: 73, lastActive: '2025-01-10', matchReasons: ['Leadership', 'Tech Background', 'Previously Offered'],
    appliedBefore: 'Tech Lead — Aug 2024', availability: 'available',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills, experienceMin, experienceMax, location, jobTitle, companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Try AI-powered search
    try {
      const zai = await ZAI.create();

      const prompt = `You are a talent rediscovery engine. Given the following search criteria, rank past candidates by relevance and return match scores.

Search Criteria:
- Skills: ${skills || 'any'}
- Experience: ${experienceMin || 0}-${experienceMax || 'any'} years
- Location: ${location || 'any'}
- Job Title: ${jobTitle || 'any'}

Past Candidates:
${mockCandidates.map(c => `- ${c.name}: ${c.currentTitle}, ${c.experienceYears}y exp, skills: ${c.skills.join(', ')}, location: ${c.location}`).join('\n')}

Return a JSON array of candidates with id, matchScore (0-100), and matchReasons (array of strings). Return only valid JSON, no markdown.`;

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
            const enriched = parsed.map((aiResult: { id?: string; matchScore?: number; matchReasons?: string[] }, idx: number) => {
              const mock = mockCandidates[idx] || mockCandidates[0];
              return {
                ...mock,
                id: aiResult.id || mock.id,
                matchScore: aiResult.matchScore || mock.matchScore,
                matchReasons: aiResult.matchReasons || mock.matchReasons,
              };
            }).sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore);

            return NextResponse.json({ candidates: enriched });
          }
        } catch {
          // Fall through to mock
        }
      }
    } catch {
      // AI failed, use mock
    }

    // Filter mock candidates by criteria
    let filtered = [...mockCandidates];

    if (skills) {
      const skillList = skills.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      if (skillList.length > 0) {
        filtered = filtered.filter(c =>
          skillList.some((skill: string) => c.skills.some(s => s.toLowerCase().includes(skill)))
        );
      }
    }

    if (experienceMin) {
      filtered = filtered.filter(c => c.experienceYears >= experienceMin);
    }

    if (experienceMax) {
      filtered = filtered.filter(c => c.experienceYears <= experienceMax);
    }

    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(c => c.location.toLowerCase().includes(loc));
    }

    if (jobTitle) {
      const title = jobTitle.toLowerCase();
      filtered = filtered.filter(c => c.currentTitle.toLowerCase().includes(title));
    }

    // Recalculate match scores based on criteria
    filtered = filtered.map(c => {
      let score = c.matchScore;
      if (skills) {
        const skillList = skills.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        const matchCount = skillList.filter((skill: string) => c.skills.some(s => s.toLowerCase().includes(skill))).length;
        score = Math.min(100, score + matchCount * 3);
      }
      return { ...c, matchScore: Math.min(100, score) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ candidates: filtered });
  } catch (error) {
    console.error('Talent rediscovery search error:', error);
    return NextResponse.json({ candidates: mockCandidates });
  }
}
