// @ts-nocheck
"use client";

import React from "react";
import { Activity, Cpu, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import type { UsageStats } from "./types";

interface UsageTabProps {
	usageStats: UsageStats | null;
	t: Record<string, any>;
	featureLabels: Record<string, string>;
}

export default function UsageTab({
	usageStats,
	t,
	featureLabels,
}: UsageTabProps) {
	if (!usageStats) {
		return (
			<Card className="border-dashed border-2">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<Activity className="w-12 h-12 text-muted-foreground mb-3" />
					<p className="text-muted-foreground">{t.ai.noProvider}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[
					{
						icon: Activity,
						color: "text-emerald-600",
						bg: "bg-emerald-500/10",
						label: t.ai.totalRequests,
						value: usageStats.totalRequests,
					},
					{
						icon: Cpu,
						color: "text-blue-600",
						bg: "bg-slate-500/10",
						label: t.ai.totalTokens,
						value: usageStats.totalTokens.toLocaleString(),
					},
					{
						icon: Zap,
						color: "text-cyan-600",
						bg: "bg-cyan-500/10",
						label: t.ai.successRate,
						value: `${usageStats.successRate.toFixed(1)}%`,
					},
					{
						icon: Brain,
						color: "text-green-600 dark:text-green-400",
						bg: "bg-green-500/10",
						label: t.ai.tokensPerRequest,
						value: usageStats.avgTokensPerRequest,
					},
				].map((stat) => (
					<Card key={stat.label}>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center gap-3">
								<div
									className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bg}`}
								>
									<stat.icon className={`w-5 h-5 ${stat.color}`} />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">{stat.label}</p>
									<p className="text-2xl font-bold">{stat.value}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

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
										? (usageStats.totalInputTokens / usageStats.totalTokens) *
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
										? (usageStats.totalOutputTokens / usageStats.totalTokens) *
											100
										: 0
								}
								className="h-2"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{usageStats.featureBreakdown.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t.ai.featureBreakdown}</CardTitle>
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
											<TableCell className="text-center">{fb.count}</TableCell>
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
					{t.ai.lastUsed}: {new Date(usageStats.lastUsed).toLocaleString()}
				</p>
			)}
		</>
	);
}
