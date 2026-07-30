import type { JobBoardPosting } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const MANUAL_POSTING_NOTE =
  'External publishing is not configured for this board. Complete the posting manually, then mark the record as posted and add its public URL.';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const companyId = resolveCompanyId(
      auth,
      typeof body.companyId === 'string' ? body.companyId : null,
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const { id: jobId } = await params;
    const boardIds = [
      ...new Set(
        Array.isArray(body.boardIds)
          ? body.boardIds
              .filter((id): id is string => typeof id === 'string')
              .map((id) => id.trim())
              .filter(Boolean)
          : [],
      ),
    ];

    if (boardIds.length === 0 || boardIds.length > 20) {
      return NextResponse.json(
        { error: 'Select between 1 and 20 job boards' },
        { status: 400 },
      );
    }

    const [job, boards] = await Promise.all([
      db.job.findFirst({
        where: {
          id: jobId,
          companyId,
          status: 'OPEN',
          publishedAt: { not: null },
        },
        select: { id: true, title: true },
      }),
      db.jobBoard.findMany({
        where: { id: { in: boardIds }, isActive: true },
        select: { id: true, name: true },
      }),
    ]);

    if (!job) {
      return NextResponse.json(
        { error: 'Only published, open jobs can be prepared for job boards' },
        { status: 404 },
      );
    }
    if (boards.length !== boardIds.length) {
      return NextResponse.json(
        { error: 'One or more selected job boards are unavailable' },
        { status: 400 },
      );
    }

    const postings = await db.$transaction(async (transaction) => {
      const records: JobBoardPosting[] = [];
      for (const board of boards) {
        const existing = await transaction.jobBoardPosting.findUnique({
          where: { jobId_boardId: { jobId, boardId: board.id } },
        });

        if (existing?.status === 'POSTED') {
          records.push(existing);
          continue;
        }

        const record = existing
          ? await transaction.jobBoardPosting.update({
              where: { id: existing.id },
              data: {
                status: 'PENDING',
                error: MANUAL_POSTING_NOTE,
              },
            })
          : await transaction.jobBoardPosting.create({
              data: {
                jobId,
                boardId: board.id,
                status: 'PENDING',
                error: MANUAL_POSTING_NOTE,
              },
            });
        records.push(record);
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'job_board_posting.prepare',
          resource: 'job',
          resourceId: jobId,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            jobTitle: job.title,
            boardIds,
            mode: 'manual_tracking',
          }),
        },
      });
      return records;
    });

    const enriched = await db.jobBoardPosting.findMany({
      where: { id: { in: postings.map((posting) => posting.id) } },
      include: {
        board: true,
        job: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      postings: enriched,
      manualActionRequired: true,
      message:
        'Posting records were created for manual tracking. No external board API was called.',
    });
  } catch (error) {
    console.error('Error preparing job board postings:', error);
    return NextResponse.json(
      { error: 'Failed to prepare job board postings' },
      { status: 500 },
    );
  }
}
