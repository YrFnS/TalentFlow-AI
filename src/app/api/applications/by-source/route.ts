import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/applications/by-source?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const sourceId = searchParams.get('sourceId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get all jobs for the company
    const jobs = await db.job.findMany({
      where: { companyId },
      select: { id: true },
    });

    const jobIds = jobs.map(j => j.id);

    // Build where clause
    const whereClause: Record<string, unknown> = {
      jobId: { in: jobIds },
    };

    if (sourceId) {
      whereClause.sourceId = sourceId;
    }

    const applications = await db.application.findMany({
      where: whereClause,
      include: {
        job: {
          select: { id: true, title: true },
        },
        candidate: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const formatted = applications.map(app => ({
      id: app.id,
      candidateName: app.candidate.user.name,
      candidateEmail: app.candidate.user.email,
      candidateImage: app.candidate.user.image,
      jobTitle: app.job.title,
      sourceId: app.sourceId,
      source: app.source,
      utmSource: app.utmSource,
      utmMedium: app.utmMedium,
      utmCampaign: app.utmCampaign,
      utmContent: app.utmContent,
      status: app.status,
      appliedAt: app.appliedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching applications by source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications by source' },
      { status: 500 }
    );
  }
}
