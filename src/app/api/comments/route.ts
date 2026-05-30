import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/comments?entityType=APPLICATION&entityId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const comments = await db.comment.findMany({
      where: {
        entityType,
        entityId,
        parentId: null,
      },
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, authorId, parentId, content, mentions } = body;

    if (!entityType || !entityId || !authorId || !content) {
      return NextResponse.json(
        { error: 'entityType, entityId, authorId, and content are required' },
        { status: 400 }
      );
    }

    const comment = await db.comment.create({
      data: {
        entityType,
        entityId,
        authorId,
        parentId: parentId || null,
        content,
        mentions: mentions ? JSON.stringify(mentions) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: true,
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    // Create notifications for mentioned users
    if (mentions && Array.isArray(mentions)) {
      for (const mentionedUserId of mentions) {
        await db.notification.create({
          data: {
            userId: mentionedUserId,
            title: 'You were mentioned in a comment',
            message: `You were mentioned in a comment on ${entityType.toLowerCase()} #${entityId.slice(0, 8)}`,
            type: 'info',
            link: `/company/comments?entityType=${entityType}&entityId=${entityId}`,
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
