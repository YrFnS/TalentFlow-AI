// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/comments/[id]/reactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, emoji } = body;

    if (!userId || !emoji) {
      return NextResponse.json(
        { error: 'userId and emoji are required' },
        { status: 400 }
      );
    }

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if reaction already exists
    const existing = await db.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId: id,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Toggle off - remove reaction
      await db.commentReaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ removed: true });
    }

    // Add reaction
    const reaction = await db.commentReaction.create({
      data: {
        commentId: id,
        userId,
        emoji,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}
