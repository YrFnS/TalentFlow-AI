import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const emailLog = await db.emailLog.findUnique({
      where: { id },
    });

    if (!emailLog) {
      return NextResponse.json(
        { error: 'Email log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ emailLog });
  } catch (error) {
    console.error('Error fetching email log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email log' },
      { status: 500 }
    );
  }
}
