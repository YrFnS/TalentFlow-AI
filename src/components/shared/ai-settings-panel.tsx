// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/store/i18n-store";
import { useAuth } from "@/store/auth-store";
import { toast } from "sonner";
import { Brain, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Cpu, Activity } from "lucide-react";

import type {
	AIProviderData,
	AIModelData,
	UsageStats,
	FetchedModel,
} from "./ai-settings-panel/types";
import ProvidersTab from "./ai-settings-panel/providers-tab";
import ModelsTab from "./ai-settings-panel/models-tab";
import UsageTab from "./ai-settings-panel/usage-tab";
import ProviderDialog from "./ai-settings-panel/provider-dialog";
import DeleteDialog from "./ai-settings-panel/delete-dialog";

interface AISettingsPanelProps {
	role?: "admin" | "company" | "candidate";
}

export function AISettingsPanel({ role = "candidate" }: AISettingsPanelProps) {
	const { t, dir } = useI18n();
	const { user } = useAuth();
	const userId = user?.id || "demo-user";

	const [providers, setProviders] = useState<AIProviderData[]>([]);
	const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

	// Dialog state
	const [showAddProvider, setShowAddProvider] = useState(false);
	const [editingProvider, setEditingProvider] = useState<AIProviderData | null>(
		null,
	);
	const [deleteTarget, setDeleteTarget] = useState<AIProviderData | null>(null);

	// Provider dialog form state
	const [providerName, setProviderName] = useState("OpenRouter");
	const [apiKey, setApiKey] = useState("");
	const [showApiKey, setShowApiKey] = useState(false);
	const [baseUrl, setBaseUrl] = useState("https://openrouter.ai/api/v1");
	const [fetchingModels, setFetchingModels] = useState(false);
	const [testing, setTesting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
	const [selectedModelsToAdd, setSelectedModelsToAdd] = useState<Set<string>>(
		new Set(),
	);
	const [searchQuery, setSearchQuery] = useState("");

	const loadProviders = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/ai/providers?userId=${userId}`);
			if (res.ok) {
				const data = await res.json();
				setProviders(data.providers);
				if (data.providers.length > 0 && !activeProviderId) {
					const defaultProvider =
						data.providers.find((p: AIProviderData) => p.isDefault) ||
						data.providers[0];
					setActiveProviderId(defaultProvider.id);
				}
			}
		} catch (err) {
			console.error("Error loading providers:", err);
		} finally {
			setLoading(false);
		}
	}, [userId, activeProviderId]);

	const loadUsageStats = useCallback(async () => {
		try {
			const res = await fetch(`/api/ai/chat?userId=${userId}`);
			if (res.ok) {
				const data = await res.json();
				setUsageStats(data);
			}
		} catch (err) {
			console.error("Error loading usage stats:", err);
		}
	}, [userId]);

	useEffect(() => {
		loadProviders();
		loadUsageStats();
	}, [loadProviders, loadUsageStats]);

	const resetForm = () => {
		setProviderName("OpenRouter");
		setApiKey("");
		setBaseUrl("https://openrouter.ai/api/v1");
		setShowApiKey(false);
		setFetchedModels([]);
		setSelectedModelsToAdd(new Set());
	};

	const handleAddProvider = () => {
		resetForm();
		setEditingProvider(null);
		setShowAddProvider(true);
	};
	const handleEditProvider = (provider: AIProviderData) => {
		setEditingProvider(provider);
		setProviderName(provider.name);
		setBaseUrl(provider.baseUrl || "https://openrouter.ai/api/v1");
		setApiKey("");
		setShowAddProvider(true);
	};

	const handleFetchModels = async () => {
		if (!apiKey) {
			toast.error(t.ai.enterApiKey);
			return;
		}
		try {
			setFetchingModels(true);
			const res = await fetch("/api/ai/fetch-models", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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

	const handleTestConnection = async () => {
		if (!apiKey || !baseUrl) {
			toast.error(t.ai.enterApiKey);
			return;
		}
		try {
			setTesting(true);
			const res = await fetch("/api/ai/test-connection", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiKey,
					baseUrl,
					modelId: "openai/gpt-3.5-turbo",
				}),
			});
			const data = await res.json();
			if (data.success) toast.success(t.ai.connectionSuccess);
			else toast.error(data.message || t.ai.connectionFailed);
		} catch {
			toast.error(t.ai.connectionFailed);
		} finally {
			setTesting(false);
		}
	};

	const handleSaveProvider = async () => {
		if (!providerName || !apiKey) {
			toast.error(t.ai.enterApiKey);
			return;
		}
		try {
			setSaving(true);
			const isEditing = !!editingProvider;
			const url = isEditing ? "/api/ai/providers" : "/api/ai/providers";
			const method = isEditing ? "PUT" : "POST";
			const body = isEditing
				? {
						id: editingProvider.id,
						userId,
						name: providerName,
						apiKey,
						baseUrl,
					}
				: {
						userId,
						name: providerName,
						apiKey,
						baseUrl,
						isDefault: providers.length === 0,
					};
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (res.ok) {
				toast.success(t.ai.providerSaved);
				setShowAddProvider(false);
				setEditingProvider(null);
				resetForm();
				loadProviders();
				if (!isEditing && selectedModelsToAdd.size > 0) {
					const data = await res.json();
					for (const modelId of selectedModelsToAdd) {
						const model = fetchedModels.find((m) => m.id === modelId);
						if (model) {
							await fetch("/api/ai/models", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
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
		} catch {
			toast.error(t.ai.connectionFailed);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteProvider = async () => {
		if (!deleteTarget) return;
		try {
			const res = await fetch(
				`/api/ai/providers?id=${deleteTarget.id}&userId=${userId}`,
				{ method: "DELETE" },
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

	const handleSetDefault = async (provider: AIProviderData) => {
		try {
			await fetch("/api/ai/providers", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: provider.id, userId, isDefault: true }),
			});
			toast.success(t.ai.providerSetDefault);
			loadProviders();
		} catch {
			toast.error(t.ai.connectionFailed);
		}
	};

	const handleToggleModel = async (model: AIModelData, active: boolean) => {
		try {
			await fetch("/api/ai/models", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
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

	const handleSetDefaultModel = async (model: AIModelData) => {
		try {
			await fetch("/api/ai/models", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
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

	const handleDeleteModel = async (model: AIModelData) => {
		try {
			await fetch(
				`/api/ai/models?id=${model.id}&providerId=${model.providerId}`,
				{ method: "DELETE" },
			);
			toast.success(t.ai.providerDeleted);
			loadProviders();
		} catch {
			toast.error(t.ai.connectionFailed);
		}
	};

	const activeProvider = providers.find((p) => p.id === activeProviderId);

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
			case "admin":
				return t.admin.title;
			case "company":
				return t.company.title;
			case "candidate":
				return t.candidates.title;
			default:
				return "";
		}
	};

	const filteredFetchedModels = fetchedModels.filter(
		(m) =>
			m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			m.id.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const toggleModelSelection = (modelId: string) => {
		setSelectedModelsToAdd((prev) => {
			const next = new Set(prev);
			if (next.has(modelId)) next.delete(modelId);
			else next.add(modelId);
			return next;
		});
	};

	return (
		<div className="min-h-screen bg-background" dir={dir}>
			<div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
							<Brain className="w-6 h-6 text-emerald-600" />
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
						onClick={handleAddProvider}
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

					<TabsContent value="providers">
						<ProvidersTab
							loading={loading}
							providers={providers}
							t={t}
							onAddProvider={handleAddProvider}
							onEdit={handleEditProvider}
							onSetDefault={handleSetDefault}
							onDelete={setDeleteTarget}
						/>
					</TabsContent>

					<TabsContent value="models">
						<ModelsTab
							providers={providers}
							activeProviderId={activeProviderId}
							onActiveProviderChange={setActiveProviderId}
							onFetchModels={handleFetchModels}
							onToggleModel={handleToggleModel}
							onSetDefaultModel={handleSetDefaultModel}
							onDeleteModel={handleDeleteModel}
							t={t}
						/>
					</TabsContent>

					<TabsContent value="usage">
						<UsageTab
							usageStats={usageStats}
							t={t}
							featureLabels={featureLabels}
						/>
					</TabsContent>
				</Tabs>

				<ProviderDialog
					open={showAddProvider || !!editingProvider}
					onOpenChange={(open) => {
						if (!open) {
							setShowAddProvider(false);
							setEditingProvider(null);
							resetForm();
						}
					}}
					editing={!!editingProvider}
					providerName={providerName}
					onProviderNameChange={setProviderName}
					apiKey={apiKey}
					onApiKeyChange={setApiKey}
					showApiKey={showApiKey}
					onShowApiKeyChange={setShowApiKey}
					baseUrl={baseUrl}
					onBaseUrlChange={setBaseUrl}
					fetchingModels={fetchingModels}
					onFetchModels={handleFetchModels}
					testing={testing}
					onTestConnection={handleTestConnection}
					saving={saving}
					onSave={handleSaveProvider}
					fetchedModels={fetchedModels}
					filteredFetchedModels={filteredFetchedModels}
					selectedModelsToAdd={selectedModelsToAdd}
					onToggleModel={toggleModelSelection}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					t={t}
				/>

				<DeleteDialog
					open={!!deleteTarget}
					onOpenChange={(open) => {
						if (!open) setDeleteTarget(null);
					}}
					onConfirm={handleDeleteProvider}
					t={t}
				/>
			</div>
		</div>
	);
}
