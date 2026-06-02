// @ts-nocheck
"use client";

import React from "react";
import { Cpu, RefreshCw, Star, Trash2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AIProviderData, AIModelData } from "./types";

interface ModelsTabProps {
	providers: AIProviderData[];
	activeProviderId: string | null;
	onActiveProviderChange: (id: string) => void;
	onFetchModels: () => void;
	onToggleModel: (model: AIModelData, active: boolean) => void;
	onSetDefaultModel: (model: AIModelData) => void;
	onDeleteModel: (model: AIModelData) => void;
	t: Record<string, any>;
}

export default function ModelsTab({
	providers,
	activeProviderId,
	onActiveProviderChange,
	onFetchModels,
	onToggleModel,
	onSetDefaultModel,
	onDeleteModel,
	t,
}: ModelsTabProps) {
	const activeProvider = providers.find((p) => p.id === activeProviderId);

	if (providers.length === 0) return null;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">{t.ai.availableModels}</CardTitle>
				<CardDescription>{t.ai.selectModelsHint}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col sm:flex-row gap-3 mb-4">
					<Select
						value={activeProviderId || ""}
						onValueChange={onActiveProviderChange}
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
							if (activeProvider) onFetchModels();
						}}
						className="gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						{t.ai.fetchModels}
					</Button>
				</div>

				{activeProvider && activeProvider.models.length > 0 ? (
					<ScrollArea className="max-h-96">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.ai.model}</TableHead>
									<TableHead className="hidden sm:table-cell">
										{t.ai.contextLength}
									</TableHead>
									<TableHead className="text-center">{t.ai.active}</TableHead>
									<TableHead className="text-center">{t.ai.default}</TableHead>
									<TableHead className="text-end">{t.common.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{activeProvider.models.map((model) => (
									<TableRow key={model.id}>
										<TableCell>
											<div>
												<p className="font-medium text-sm">{model.modelName}</p>
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
													onToggleModel(model, checked)
												}
											/>
										</TableCell>
										<TableCell className="text-center">
											{model.isDefault ? (
												<Badge className="bg-emerald-100 text-emerald-700">
													<Star className="w-3 h-3 me-1" />
													{t.ai.default}
												</Badge>
											) : (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onSetDefaultModel(model)}
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
												onClick={() => onDeleteModel(model)}
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
	);
}
