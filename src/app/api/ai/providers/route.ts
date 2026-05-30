// @ts-nocheck - Complex Prisma types, validated at runtime
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { encryptApiKey, decryptApiKey } from '@/lib/security/api-key-protect';

// GET /api/ai/providers - List user's providers
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const providers = await db.aIProvider.findMany({
      where: { userId },
      include: {
        models: {
          orderBy: { isDefault: 'desc' },
        },
      },
      orderBy: { isDefault: 'desc' },
    });

    // Mask API keys for security - decrypt then mask
    const maskedProviders = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey
        ? '••••••••' + decryptApiKey(p.apiKey).slice(-4)
        : '',
    }));

    return NextResponse.json({ providers: maskedProviders });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/ai/providers - Add new provider
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { name, apiKey, baseUrl, isActive, isDefault } = body;

    if (!userId || !name || !apiKey) {
      return NextResponse.json(
        { error: 'userId, name, and apiKey are required' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.aIProvider.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Encrypt API key before storing
    const encryptedApiKey = encryptApiKey(apiKey);

    const provider = await db.aIProvider.create({
      data: {
        userId,
        name,
        apiKey: encryptedApiKey,
        baseUrl: baseUrl || 'https://openrouter.ai/api/v1',
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
      },
    });

    // Return with masked API key
    const maskedProvider = {
      ...provider,
      apiKey: '••••••••' + apiKey.slice(-4),
    };

    return NextResponse.json({ provider: maskedProvider }, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/providers - Update provider
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;
    const { id, name, apiKey, baseUrl, isActive, isDefault } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and userId are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.aIProvider.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset others
    if (isDefault) {
      await db.aIProvider.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (apiKey !== undefined) updateData.apiKey = encryptApiKey(apiKey);
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const provider = await db.aIProvider.update({
      where: { id },
      data: updateData,
    });

    // Return with masked API key
    const maskedProvider = {
      ...provider,
      apiKey: provider.apiKey
        ? '••••••••' + decryptApiKey(provider.apiKey).slice(-4)
        : '',
    };

    return NextResponse.json({ provider: maskedProvider });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/providers - Delete provider
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = auth.userId;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and userId are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.aIProvider.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    await db.aIProvider.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}
