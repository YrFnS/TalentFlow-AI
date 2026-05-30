// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/scorecard-templates/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.scorecardTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...template,
      criteria: JSON.parse(template.criteria),
    });
  } catch (error) {
    console.error('Error fetching scorecard template:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard template' }, { status: 500 });
  }
}

// PATCH /api/scorecard-templates/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, criteria, totalWeight, isDefault, isActive } = body;

    const existing = await db.scorecardTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults for the same company
    if (isDefault) {
      await db.scorecardTemplate.updateMany({
        where: { companyId: existing.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (criteria !== undefined) updateData.criteria = JSON.stringify(criteria);
    if (totalWeight !== undefined) updateData.totalWeight = totalWeight;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await db.scorecardTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...template,
      criteria: JSON.parse(template.criteria),
    });
  } catch (error) {
    console.error('Error updating scorecard template:', error);
    return NextResponse.json({ error: 'Failed to update scorecard template' }, { status: 500 });
  }
}

// DELETE /api/scorecard-templates/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.scorecardTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.scorecardTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scorecard template:', error);
    return NextResponse.json({ error: 'Failed to delete scorecard template' }, { status: 500 });
  }
}
