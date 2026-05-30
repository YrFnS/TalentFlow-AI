import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/comments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, isPinned, isResolved, mentions } = body;

    const existing = await db.comment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isResolved !== undefined) updateData.isResolved = isResolved;
    if (mentions !== undefined) updateData.mentions = JSON.stringify(mentions);

    const comment = await db.comment.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
            reactions: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.comment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Delete reactions first, then replies, then the comment
    await db.commentReaction.deleteMany({
      where: { commentId: id },
    });

    // Delete reactions for replies
    const replies = await db.comment.findMany({
      where: { parentId: id },
      select: { id: true },
    });

    for (const reply of replies) {
      await db.commentReaction.deleteMany({
        where: { commentId: reply.id },
      });
    }

    await db.comment.deleteMany({
      where: { parentId: id },
    });

    await db.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
