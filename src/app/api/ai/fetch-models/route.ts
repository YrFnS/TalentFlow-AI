import { NextRequest, NextResponse } from 'next/server';
import { fetchOpenRouterModels } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/fetch-models - Fetch models from OpenRouter
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const models = await fetchOpenRouterModels(apiKey);

    // Format models for the UI
    const formattedModels = models.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      contextLength: model.context_length,
      pricing: {
        prompt: model.pricing?.prompt || '0',
        completion: model.pricing?.completion || '0',
      },
      modality: model.architecture?.modality || 'text',
    }));

    // Sort by name for easier browsing
    formattedModels.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models: formattedModels });
  } catch (error) {
    console.error('Error fetching models from OpenRouter:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch models from OpenRouter',
      },
      { status: 500 }
    );
  }
}
