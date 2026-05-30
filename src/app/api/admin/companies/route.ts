import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } },
        { location: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (status === 'verified') {
      where.verified = true;
    } else if (status === 'unverified') {
      where.verified = false;
    } else if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    const companies = await db.company.findMany({
      where,
      include: {
        _count: {
          select: { members: true, jobs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ companies: [] }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'verify':
        updateData = { verified: true };
        break;
      case 'unverify':
        updateData = { verified: false };
        break;
      case 'suspend':
        updateData = { isActive: false };
        break;
      case 'activate':
        updateData = { isActive: true };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const company = await db.company.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `company.${action}`,
        resource: 'company',
        resourceId: id,
        details: JSON.stringify({ companyName: company.name, action }),
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
