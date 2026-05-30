import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Public jobs for a company slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json([]);
    }

    // Find the company by slug or careerPageSlug
    const company = await db.company.findFirst({
      where: {
        OR: [
          { slug },
          { careerPageSlug: slug },
        ],
      },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json([]);
    }

    // Fetch OPEN jobs for this company
    const jobs = await db.job.findMany({
      where: {
        companyId: company.id,
        status: 'OPEN',
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
      orderBy: { publishedAt: 'desc' },
    });

    // Transform jobs to include parsed JSON fields
    const transformedJobs = jobs.map((job) => ({
      ...job,
      department: '', // Will be derived from job metadata if available
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      benefits: job.benefits ? JSON.parse(job.benefits) : [],
      postedAt: job.publishedAt?.toISOString() || job.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error('Failed to fetch public jobs:', error);
    return NextResponse.json([]);
  }
}
