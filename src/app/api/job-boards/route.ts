import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const boards = await db.jobBoard.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { postings: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const boardsWithStats = boards.map((board) => ({
      id: board.id,
      name: board.name,
      logo: board.logo,
      apiBaseUrl: board.apiBaseUrl,
      isActive: board.isActive,
      config: board.config,
      createdAt: board.createdAt,
      postingCount: board._count.postings,
    }));

    return NextResponse.json({ boards: boardsWithStats });
  } catch (error) {
    console.error('Error fetching job boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job boards' },
      { status: 500 }
    );
  }
}
