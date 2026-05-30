'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { toast } from 'sonner';
import {
  Brain,
  Key,
  Cpu,
  Activity,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Settings,
  Zap,
  Loader2,
  Star,
  Edit,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

// ============================================
// Types
// ============================================

interface AIProviderData {
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

interface AIModelData {
  id: string;
  providerId: string;
  modelId: string;
  modelName: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface FetchedModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  modality: string;
}

interface UsageStats {
  totalRequests: number;
  successRate: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  featureBreakdown: { feature: string; count: number; tokens: number }[];
  avgTokensPerRequest: number;
  lastUsed: string | null;
}

// ============================================
// Component
// ============================================

interface AISettingsPanelProps {
  role?: 'admin' | 'company' | 'candidate';
}

export function AISettingsPanel({ role = 'candidate' }: AISettingsPanelProps) {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';

  // State
  const [providers, setProviders] = useState<AIProviderData[]>([]);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [selectedModelsToAdd, setSelectedModelsToAdd] = useState<Set<string>>(new Set());
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderData | null>(null);
  const [providerName, setProviderName] = useState('OpenRouter');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AIProviderData | null>(null);

  // Load providers
  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai/providers?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
        if (data.providers.length > 0 && !activeProviderId) {
          const defaultProvider = data.providers.find((p: AIProviderData) => p.isDefault) || data.providers[0];
          setActiveProviderId(defaultProvider.id);
        }
      }
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, activeProviderId]);

  // Load usage stats
  const loadUsageStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/chat?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (err) {
      console.error('Error loading usage stats:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadProviders();
    loadUsageStats();
  }, [loadProviders, loadUsageStats]);

  // Fetch models from OpenRouter
  const handleFetchModels = async () => {
    if (!apiKey) {
      toast.error(t.ai.enterApiKey);
      return;
    }
    try {
      setFetchingModels(true);
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setFetchedModels(data.models);
        setSelectedModelsToAdd(new Set());
        toast.success(t.ai.modelsFetched);
      } else {
        const err = await res.json();
        toast.error(err.error || t.ai.connectionFailed);
      }
    } catch {
      toast.error(t.ai.connectionFailed);
    } finally {
      setFetchingModels(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!apiKey || !baseUrl) {
      toast.error(t.ai.enterApiKey);
      return;
    }
    try {
      setTesting(true);
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          modelId: 'openai/gpt-3.5-turbo',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.ai.connectionSuccess);
      } else {
        toast.error(data.message || t.ai.connectionFailed);
      }
    } catch {
      toast.error(t.ai.connectionFailed);
    } finally {
      setTesting(false);
    }
  };

  // Save provider
  const handleSaveProvider = async () => {
    if (!providerName || !apiKey) {
      toast.error(t.ai.enterApiKey);
      return;
    }
    try {
      setSaving(true);
      if (editingProvider) {
        // Update existing
        const res = await fetch('/api/ai/providers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProvider.id,
            userId,
            name: providerName,
            apiKey,
            baseUrl,
          }),
        });
        if (res.ok) {
          toast.success(t.ai.providerSaved);
          setEditingProvider(null);
          setShowAddProvider(false);
          resetForm();
          loadProviders();
        }
      } else {
        // Create new
        const res = await fetch('/api/ai/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: providerName,
            apiKey,
            baseUrl,
            isDefault: providers.length === 0,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          toast.success(t.ai.providerSaved);
          setShowAddProvider(false);
          resetForm();
          loadProviders();

          // Add selected models
          if (selectedModelsToAdd.size > 0) {
            for (const modelId of selectedModelsToAdd) {
              const model = fetchedModels.find((m) => m.id === modelId);
              if (model) {
                await fetch('/api/ai/models', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    providerId: data.provider.id,
                    modelId: model.id,
                    modelName: model.name,
                    isActive: true,
                    isDefault: selectedModelsToAdd.size === 1,
                  }),
                });
              }
            }
            setSelectedModelsToAdd(new Set());
            loadProviders();
          }
        }
      }
    } catch {
      toast.error(t.ai.connectionFailed);
    } finally {
      setSaving(false);
    }
  };

  // Delete provider
  const handleDeleteProvider = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/ai/providers?id=${deleteTarget.id}&userId=${userId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success(t.ai.providerDeleted);
        setDeleteTarget(null);
        loadProviders();
        loadUsageStats();
      }
    } catch {
      toast.error(t.ai.connectionFailed);
    }
  };

  // Set default provider
  const handleSetDefault = async (provider: AIProviderData) => {
    try {
      await fetch('/api/ai/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: provider.id,
          userId,
          isDefault: true,
        }),
      });
      toast.success(t.ai.providerSetDefault);
      loadProviders();
    } catch {
      toast.error(t.ai.connectionFailed);
    }
  };

  // Toggle model active
  const handleToggleModel = async (model: AIModelData, active: boolean) => {
    try {
      await fetch('/api/ai/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: model.id,
          providerId: model.providerId,
          isActive: active,
        }),
      });
      toast.success(active ? t.ai.modelEnabled : t.ai.modelDisabled);
      loadProviders();
    } catch {
      toast.error(t.ai.connectionFailed);
    }
  };

  // Set default model
  const handleSetDefaultModel = async (model: AIModelData) => {
    try {
      await fetch('/api/ai/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: model.id,
          providerId: model.providerId,
          isDefault: true,
        }),
      });
      toast.success(t.ai.providerSetDefault);
      loadProviders();
    } catch {
      toast.error(t.ai.connectionFailed);
    }
  };

  // Delete model
  const handleDeleteModel = async (model: AIModelData) => {
    try {
      await fetch(
        `/api/ai/models?id=${model.id}&providerId=${model.providerId}`,
        { method: 'DELETE' }
      );
      toast.success(t.ai.providerDeleted);
      loadProviders();
    } catch {
      toast.error(t.ai.connectionFailed);
    }
  };

  // Edit provider
  const handleEditProvider = (provider: AIProviderData) => {
    setEditingProvider(provider);
    setProviderName(provider.name);
    setBaseUrl(provider.baseUrl || 'https://openrouter.ai/api/v1');
    setApiKey(''); // Don't pre-fill API key for security
    setShowAddProvider(true);
  };

  // Toggle model selection for adding
  const toggleModelSelection = (modelId: string) => {
    setSelectedModelsToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  // Reset form
  const resetForm = () => {
    setProviderName('OpenRouter');
    setApiKey('');
    setBaseUrl('https://openrouter.ai/api/v1');
    setShowApiKey(false);
    setFetchedModels([]);
    setSelectedModelsToAdd(new Set());
  };

  // Filter models
  const filteredFetchedModels = fetchedModels.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active provider
  const activeProvider = providers.find((p) => p.id === activeProviderId);

  // Feature labels mapping
  const featureLabels: Record<string, string> = {
    resume_analysis: t.ai.resumeAnalysis,
    match_scoring: t.ai.matchScoring,
    cover_letter: t.ai.coverLetterGen,
    interview_prep: t.ai.interviewPrep,
    skill_gap: t.ai.skillGapAnalysis,
    job_description: t.ai.jobDescriptionGen,
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return t.admin.title;
      case 'company':
        return t.company.title;
      case 'candidate':
        return t.candidates.title;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Brain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t.ai.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getRoleLabel()} — {t.ai.configuration}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingProvider(null);
              setShowAddProvider(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {t.ai.addNewProvider}
          </Button>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="providers" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t.ai.providerSettings}</span>
              <span className="sm:hidden">{t.ai.provider}</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">{t.ai.modelSelection}</span>
              <span className="sm:hidden">{t.ai.model}</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">{t.ai.usageStats}</span>
              <span className="sm:hidden">{t.ai.usageStats}</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== PROVIDERS TAB ==================== */}
          <TabsContent value="providers" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : providers.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t.ai.noProvider}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    {t.ai.openRouterDesc}
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setEditingProvider(null);
                      setShowAddProvider(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t.ai.addProvider}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <Card
                    key={provider.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      provider.isDefault
                        ? 'border-emerald-500/50 shadow-sm'
                        : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {provider.name}
                              {provider.isDefault && (
                                <Badge
                                  variant="default"
                                  className="bg-emerald-600 text-white text-xs"
                                >
                                  <Star className="w-3 h-3 me-1" />
                                  {t.ai.default}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  provider.isActive ? 'default' : 'secondary'
                                }
                                className={
                                  provider.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : ''
                                }
                              >
                                {provider.isActive ? t.ai.active : t.ai.inactive}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-0.5">
                              {provider.baseUrl}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!provider.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(provider)}
                              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {t.ai.setDefaultProvider}
                              </span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProvider(provider)}
                            className="gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t.ai.editProvider}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(provider)}
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Key className="w-4 h-4" />
                        <span>{provider.apiKey}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <Cpu className="w-4 h-4" />
                        <span>
                          {provider.models.length} {t.ai.model}
                          {provider.models.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ==================== MODELS TAB ==================== */}
          <TabsContent value="models" className="space-y-6">
            {/* Provider selector */}
            {providers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t.ai.availableModels}</CardTitle>
                  <CardDescription>{t.ai.selectModelsHint}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Select
                      value={activeProviderId || ''}
                      onValueChange={setActiveProviderId}
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder={t.ai.selectModel} />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (activeProvider) {
                          handleEditProvider(activeProvider);
                          setShowAddProvider(false);
                        }
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t.ai.fetchModels}
                    </Button>
                  </div>

                  {/* Models list */}
                  {activeProvider && activeProvider.models.length > 0 ? (
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.ai.model}</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              {t.ai.contextLength}
                            </TableHead>
                            <TableHead className="text-center">
                              {t.ai.active}
                            </TableHead>
                            <TableHead className="text-center">
                              {t.ai.default}
                            </TableHead>
                            <TableHead className="text-end">
                              {t.common.actions}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeProvider.models.map((model) => (
                            <TableRow key={model.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">
                                    {model.modelName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {model.modelId}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                —
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={model.isActive}
                                  onCheckedChange={(checked) =>
                                    handleToggleModel(model, checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                {model.isDefault ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Star className="w-3 h-3 me-1" />
                                    {t.ai.default}
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetDefaultModel(model)}
                                    className="text-xs"
                                  >
                                    {t.ai.setDefault}
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="text-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteModel(model)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{t.ai.noModelsAvailable}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ==================== USAGE TAB ==================== */}
          <TabsContent value="usage" className="space-y-6">
            {usageStats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.ai.totalRequests}
                          </p>
                          <p className="text-2xl font-bold">
                            {usageStats.totalRequests}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-500/10">
                          <Cpu className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.ai.totalTokens}
                          </p>
                          <p className="text-2xl font-bold">
                            {usageStats.totalTokens.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10">
                          <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.ai.successRate}
                          </p>
                          <p className="text-2xl font-bold">
                            {usageStats.successRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                          <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.ai.tokensPerRequest}
                          </p>
                          <p className="text-2xl font-bold">
                            {usageStats.avgTokensPerRequest}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Token breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t.ai.inputTokens} / {t.ai.outputTokens}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {t.ai.inputTokens}
                          </span>
                          <span className="font-medium">
                            {usageStats.totalInputTokens.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={
                            usageStats.totalTokens > 0
                              ? (usageStats.totalInputTokens /
                                  usageStats.totalTokens) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {t.ai.outputTokens}
                          </span>
                          <span className="font-medium">
                            {usageStats.totalOutputTokens.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={
                            usageStats.totalTokens > 0
                              ? (usageStats.totalOutputTokens /
                                  usageStats.totalTokens) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Breakdown */}
                {usageStats.featureBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t.ai.featureBreakdown}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.ai.aiFeatures}</TableHead>
                              <TableHead className="text-center">
                                {t.ai.totalRequests}
                              </TableHead>
                              <TableHead className="text-end">
                                {t.ai.totalTokens}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {usageStats.featureBreakdown.map((fb) => (
                              <TableRow key={fb.feature}>
                                <TableCell className="font-medium">
                                  {featureLabels[fb.feature] || fb.feature}
                                </TableCell>
                                <TableCell className="text-center">
                                  {fb.count}
                                </TableCell>
                                <TableCell className="text-end">
                                  {fb.tokens.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {usageStats.lastUsed && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t.ai.lastUsed}:{' '}
                    {new Date(usageStats.lastUsed).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t.ai.noProvider}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ==================== ADD/EDIT PROVIDER DIALOG ==================== */}
        <Dialog
          open={showAddProvider || !!editingProvider}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddProvider(false);
              setEditingProvider(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                {editingProvider ? t.ai.editProvider : t.ai.addNewProvider}
              </DialogTitle>
              <DialogDescription>
                {t.ai.openRouterDesc}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Provider Name */}
              <div className="space-y-2">
                <Label htmlFor="providerName">{t.ai.providerName}</Label>
                <Input
                  id="providerName"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="OpenRouter"
                />
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">{t.ai.apiKey}</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t.ai.apiKeyPlaceholder}
                    className="pe-20"
                  />
                  <div className="absolute inset-y-0 end-0 flex items-center gap-1 pe-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="h-7 w-7 p-0"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <Label htmlFor="baseUrl">{t.ai.baseUrl}</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://openrouter.ai/api/v1"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !apiKey}
                  className="gap-2 flex-1"
                >
                  {fetchingModels ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {fetchingModels ? t.ai.fetchingModels : t.ai.fetchModels}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !apiKey}
                  className="gap-2 flex-1"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {testing ? t.ai.testing : t.ai.testConnection}
                </Button>
              </div>

              {/* Fetched Models Selection */}
              {fetchedModels.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      {t.ai.availableModels} ({selectedModelsToAdd.size}{' '}
                      {t.ai.selectedCount})
                    </Label>
                  </div>

                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.ai.searchModels}
                      className="ps-9"
                    />
                  </div>

                  <ScrollArea className="h-64 rounded-md border">
                    <div className="p-2 space-y-1">
                      {filteredFetchedModels.map((model) => (
                        <div
                          key={model.id}
                          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${
                            selectedModelsToAdd.has(model.id)
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : ''
                          }`}
                          onClick={() => toggleModelSelection(model.id)}
                        >
                          <Checkbox
                            checked={selectedModelsToAdd.has(model.id)}
                            onCheckedChange={() =>
                              toggleModelSelection(model.id)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {model.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {model.id}
                            </p>
                          </div>
                          <div className="text-end text-xs text-muted-foreground shrink-0">
                            <p>
                              {model.contextLength?.toLocaleString()} ctx
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddProvider(false);
                  setEditingProvider(null);
                  resetForm();
                }}
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleSaveProvider}
                disabled={saving || !apiKey || !providerName}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingProvider ? t.ai.updateProvider : t.ai.saveProvider}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== DELETE CONFIRM DIALOG ==================== */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                {t.ai.confirmDeleteTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.ai.confirmDeleteDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProvider}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t.common.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
