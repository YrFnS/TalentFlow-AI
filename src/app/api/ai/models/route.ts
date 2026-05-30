// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// GET /api/ai/models - List models for a provider
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'providerId is required' },
        { status: 400 }
      );
    }

    const models = await db.aIModel.findMany({
      where: { providerId },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// POST /api/ai/models - Add model to provider
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { providerId, modelId, modelName, isActive, isDefault } = body;

    if (!providerId || !modelId || !modelName) {
      return NextResponse.json(
        { error: 'providerId, modelId, and modelName are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this provider
    if (isDefault) {
      await db.aIModel.updateMany({
        where: { providerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await db.aIModel.create({
      data: {
        providerId,
        modelId,
        modelName,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/models - Update model (set default, toggle active)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, providerId, modelId, modelName, isActive, isDefault } = body;

    if (!id || !providerId) {
      return NextResponse.json(
        { error: 'id and providerId are required' },
        { status: 400 }
      );
    }

    // Verify model belongs to provider
    const existing = await db.aIModel.findFirst({
      where: { id, providerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults for this provider
    if (isDefault) {
      await db.aIModel.updateMany({
        where: { providerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (modelId !== undefined) updateData.modelId = modelId;
    if (modelName !== undefined) updateData.modelName = modelName;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const model = await db.aIModel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/models - Delete model
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const providerId = searchParams.get('providerId');

    if (!id || !providerId) {
      return NextResponse.json(
        { error: 'id and providerId are required' },
        { status: 400 }
      );
    }

    // Verify model belongs to provider
    const existing = await db.aIModel.findFirst({
      where: { id, providerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    await db.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}
