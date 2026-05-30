// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// GET /api/skill-assessments
export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || auth.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const assessments = await db.skillAssessment.findMany({
      where: { companyId },
      include: {
        results: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get skill names for each assessment
    const allTaxonomy = await db.skillsTaxonomy.findMany();
    const taxonomyMap = new Map(allTaxonomy.map((t: { id: string; name: string; category: string }) => [t.id, t]));

    const enriched = assessments.map((a: {
      id: string;
      title: string;
      description: string | null;
      skillIds: string;
      questions: string;
      timeLimitMinutes: number | null;
      passingScore: number;
      type: string;
      isActive: boolean;
      createdAt: Date;
      results: { id: string; score: number | null }[];
    }) => {
      const skillIds: string[] = JSON.parse(a.skillIds || '[]');
      const skills = skillIds
        .map((id: string) => taxonomyMap.get(id))
        .filter(Boolean);
      const completedResults = a.results.filter((r: { score: number | null }) => r.score !== null);
      const avgScore = completedResults.length > 0
        ? completedResults.reduce((sum: number, r: { score: number | null }) => sum + (r.score || 0), 0) / completedResults.length
        : 0;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        skillIds,
        skills: skills.map((s: { name: string; category: string }) => ({ name: s.name, category: s.category })),
        questions: a.questions,
        timeLimitMinutes: a.timeLimitMinutes,
        passingScore: a.passingScore,
        type: a.type,
        isActive: a.isActive,
        createdAt: a.createdAt,
        totalResults: a.results.length,
        averageScore: Math.round(avgScore * 10) / 10,
      };
    });

    return NextResponse.json({ assessments: enriched });
  } catch (error) {
    console.error('Error fetching skill assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill assessments' },
      { status: 500 }
    );
  }
}

// POST /api/skill-assessments
export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, description, skillIds, type, passingScore, timeLimitMinutes, questions, companyId: bodyCompanyId } = body as {
      title: string;
      description?: string;
      skillIds: string[];
      type: string;
      passingScore?: number;
      timeLimitMinutes?: number;
      questions?: unknown[];
      companyId?: string;
    };

    const companyId = bodyCompanyId || auth.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!title || !skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json(
        { error: 'title and skillIds (non-empty array) are required' },
        { status: 400 }
      );
    }

    const assessment = await db.skillAssessment.create({
      data: {
        companyId,
        title,
        description: description || null,
        skillIds: JSON.stringify(skillIds),
        questions: JSON.stringify(questions || []),
        type: type || 'CUSTOM',
        passingScore: passingScore ?? 70.0,
        timeLimitMinutes: timeLimitMinutes || null,
      },
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create skill assessment' },
      { status: 500 }
    );
  }
}
