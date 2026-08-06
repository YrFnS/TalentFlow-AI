import { db } from '@/lib/db';
import { decryptApiKey } from '@/lib/security/api-key-protect';
import { assertSafeAIProviderBaseUrl } from '@/lib/security/ai-provider-url';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
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
  pricing: { prompt: string; completion: string };
  top_provider?: { max_completion_tokens?: number };
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

const REQUEST_TIMEOUT_MS = 45_000;

export async function getUserDefaultProvider(userId: string) {
  const providers = await db.aIProvider.findMany({
    where: { userId, isActive: true },
    include: {
      models: {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return providers[0] || null;
}

export async function getUserDefaultModel(userId: string) {
  const provider = await getUserDefaultProvider(userId);
  return provider?.models.find((model) => model.isDefault) || provider?.models[0] || null;
}

function buildCompletionUrl(baseUrl: string): string {
  const url = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/chat/completions`;
  return url.toString();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function callOpenRouterAPI(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  messages: OpenRouterMessage[],
): Promise<OpenRouterResponse> {
  const safeBaseUrl = await assertSafeAIProviderBaseUrl(baseUrl);
  const response = await fetchWithTimeout(buildCompletionUrl(safeBaseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://talentflow.invalid',
      'X-Title': 'TalentFlow AI',
    },
    body: JSON.stringify({ model: modelId, messages }),
  });

  if (!response.ok) {
    const errorText = (await response.text()).slice(0, 2000);
    throw new Error(`AI provider request failed (${response.status}): ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('AI provider returned an unexpected response type');
  }

  const payload = (await response.json()) as OpenRouterResponse;
  if (!Array.isArray(payload.choices)) {
    throw new Error('AI provider returned an invalid completion response');
  }
  return payload;
}

export async function testAIConnection(
  apiKey: string,
  baseUrl: string,
  modelId: string,
): Promise<{ success: boolean; message: string; response?: string }> {
  try {
    const result = await callOpenRouterAPI(apiKey, baseUrl, modelId, [
      { role: 'user', content: 'Reply with the single word: Hello' },
    ]);
    return {
      success: true,
      message: 'Connection successful',
      response: result.choices[0]?.message?.content,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

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
      error: params.error?.slice(0, 2000),
    },
  });
}

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }
  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  return payload.data || [];
}

export async function aiChat(options: AIChatOptions) {
  const provider = await getUserDefaultProvider(options.userId);
  if (!provider) throw new Error('No active AI provider configured');

  const model = options.modelId
    ? await db.aIModel.findFirst({
        where: {
          id: options.modelId,
          providerId: provider.id,
          isActive: true,
        },
      })
    : provider.models.find((item) => item.isDefault) || provider.models[0];

  if (!model) throw new Error('No active model configured');

  const startedAt = Date.now();
  try {
    const result = await callOpenRouterAPI(
      decryptApiKey(provider.apiKey),
      provider.baseUrl || 'https://openrouter.ai/api/v1',
      model.modelId,
      options.messages,
    );
    const usage = result.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    await logAIUsage({
      userId: options.userId,
      modelId: model.id,
      feature: options.feature,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      duration: Date.now() - startedAt,
      success: true,
    });

    return {
      content: result.choices[0]?.message?.content || '',
      usage,
      model: result.model,
    };
  } catch (error) {
    await logAIUsage({
      userId: options.userId,
      modelId: model.id,
      feature: options.feature,
      inputTokens: 0,
      outputTokens: 0,
      duration: Date.now() - startedAt,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function getAIUsageStats(userId: string) {
  const logs = await db.aIUsageLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const successful = logs.filter((log) => log.success).length;
  const totalInputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0);
  const totalOutputTokens = logs.reduce((sum, log) => sum + log.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const features = new Map<string, { count: number; tokens: number }>();

  for (const log of logs) {
    const current = features.get(log.feature) || { count: 0, tokens: 0 };
    current.count += 1;
    current.tokens += log.inputTokens + log.outputTokens;
    features.set(log.feature, current);
  }

  return {
    totalRequests: logs.length,
    successRate: logs.length ? (successful / logs.length) * 100 : 0,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    featureBreakdown: Array.from(features, ([feature, values]) => ({
      feature,
      ...values,
    })),
    avgTokensPerRequest: logs.length ? Math.round(totalTokens / logs.length) : 0,
    lastUsed: logs[0]?.createdAt || null,
  };
}

export type {
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterModel,
  AIChatOptions,
};
