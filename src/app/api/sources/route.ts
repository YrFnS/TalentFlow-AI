import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sources?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const sources = await db.applicationSource.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

// POST /api/sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, type, isDefault, isActive } = body;

    if (!companyId || !name || !type) {
      return NextResponse.json(
        { error: 'companyId, name, and type are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await db.applicationSource.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const source = await db.applicationSource.create({
      data: {
        companyId,
        name,
        type,
        isDefault: isDefault || false,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}
