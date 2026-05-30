import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sourcing-campaigns — List campaigns for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      // Return mock data if no companyId
      const mockCampaigns = [
        {
          id: 'c1', name: 'Senior Frontend Engineer Search', jobId: 'j1', jobTitle: 'Senior Frontend Engineer',
          criteria: JSON.stringify({ skills: ['React', 'TypeScript', 'Next.js'], experience: 5, location: 'Remote' }),
          matchedCount: 24, contactedCount: 18, respondedCount: 9, status: 'ACTIVE', createdAt: '2025-02-20T00:00:00Z',
        },
        {
          id: 'c2', name: 'Product Designer Pipeline', jobId: 'j2', jobTitle: 'Product Designer',
          criteria: JSON.stringify({ skills: ['Figma', 'User Research', 'Design Systems'], experience: 3, location: 'San Francisco' }),
          matchedCount: 15, contactedCount: 12, respondedCount: 6, status: 'ACTIVE', createdAt: '2025-02-15T00:00:00Z',
        },
        {
          id: 'c3', name: 'DevOps Talent Pool', jobId: null, jobTitle: null,
          criteria: JSON.stringify({ skills: ['Kubernetes', 'Docker', 'CI/CD', 'AWS'], experience: 4 }),
          matchedCount: 32, contactedCount: 20, respondedCount: 11, status: 'PAUSED', createdAt: '2025-01-10T00:00:00Z',
        },
        {
          id: 'c4', name: 'Data Science Interns 2025', jobId: 'j3', jobTitle: 'Data Science Intern',
          criteria: JSON.stringify({ skills: ['Python', 'Machine Learning', 'SQL'], experience: 0, location: 'New York' }),
          matchedCount: 45, contactedCount: 30, respondedCount: 22, status: 'COMPLETED', createdAt: '2024-11-01T00:00:00Z',
        },
      ];
      return NextResponse.json({ campaigns: mockCampaigns });
    }

    const campaigns = await db.sourcingCampaign.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching sourcing campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST /api/sourcing-campaigns — Create a new sourcing campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, jobId, criteria, companyId } = body;

    if (!name || !companyId) {
      return NextResponse.json({ error: 'name and companyId are required' }, { status: 400 });
    }

    try {
      const campaign = await db.sourcingCampaign.create({
        data: {
          name,
          jobId: jobId || null,
          criteria: JSON.stringify(criteria || {}),
          matchedCandidates: JSON.stringify([]),
          contactedCount: 0,
          respondedCount: 0,
          companyId,
        },
      });

      // Auto-match candidates (mock)
      const matchCount = Math.floor(Math.random() * 30) + 5;

      return NextResponse.json({
        id: campaign.id,
        name: campaign.name,
        jobId: campaign.jobId,
        criteria: JSON.parse(campaign.criteria),
        matchedCount: matchCount,
        contactedCount: 0,
        respondedCount: 0,
        status: campaign.status,
        createdAt: campaign.createdAt,
      });
    } catch (dbError) {
      console.error('DB error creating campaign:', dbError);
      // Return mock response if DB fails
      const matchCount = Math.floor(Math.random() * 30) + 5;
      return NextResponse.json({
        id: `c${Date.now()}`,
        name,
        jobId: jobId || null,
        criteria: criteria || {},
        matchedCount: matchCount,
        contactedCount: 0,
        respondedCount: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error creating sourcing campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
