import { db } from '@/lib/db';
import { decryptApiKey } from '@/lib/security/api-key-protect';

// ============================================
// Types
// ============================================

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
}

interface AIChatOptions {
  userId: string;
  messages: OpenRouterMessage[];
  modelId?: string;
  feature: string;
}

// ============================================
// Get User's Default Provider and Model
// ============================================

export async function getUserDefaultProvider(userId: string) {
  const provider = await db.aIProvider.findFirst({
    where: {
      userId,
      isActive: true,
      isDefault: true,
    },
    include: {
      models: {
        where: { isActive: true },
        orderBy: { isDefault: 'desc' },
      },
    },
  });

  if (!provider) {
    // Fallback: get any active provider
    const fallbackProvider = await db.aIProvider.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        models: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
        },
      },
    });
    return fallbackProvider;
  }

  return provider;
}

export async function getUserDefaultModel(userId: string) {
  const provider = await getUserDefaultProvider(userId);
  if (!provider) return null;

  const defaultModel = provider.models.find((m) => m.isDefault);
  return defaultModel || provider.models[0] || null;
}

// ============================================
// Call OpenRouter API
// ============================================

export async function callOpenRouterAPI(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  messages: OpenRouterMessage[]
): Promise<OpenRouterResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://talentflow.ai',
      'X-Title': 'TalentFlow AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<OpenRouterResponse>;
}

// ============================================
// Test AI Connection
// ============================================

export async function testAIConnection(
  apiKey: string,
  baseUrl: string,
  modelId: string
): Promise<{ success: boolean; message: string; response?: string }> {
  try {
    const result = await callOpenRouterAPI(apiKey, baseUrl, modelId, [
      {
        role: 'user',
        content: 'Say "Hello" in one word.',
      },
    ]);

    const content = result.choices?.[0]?.message?.content;
    return {
      success: true,
      message: 'Connection successful!',
      response: content,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// ============================================
// Log AI Usage
// ============================================

export async function logAIUsage(params: {
  userId: string;
  modelId: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  duration: number;
  success: boolean;
  error?: string;
}) {
  return db.aIUsageLog.create({
    data: {
      userId: params.userId,
      modelId: params.modelId,
      feature: params.feature,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      duration: params.duration,
      success: params.success,
      error: params.error,
    },
  });
}

// ============================================
// Fetch Models from OpenRouter
// ============================================

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = (await response.json()) as { data: OpenRouterModel[] };
  return data.data || [];
}

// ============================================
// AI Chat (Full Pipeline)
// ============================================

export async function aiChat(options: AIChatOptions) {
  const { userId, messages, modelId: specificModelId, feature } = options;

  // Get user's provider
  const provider = await getUserDefaultProvider(userId);
  if (!provider) {
    throw new Error('No active AI provider configured');
  }

  // Determine which model to use
  let model;
  if (specificModelId) {
    model = await db.aIModel.findUnique({
      where: { id: specificModelId },
    });
    if (!model || model.providerId !== provider.id) {
      throw new Error('Model not found or does not belong to provider');
    }
  } else {
    model = provider.models.find((m) => m.isDefault) || provider.models[0];
  }

  if (!model) {
    throw new Error('No active model configured');
  }

  const startTime = Date.now();
  try {
    const result = await callOpenRouterAPI(
      decryptApiKey(provider.apiKey),
      provider.baseUrl || 'https://openrouter.ai/api/v1',
      model.modelId,
      messages
    );

    const duration = Date.now() - startTime;
    const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0 };

    // Log usage
    await logAIUsage({
      userId,
      modelId: model.id,
      feature,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      duration,
      success: true,
    });

    return {
      content: result.choices?.[0]?.message?.content || '',
      usage,
      model: result.model,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAIUsage({
      userId,
      modelId: model.id,
      feature,
      inputTokens: 0,
      outputTokens: 0,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================
// Get AI Usage Statistics
// ============================================

export async function getAIUsageStats(userId: string) {
  const logs = await db.aIUsageLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const totalRequests = logs.length;
  const successRequests = logs.filter((l) => l.success).length;
  const totalInputTokens = logs.reduce((sum, l) => sum + l.inputTokens, 0);
  const totalOutputTokens = logs.reduce((sum, l) => sum + l.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;

  // Feature breakdown
  const featureMap = new Map<string, { count: number; tokens: number }>();
  for (const log of logs) {
    const existing = featureMap.get(log.feature) || { count: 0, tokens: 0 };
    existing.count += 1;
    existing.tokens += log.inputTokens + log.outputTokens;
    featureMap.set(log.feature, existing);
  }

  const featureBreakdown = Array.from(featureMap.entries()).map(
    ([feature, data]) => ({
      feature,
      count: data.count,
      tokens: data.tokens,
    })
  );

  return {
    totalRequests,
    successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    featureBreakdown,
    avgTokensPerRequest:
      totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    lastUsed: logs[0]?.createdAt || null,
  };
}

// ============================================
// Type Exports
// ============================================

export type {
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterModel,
  AIChatOptions,
};
