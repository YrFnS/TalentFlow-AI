import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

const MANUAL_STATUSES = new Set(['POSTED', 'FAILED', 'REMOVED']);

function normalizedUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: jobId } = await params;
    const job = await db.job.findFirst({
      where: { id: jobId, companyId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const postings = await db.jobBoardPosting.findMany({
      where: { jobId },
      include: {
        board: {
          select: {
            id: true,
            name: true,
            logo: true,
            isActive: true,
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ postings });
  } catch (error) {
    console.error('Error fetching postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch postings' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const postingId =
      typeof body.postingId === 'string' ? body.postingId.trim() : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!postingId || !MANUAL_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'postingId and a valid status are required' },
        { status: 400 },
      );
    }

    const externalUrl = normalizedUrl(body.externalUrl);
    if (body.externalUrl !== undefined && externalUrl === undefined) {
      return NextResponse.json(
        { error: 'externalUrl must be a valid HTTP or HTTPS URL' },
        { status: 400 },
      );
    }

    const posting = await db.jobBoardPosting.findFirst({
      where: {
        id: postingId,
        jobId,
        job: { companyId },
      },
      include: { board: true, job: { select: { title: true } } },
    });
    if (!posting) {
      return NextResponse.json(
        { error: 'Posting not found' },
        { status: 404 },
      );
    }

    const updated = await db.$transaction(async (transaction) => {
      const record = await transaction.jobBoardPosting.update({
        where: { id: posting.id },
        data: {
          status: status as 'POSTED' | 'FAILED' | 'REMOVED',
          ...(externalUrl !== undefined ? { externalUrl } : {}),
          postedAt: status === 'POSTED' ? posting.postedAt || new Date() : posting.postedAt,
          error:
            status === 'FAILED'
              ? typeof body.error === 'string'
                ? body.error.slice(0, 2000)
                : 'Manual posting failed'
              : status === 'REMOVED'
                ? null
                : null,
        },
        include: { board: true, job: { select: { id: true, title: true } } },
      });

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'job_board_posting.update',
          resource: 'job_board_posting',
          resourceId: posting.id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({
            companyId,
            jobId,
            boardId: posting.boardId,
            oldStatus: posting.status,
            newStatus: status,
          }),
        },
      });
      return record;
    });

    return NextResponse.json({ posting: updated });
  } catch (error) {
    console.error('Error updating posting:', error);
    return NextResponse.json(
      { error: 'Failed to update posting' },
      { status: 500 },
    );
  }
}
