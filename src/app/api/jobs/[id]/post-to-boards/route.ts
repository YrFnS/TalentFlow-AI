import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  const { id: jobId } = await params;

  try {
    const body = await request.json();
    const { boardIds } = body as { boardIds: string[] };

    if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
      return NextResponse.json(
        { error: 'boardIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify the job exists
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify all boards exist
    const boards = await db.jobBoard.findMany({
      where: { id: { in: boardIds }, isActive: true },
    });

    if (boards.length !== boardIds.length) {
      return NextResponse.json(
        { error: 'Some boards not found or inactive' },
        { status: 400 }
      );
    }

    // Create postings with PENDING status
    const postings = [];

    for (const boardId of boardIds) {
      // Check if already posted
      const existing = await db.jobBoardPosting.findUnique({
        where: { jobId_boardId: { jobId, boardId } },
      });

      if (existing) {
        postings.push(existing);
        continue;
      }

      const posting = await db.jobBoardPosting.create({
        data: {
          jobId,
          boardId,
          status: 'PENDING',
        },
        include: {
          board: true,
          job: { select: { title: true } },
        },
      });

      postings.push(posting);

      // Simulate posting (in real implementation, would call external API)
      // After 1-2 second delay, update to POSTED with mock externalUrl
      const delay = 1000 + Math.random() * 1000;
      const board = boards.find((b) => b.id === boardId);
      const boardName = board?.name?.toLowerCase() || 'board';

      setTimeout(async () => {
        try {
          await db.jobBoardPosting.update({
            where: { id: posting.id },
            data: {
              status: 'POSTED',
              externalId: `ext-${boardName}-${Date.now()}`,
              externalUrl: `https://${boardName}.com/jobs/${posting.id}`,
              postedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              views: Math.floor(Math.random() * 50),
              clicks: Math.floor(Math.random() * 20),
              applications: Math.floor(Math.random() * 5),
            },
          });
        } catch (e) {
          console.error('Error updating posting:', e);
        }
      }, delay);
    }

    return NextResponse.json({ postings });
  } catch (error) {
    console.error('Error posting to boards:', error);
    return NextResponse.json(
      { error: 'Failed to post to boards' },
      { status: 500 }
    );
  }
}
