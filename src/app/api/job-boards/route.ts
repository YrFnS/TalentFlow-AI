import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';

function integrationStatus(config: string | null): 'CONNECTED' | 'MANUAL' {
  if (!config) return 'MANUAL';
  try {
    const parsed = JSON.parse(config) as Record<string, unknown>;
    return parsed.connected === true ? 'CONNECTED' : 'MANUAL';
  } catch {
    return 'MANUAL';
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const [boards, jobs, postings] = await Promise.all([
      db.jobBoard.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      db.job.findMany({
        where: {
          companyId,
          status: 'OPEN',
          publishedAt: { not: null },
        },
        select: {
          id: true,
          title: true,
          status: true,
          location: true,
          publishedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      db.jobBoardPosting.findMany({
        where: { job: { companyId } },
        include: {
          board: {
            select: {
              id: true,
              name: true,
              logo: true,
              isActive: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
    ]);

    const byBoard = new Map<
      string,
      {
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
        removed: number;
      }
    >();

    for (const posting of postings) {
      const current = byBoard.get(posting.boardId) || {
        boardId: posting.boardId,
        boardName: posting.board.name,
        postingCount: 0,
        views: 0,
        clicks: 0,
        applications: 0,
        posted: 0,
        pending: 0,
        failed: 0,
        expired: 0,
        removed: 0,
      };
      current.postingCount += 1;
      current.views += posting.views;
      current.clicks += posting.clicks;
      current.applications += posting.applications;
      if (posting.status === 'POSTED') current.posted += 1;
      else if (posting.status === 'PENDING') current.pending += 1;
      else if (posting.status === 'FAILED') current.failed += 1;
      else if (posting.status === 'EXPIRED') current.expired += 1;
      else if (posting.status === 'REMOVED') current.removed += 1;
      byBoard.set(posting.boardId, current);
    }

    return NextResponse.json({
      boards: boards.map((board) => ({
        id: board.id,
        name: board.name,
        logo: board.logo,
        apiBaseUrl: board.apiBaseUrl,
        integrationStatus: integrationStatus(board.config),
        companyPostingCount:
          postings.filter((posting) => posting.boardId === board.id).length,
      })),
      jobs,
      postings,
      analytics: {
        totalPostings: postings.length,
        totalViews: postings.reduce((sum, posting) => sum + posting.views, 0),
        totalClicks: postings.reduce((sum, posting) => sum + posting.clicks, 0),
        totalApplications: postings.reduce(
          (sum, posting) => sum + posting.applications,
          0,
        ),
        byBoard: [...byBoard.values()],
      },
    });
  } catch (error) {
    console.error('Error fetching job board overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job board data' },
      { status: 500 },
    );
  }
}
