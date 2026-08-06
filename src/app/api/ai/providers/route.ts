// @ts-nocheck - Prisma provider payloads are normalized before persistence.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { encryptApiKey, decryptApiKey } from '@/lib/security/api-key-protect';
import { assertSafeAIProviderBaseUrl } from '@/lib/security/ai-provider-url';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

function maskKey(value: string): string {
  try {
    const decrypted = decryptApiKey(value);
    return `••••••••${decrypted.slice(-4)}`;
  } catch {
    return '••••••••';
  }
}

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 100) : '';
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const providers = await db.aIProvider.findMany({
      where: { userId: auth.userId },
      include: {
        models: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      providers: providers.map((provider) => ({
        ...provider,
        apiKey: maskKey(provider.apiKey),
      })),
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const name = normalizeName(body.name);
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const baseUrl = await assertSafeAIProviderBaseUrl(
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : DEFAULT_BASE_URL,
    );

    if (!name || !apiKey || apiKey.length > 10_000) {
      return NextResponse.json(
        { error: 'A provider name and API key are required' },
        { status: 400 },
      );
    }

    const provider = await db.$transaction(async (transaction) => {
      if (body.isDefault) {
        await transaction.aIProvider.updateMany({
          where: { userId: auth.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return transaction.aIProvider.create({
        data: {
          userId: auth.userId,
          name,
          apiKey: encryptApiKey(apiKey),
          baseUrl,
          isActive: body.isActive !== false,
          isDefault: body.isDefault === true,
        },
      });
    });

    return NextResponse.json(
      { provider: { ...provider, apiKey: `••••••••${apiKey.slice(-4)}` } },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create provider';
    console.error('Error creating AI provider:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ error: 'Provider id is required' }, { status: 400 });
    }

    const existing = await db.aIProvider.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (!name) return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
      data.name = name;
    }
    if (body.apiKey !== undefined) {
      const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
      if (!apiKey || apiKey.length > 10_000) {
        return NextResponse.json({ error: 'API key is invalid' }, { status: 400 });
      }
      data.apiKey = encryptApiKey(apiKey);
    }
    if (body.baseUrl !== undefined) {
      data.baseUrl = await assertSafeAIProviderBaseUrl(String(body.baseUrl));
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.isDefault !== undefined) data.isDefault = Boolean(body.isDefault);

    const provider = await db.$transaction(async (transaction) => {
      if (body.isDefault === true) {
        await transaction.aIProvider.updateMany({
          where: { userId: auth.userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return transaction.aIProvider.update({ where: { id }, data });
    });

    return NextResponse.json({
      provider: { ...provider, apiKey: maskKey(provider.apiKey) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update provider';
    console.error('Error updating AI provider:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Provider id is required' }, { status: 400 });
    }

    const deleted = await db.aIProvider.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (!deleted.count) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 },
    );
  }
}
