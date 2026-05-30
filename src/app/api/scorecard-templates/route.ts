import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/scorecard-templates?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const templates = await db.scorecardTemplate.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const parsed = templates.map((t) => ({
      ...t,
      criteria: JSON.parse(t.criteria),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching scorecard templates:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard templates' }, { status: 500 });
  }
}

// POST /api/scorecard-templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, criteria, totalWeight, isDefault, isActive } = body;

    if (!companyId || !name || !criteria) {
      return NextResponse.json({ error: 'companyId, name, and criteria are required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.scorecardTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await db.scorecardTemplate.create({
      data: {
        companyId,
        name,
        criteria: JSON.stringify(criteria),
        totalWeight: totalWeight || 100,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      ...template,
      criteria: JSON.parse(template.criteria),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating scorecard template:', error);
    return NextResponse.json({ error: 'Failed to create scorecard template' }, { status: 500 });
  }
}
