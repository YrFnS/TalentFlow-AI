import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role !== 'all') {
      where.role = role;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, action, role } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'suspend':
        updateData = { isActive: false };
        break;
      case 'activate':
        updateData = { isActive: true };
        break;
      case 'role':
        if (!role) {
          return NextResponse.json({ error: 'Missing role' }, { status: 400 });
        }
        updateData = { role };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log with admin user ID and IP
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: `user.${action}`,
        resource: 'user',
        resourceId: id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({
          targetUserName: user.name,
          targetUserEmail: user.email,
          action,
          role,
          performedBy: auth.userId,
        }),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Get user info before deletion for audit log
    const user = await db.user.findUnique({
      where: { id },
      select: { name: true, email: true },
    });

    // Delete user (cascades to related records)
    await db.user.delete({ where: { id } });

    // Create audit log with admin user ID and IP
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'user.delete',
        resource: 'user',
        resourceId: id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({
          deletedUserName: user?.name,
          deletedUserEmail: user?.email,
          performedBy: auth.userId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
