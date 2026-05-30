import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get all postings for company's jobs
    const postings = await db.jobBoardPosting.findMany({
      where: {
        job: {
          companyId,
        },
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Calculate aggregates
    const totalPostings = postings.length;
    const totalViews = postings.reduce((sum, p) => sum + p.views, 0);
    const totalClicks = postings.reduce((sum, p) => sum + p.clicks, 0);
    const totalApplications = postings.reduce((sum, p) => sum + p.applications, 0);

    // Group by board
    const boardMap = new Map<string, {
      boardId: string;
      boardName: string;
      postingCount: number;
      views: number;
      clicks: number;
      applications: number;
      posted: number;
      pending: number;
      failed: number;
      expired: number;
    }>();

    for (const p of postings) {
      const existing = boardMap.get(p.boardId) || {
        boardId: p.boardId,
        boardName: p.board.name,
        postingCount: 0,
        views: 0,
        clicks: 0,
        applications: 0,
        posted: 0,
        pending: 0,
        failed: 0,
        expired: 0,
      };

      existing.postingCount++;
      existing.views += p.views;
      existing.clicks += p.clicks;
      existing.applications += p.applications;

      if (p.status === 'POSTED') existing.posted++;
      else if (p.status === 'PENDING') existing.pending++;
      else if (p.status === 'FAILED') existing.failed++;
      else if (p.status === 'EXPIRED') existing.expired++;

      boardMap.set(p.boardId, existing);
    }

    const byBoard = Array.from(boardMap.values());

    return NextResponse.json({
      totalPostings,
      totalViews,
      totalClicks,
      totalApplications,
      byBoard,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
