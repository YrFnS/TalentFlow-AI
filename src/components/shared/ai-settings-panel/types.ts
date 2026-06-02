// @ts-nocheck
export interface AIProviderData {
  id: string;
  userId: string;
  name: string;
  apiKey: string;
  baseUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  models: AIModelData[];
}

export interface AIModelData {
  id: string;
  providerId: string;
  modelId: string;
  modelName: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface FetchedModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: { prompt: string; completion: string };
  modality: string;
}

export interface UsageStats {
  totalRequests: number;
  successRate: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  featureBreakdown: { feature: string; count: number; tokens: number }[];
  avgTokensPerRequest: number;
  lastUsed: string | null;
}
