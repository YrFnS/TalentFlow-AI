import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const skills = searchParams.get('skills');
    const minExperience = searchParams.get('minExperience');
    const availability = searchParams.get('availability');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { currentTitle: { contains: search } },
        { location: { contains: search } },
      ];
    }
    if (skills) {
      where.skills = { contains: skills };
    }
    if (minExperience) {
      where.experienceYears = { gte: parseInt(minExperience) };
    }
    if (availability) {
      where.availability = availability;
    }

    const candidates = await db.candidateProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        applications: {
          select: {
            id: true,
            status: true,
            job: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Candidates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}
