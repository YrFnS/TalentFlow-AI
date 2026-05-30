import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || 'all';
    const resource = searchParams.get('resource') || 'all';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const where: Record<string, unknown> = {};

    if (action !== 'all') {
      where.action = action;
    }

    if (resource !== 'all') {
      where.resource = resource;
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
      };
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { resource: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ logs: [] }, { status: 500 });
  }
}
