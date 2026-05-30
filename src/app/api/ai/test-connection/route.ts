import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection } from '@/lib/ai-service';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/ai/test-connection - Test AI connection
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { apiKey, baseUrl, modelId } = body;

    if (!apiKey || !baseUrl || !modelId) {
      return NextResponse.json(
        { error: 'apiKey, baseUrl, and modelId are required' },
        { status: 400 }
      );
    }

    const result = await testAIConnection(apiKey, baseUrl, modelId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
