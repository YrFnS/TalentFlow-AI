import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { db } from '@/lib/db';

// GET /api/candidates/[id]/skills
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const candidateProfile = await db.candidateProfile.findUnique({
      where: { id },
      include: {
        candidateSkills: true,
      },
    });

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    // Get skill names from taxonomy
    const skillIds = candidateProfile.candidateSkills.map((cs: { skillId: string }) => cs.skillId);
    const taxonomy = skillIds.length > 0
      ? await db.skillsTaxonomy.findMany({ where: { id: { in: skillIds } } })
      : [];
    const taxonomyMap = new Map<string, { id: string; name: string; category: string }>(taxonomy.map((t: { id: string; name: string; category: string }) => [t.id, t]));

    const skills = candidateProfile.candidateSkills.map((cs: { id: string; skillId: string; level: string; verified: boolean; yearsExperience: number | null; source: string; createdAt: Date }) => ({
      id: cs.id,
      skillId: cs.skillId,
      skillName: taxonomyMap.get(cs.skillId)?.name || cs.skillId,
      category: taxonomyMap.get(cs.skillId)?.category || 'UNKNOWN',
      level: cs.level,
      verified: cs.verified,
      yearsExperience: cs.yearsExperience,
      source: cs.source,
      createdAt: cs.createdAt,
    }));

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching candidate skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate skills' },
      { status: 500 }
    );
  }
}

// PATCH /api/candidates/[id]/skills
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { addSkills, removeSkills, updateSkills } = body as {
      addSkills?: { skillId: string; level: string; yearsExperience?: number; source?: string }[];
      removeSkills?: string[]; // skillIds to remove
      updateSkills?: { skillId: string; level?: string; yearsExperience?: number }[];
    };

    const candidateProfile = await db.candidateProfile.findUnique({
      where: { id },
    });

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    // Remove skills
    if (removeSkills && removeSkills.length > 0) {
      await db.candidateSkill.deleteMany({
        where: {
          candidateId: id,
          skillId: { in: removeSkills },
        },
      });
    }

    // Update skills
    if (updateSkills && updateSkills.length > 0) {
      for (const us of updateSkills) {
        const existing = await db.candidateSkill.findUnique({
          where: {
            candidateId_skillId: {
              candidateId: id,
              skillId: us.skillId,
            },
          },
        });

        if (existing) {
          await db.candidateSkill.update({
            where: { id: existing.id },
            data: {
              ...(us.level && { level: us.level }),
              ...(us.yearsExperience !== undefined && { yearsExperience: us.yearsExperience }),
            },
          });
        }
      }
    }

    // Add skills
    if (addSkills && addSkills.length > 0) {
      for (const ns of addSkills) {
        // Check if already exists (unique constraint)
        const existing = await db.candidateSkill.findUnique({
          where: {
            candidateId_skillId: {
              candidateId: id,
              skillId: ns.skillId,
            },
          },
        });

        if (!existing) {
          await db.candidateSkill.create({
            data: {
              candidateId: id,
              skillId: ns.skillId,
              level: ns.level || 'BEGINNER',
              yearsExperience: ns.yearsExperience || null,
              source: ns.source || 'SELF_REPORTED',
            },
          });
        }
      }
    }

    // Return updated skills
    const updatedSkills = await db.candidateSkill.findMany({
      where: { candidateId: id },
    });

    const skillIds = updatedSkills.map((cs: { skillId: string }) => cs.skillId);
    const taxonomy = skillIds.length > 0
      ? await db.skillsTaxonomy.findMany({ where: { id: { in: skillIds } } })
      : [];
    const taxonomyMap = new Map<string, { id: string; name: string; category: string }>(taxonomy.map((t: { id: string; name: string; category: string }) => [t.id, t]));

    const skills = updatedSkills.map((cs: { id: string; skillId: string; level: string; verified: boolean; yearsExperience: number | null; source: string; createdAt: Date }) => ({
      id: cs.id,
      skillId: cs.skillId,
      skillName: taxonomyMap.get(cs.skillId)?.name || cs.skillId,
      category: taxonomyMap.get(cs.skillId)?.category || 'UNKNOWN',
      level: cs.level,
      verified: cs.verified,
      yearsExperience: cs.yearsExperience,
      source: cs.source,
      createdAt: cs.createdAt,
    }));

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error updating candidate skills:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate skills' },
      { status: 500 }
    );
  }
}
