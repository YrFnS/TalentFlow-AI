import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/mentions?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Find all comments where the user is mentioned
    const allComments = await db.comment.findMany({
      where: {
        mentions: { not: null },
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter comments that mention this user
    const mentions = allComments.filter((comment) => {
      try {
        const mentionedIds = comment.mentions ? JSON.parse(comment.mentions) : [];
        return Array.isArray(mentionedIds) && mentionedIds.includes(userId);
      } catch {
        return false;
      }
    });

    return NextResponse.json(mentions);
  } catch (error) {
    console.error('Error fetching mentions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    );
  }
}
