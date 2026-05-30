import { NextRequest, NextResponse } from 'next/server';
import { aiChat, getAIUsageStats } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';
import { handleApiError } from '@/lib/security/error-handler';
import { validateInput, aiChatSchema } from '@/lib/validation/schemas';

// POST /api/ai/chat - Generic AI chat endpoint
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const userId = auth.userId;

    // Zod schema validation
    const validation = validateInput(aiChatSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    const { messages, feature } = validation.data;
    const { modelId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await aiChat({
      userId,
      messages,
      modelId,
      feature,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'AIChat');
  }
}

// GET /api/ai/chat - Get usage statistics
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const stats = await getAIUsageStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error, 'AIChatUsage');
  }
}
