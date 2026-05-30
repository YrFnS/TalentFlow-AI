import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || auth.companyId;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const recipientSearch = searchParams.get('recipient');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { companyId };
    if (status) {
      where.status = status.toUpperCase();
    }
    if (recipientSearch) {
      where.to = { contains: recipientSearch };
    }

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          to: true,
          from: true,
          subject: true,
          status: true,
          templateId: true,
          provider: true,
          sentAt: true,
          createdAt: true,
          error: true,
        },
      }),
      db.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
