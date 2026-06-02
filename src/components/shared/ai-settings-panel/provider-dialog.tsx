// @ts-nocheck
"use client";

import React from "react";
import {
	Key,
	Eye,
	EyeOff,
	RefreshCw,
	Check,
	Loader2,
	Search,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { FetchedModel } from "./types";

interface ProviderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing: boolean;
	providerName: string;
	onProviderNameChange: (v: string) => void;
	apiKey: string;
	onApiKeyChange: (v: string) => void;
	showApiKey: boolean;
	onShowApiKeyChange: (v: boolean) => void;
	baseUrl: string;
	onBaseUrlChange: (v: string) => void;
	fetchingModels: boolean;
	onFetchModels: () => void;
	testing: boolean;
	onTestConnection: () => void;
	saving: boolean;
	onSave: () => void;
	fetchedModels: FetchedModel[];
	filteredFetchedModels: FetchedModel[];
	selectedModelsToAdd: Set<string>;
	onToggleModel: (modelId: string) => void;
	searchQuery: string;
	onSearchChange: (v: string) => void;
	t: Record<string, any>;
}

export default function ProviderDialog({
	open,
	onOpenChange,
	editing,
	providerName,
	onProviderNameChange,
	apiKey,
	onApiKeyChange,
	showApiKey,
	onShowApiKeyChange,
	baseUrl,
	onBaseUrlChange,
	fetchingModels,
	onFetchModels,
	testing,
	onTestConnection,
	saving,
	onSave,
	filteredFetchedModels,
	selectedModelsToAdd,
	onToggleModel,
	searchQuery,
	onSearchChange,
	t,
}: ProviderDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="w-5 h-5 text-emerald-600" />
						{editing ? t.ai.editProvider : t.ai.addNewProvider}
					</DialogTitle>
					<DialogDescription>{t.ai.openRouterDesc}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-2">
						<Label htmlFor="providerName">{t.ai.providerName}</Label>
						<Input
							id="providerName"
							value={providerName}
							onChange={(e) => onProviderNameChange(e.target.value)}
							placeholder="OpenRouter"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="apiKey">{t.ai.apiKey}</Label>
						<div className="relative">
							<Input
								id="apiKey"
								type={showApiKey ? "text" : "password"}
								value={apiKey}
								onChange={(e) => onApiKeyChange(e.target.value)}
								placeholder={t.ai.apiKeyPlaceholder}
								className="pe-20"
							/>
							<div className="absolute inset-y-0 end-0 flex items-center gap-1 pe-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onShowApiKeyChange(!showApiKey)}
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

					<div className="space-y-2">
						<Label htmlFor="baseUrl">{t.ai.baseUrl}</Label>
						<Input
							id="baseUrl"
							value={baseUrl}
							onChange={(e) => onBaseUrlChange(e.target.value)}
							placeholder="https://openrouter.ai/api/v1"
						/>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							variant="outline"
							onClick={onFetchModels}
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
							onClick={onTestConnection}
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

					{filteredFetchedModels.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-base font-semibold">
									{t.ai.availableModels} ({selectedModelsToAdd.size}{" "}
									{t.ai.selectedCount})
								</Label>
							</div>
							<div className="relative">
								<Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									value={searchQuery}
									onChange={(e) => onSearchChange(e.target.value)}
									placeholder={t.ai.searchModels}
									className="ps-9"
								/>
							</div>
							<ScrollArea className="h-64 rounded-md border">
								<div className="p-2 space-y-1">
									{filteredFetchedModels.map((model) => (
										<div
											key={model.id}
											className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${selectedModelsToAdd.has(model.id) ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
											onClick={() => onToggleModel(model.id)}
										>
											<Checkbox
												checked={selectedModelsToAdd.has(model.id)}
												onCheckedChange={() => onToggleModel(model.id)}
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
												<p>{model.contextLength?.toLocaleString()} ctx</p>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t.common.cancel}
					</Button>
					<Button
						onClick={onSave}
						disabled={saving || !apiKey || !providerName}
						className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
					>
						{saving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Check className="w-4 h-4" />
						)}
						{editing ? t.ai.updateProvider : t.ai.saveProvider}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
