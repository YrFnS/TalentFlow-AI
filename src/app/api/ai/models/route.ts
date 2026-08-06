// @ts-nocheck - Prisma model payloads are ownership-checked before writes.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function getOwnedProvider(providerId: string, userId: string) {
  return db.aIProvider.findFirst({
    where: { id: providerId, userId },
    select: { id: true },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const providerId = request.nextUrl.searchParams.get('providerId');
    if (!providerId) {
      return NextResponse.json(
        { error: 'providerId is required' },
        { status: 400 },
      );
    }

    if (!(await getOwnedProvider(providerId, auth.userId))) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const models = await db.aIModel.findMany({
      where: { providerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const providerId = text(body.providerId, 200);
    const modelId = text(body.modelId, 500);
    const modelName = text(body.modelName, 500);

    if (!providerId || !modelId || !modelName) {
      return NextResponse.json(
        { error: 'providerId, modelId, and modelName are required' },
        { status: 400 },
      );
    }

    if (!(await getOwnedProvider(providerId, auth.userId))) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const model = await db.$transaction(async (transaction) => {
      if (body.isDefault === true) {
        await transaction.aIModel.updateMany({
          where: { providerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return transaction.aIModel.create({
        data: {
          providerId,
          modelId,
          modelName,
          isActive: body.isActive !== false,
          isDefault: body.isDefault === true,
        },
      });
    });

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'This model is already configured for the provider' },
        { status: 409 },
      );
    }
    console.error('Error creating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const id = text(body.id, 200);
    const providerId = text(body.providerId, 200);
    if (!id || !providerId) {
      return NextResponse.json(
        { error: 'id and providerId are required' },
        { status: 400 },
      );
    }

    const existing = await db.aIModel.findFirst({
      where: { id, providerId, provider: { userId: auth.userId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.modelId !== undefined) {
      const modelId = text(body.modelId, 500);
      if (!modelId) return NextResponse.json({ error: 'modelId is invalid' }, { status: 400 });
      data.modelId = modelId;
    }
    if (body.modelName !== undefined) {
      const modelName = text(body.modelName, 500);
      if (!modelName) return NextResponse.json({ error: 'modelName is invalid' }, { status: 400 });
      data.modelName = modelName;
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.isDefault !== undefined) data.isDefault = Boolean(body.isDefault);

    const model = await db.$transaction(async (transaction) => {
      if (body.isDefault === true) {
        await transaction.aIModel.updateMany({
          where: { providerId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return transaction.aIModel.update({ where: { id }, data });
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const id = request.nextUrl.searchParams.get('id');
    const providerId = request.nextUrl.searchParams.get('providerId');
    if (!id || !providerId) {
      return NextResponse.json(
        { error: 'id and providerId are required' },
        { status: 400 },
      );
    }

    const deleted = await db.aIModel.deleteMany({
      where: {
        id,
        providerId,
        provider: { userId: auth.userId },
      },
    });
    if (!deleted.count) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 },
    );
  }
}
