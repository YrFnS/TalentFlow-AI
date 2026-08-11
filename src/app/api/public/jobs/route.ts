import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function parseStringArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function isCareerPagePublished(value: string | null): boolean {
  if (!value) return true;

  try {
    const parsed = JSON.parse(value);
    return !(
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      parsed.isPublished === false
    );
  } catch {
    // A malformed optional theme configuration should not hide valid jobs.
    return true;
  }
}

// GET: Public OPEN jobs for an active company slug or career-page slug.
export async function GET(request: NextRequest) {
  try {
    const rawSlug = request.nextUrl.searchParams.get('slug') || '';
    const slug = rawSlug.trim().toLowerCase();

    if (!slug || slug.length > 120) {
      return NextResponse.json([]);
    }

    const company = await db.company.findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { careerPageSlug: slug }],
      },
      select: {
        id: true,
        careerPageConfig: true,
      },
    });

    if (!company || !isCareerPagePublished(company.careerPageConfig)) {
      return NextResponse.json([]);
    }

    const jobs = await db.job.findMany({
      where: {
        companyId: company.id,
        status: 'OPEN',
        publishedAt: { not: null },
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        benefits: true,
        jobType: true,
        location: true,
        isRemote: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(
      jobs.map((job) => ({
        ...job,
        department: '',
        requirements: parseStringArray(job.requirements),
        benefits: parseStringArray(job.benefits),
        postedAt: (job.publishedAt || job.createdAt).toISOString(),
      })),
    );
  } catch (error) {
    console.error('Failed to fetch public jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public jobs' },
      { status: 500 },
    );
  }
}
