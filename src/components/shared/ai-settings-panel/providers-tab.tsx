// @ts-nocheck
"use client";

import React from "react";
import { Key, Plus, Star, Cpu, Trash2, Edit, Loader2, Zap } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AIProviderData } from "./types";

interface ProvidersTabProps {
	loading: boolean;
	providers: AIProviderData[];
	t: Record<string, any>;
	onAddProvider: () => void;
	onEdit: (provider: AIProviderData) => void;
	onSetDefault: (provider: AIProviderData) => void;
	onDelete: (provider: AIProviderData) => void;
}

export default function ProvidersTab({
	loading,
	providers,
	t,
	onAddProvider,
	onEdit,
	onSetDefault,
	onDelete,
}: ProvidersTabProps) {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
			</div>
		);
	}

	if (providers.length === 0) {
		return (
			<Card className="border-dashed border-2">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
						<Key className="w-8 h-8 text-emerald-500" />
					</div>
					<h3 className="text-lg font-semibold mb-2">{t.ai.noProvider}</h3>
					<p className="text-muted-foreground text-center max-w-md mb-4">
						{t.ai.openRouterDesc}
					</p>
					<Button
						onClick={onAddProvider}
						className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
					>
						<Plus className="w-4 h-4" />
						{t.ai.addProvider}
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4">
			{providers.map((provider) => (
				<Card
					key={provider.id}
					className={`transition-all duration-200 hover:shadow-md ${provider.isDefault ? "border-emerald-500/50 shadow-sm" : ""}`}
				>
					<CardHeader className="pb-3">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
									<Zap className="w-5 h-5 text-emerald-600" />
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
											variant={provider.isActive ? "default" : "secondary"}
											className={
												provider.isActive
													? "bg-emerald-100 text-emerald-700"
													: ""
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
										onClick={() => onSetDefault(provider)}
										className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
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
									onClick={() => onEdit(provider)}
									className="gap-1.5"
								>
									<Edit className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">{t.ai.editProvider}</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(provider)}
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
								{provider.models.length !== 1 ? "s" : ""}
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
