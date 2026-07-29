// @ts-nocheck - Prisma query types are assembled from validated filters.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember, resolveCompanyId } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = request.nextUrl;
    const companyId = resolveCompanyId(auth, searchParams.get('companyId'));
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const search = searchParams.get('search')?.trim();
    const skills = searchParams.get('skills')?.trim();
    const minExperienceRaw = searchParams.get('minExperience');
    const availability = searchParams.get('availability')?.trim();
    const minExperience = minExperienceRaw
      ? Number.parseInt(minExperienceRaw, 10)
      : null;

    const where: Record<string, unknown> = {
      applications: { some: { job: { companyId } } },
    };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { currentTitle: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (skills) where.skills = { contains: skills, mode: 'insensitive' };
    if (minExperience !== null && Number.isFinite(minExperience)) {
      where.experienceYears = { gte: minExperience };
    }
    if (availability) where.availability = availability;

    const candidates = await db.candidateProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        applications: {
          where: { job: { companyId } },
          select: {
            id: true,
            status: true,
            matchScore: true,
            appliedAt: true,
            job: { select: { id: true, title: true } },
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Candidates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 },
    );
  }
}
