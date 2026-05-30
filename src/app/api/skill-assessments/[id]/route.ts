// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// GET /api/skill-assessments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const assessment = await db.skillAssessment.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get skill names
    const allTaxonomy = await db.skillsTaxonomy.findMany();
    const taxonomyMap = new Map(allTaxonomy.map((t: { id: string; name: string; category: string }) => [t.id, t]));
    const skillIds: string[] = JSON.parse(assessment.skillIds || '[]');
    const skills = skillIds.map((sid: string) => taxonomyMap.get(sid)).filter(Boolean);

    // Get candidate names for results
    const candidateIds = assessment.results.map((r: { candidateId: string }) => r.candidateId);
    const candidates = candidateIds.length > 0
      ? await db.user.findMany({ where: { id: { in: candidateIds } }, select: { id: true, name: true, email: true } })
      : [];
    const candidateMap = new Map(candidates.map((c: { id: string; name: string; email: string }) => [c.id, c]));

    const enrichedResults = assessment.results.map((r: { id: string; candidateId: string; answers: string; score: number | null; skillScores: string | null; overallLevel: string | null; aiFeedback: string | null; completedAt: Date }) => ({
      id: r.id,
      candidateId: r.candidateId,
      candidateName: candidateMap.get(r.candidateId)?.name || 'Unknown',
      candidateEmail: candidateMap.get(r.candidateId)?.email || '',
      answers: JSON.parse(r.answers || '[]'),
      score: r.score,
      skillScores: r.skillScores ? JSON.parse(r.skillScores) : null,
      overallLevel: r.overallLevel,
      aiFeedback: r.aiFeedback ? JSON.parse(r.aiFeedback) : null,
      completedAt: r.completedAt,
    }));

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        skillIds,
        skills: skills.map((s: { name: string; category: string }) => ({ name: s.name, category: s.category })),
        questions: JSON.parse(assessment.questions || '[]'),
        timeLimitMinutes: assessment.timeLimitMinutes,
        passingScore: assessment.passingScore,
        type: assessment.type,
        isActive: assessment.isActive,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
        results: enrichedResults,
      },
    });
  } catch (error) {
    console.error('Error fetching skill assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill assessment' },
      { status: 500 }
    );
  }
}

// PATCH /api/skill-assessments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.skillAssessment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.skillIds !== undefined) updateData.skillIds = JSON.stringify(body.skillIds);
    if (body.questions !== undefined) updateData.questions = JSON.stringify(body.questions);
    if (body.type !== undefined) updateData.type = body.type;
    if (body.passingScore !== undefined) updateData.passingScore = body.passingScore;
    if (body.timeLimitMinutes !== undefined) updateData.timeLimitMinutes = body.timeLimitMinutes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await db.skillAssessment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ assessment: updated });
  } catch (error) {
    console.error('Error updating skill assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update skill assessment' },
      { status: 500 }
    );
  }
}

// DELETE /api/skill-assessments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const existing = await db.skillAssessment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    await db.skillAssessmentResult.deleteMany({ where: { assessmentId: id } });
    await db.skillAssessment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill assessment' },
      { status: 500 }
    );
  }
}
