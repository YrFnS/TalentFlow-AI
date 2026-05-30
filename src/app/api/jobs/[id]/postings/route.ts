import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  const { id: jobId } = await params;

  try {
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
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ postings });
  } catch (error) {
    console.error('Error fetching postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch postings' },
      { status: 500 }
    );
  }
}
