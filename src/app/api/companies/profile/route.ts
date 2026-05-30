// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCompanyMember } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = auth.companyId || searchParams.get('id');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, name, description, industry, companySize, website, location, logo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const company = await db.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(industry && { industry }),
        ...(companySize && { companySize }),
        ...(website && { website }),
        ...(location && { location }),
        ...(logo !== undefined && { logo }),
      },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Error updating company profile:', error);
    return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 });
  }
}
