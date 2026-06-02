// @ts-nocheck
"use client";

import React, { useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiQuestionForm {
	role: string;
	level: string;
	type: string;
	count: number;
}

interface GeneratedQuestion {
	question: string;
	category: string;
	difficulty: string;
	evaluationCriteria: string;
}

interface AiQuestionsDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	t: Record<string, any>;
}

export default function AiQuestionsDialog({
	open,
	onOpenChange,
	t,
}: AiQuestionsDialogProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
	const [form, setForm] = useState<AiQuestionForm>({
		role: "",
		level: "Mid",
		type: "Mixed",
		count: 5,
	});

	const handleGenerate = useCallback(async () => {
		if (!form.role.trim()) return;
		setLoading(true);
		setError(null);
		setQuestions([]);
		try {
			const res = await fetch("/api/ai/generate-interview-questions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					role: form.role.trim(),
					level: form.level,
					type: form.type.toLowerCase(),
					count: form.count,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to generate questions");
				return;
			}
			if (Array.isArray(data.questions)) setQuestions(data.questions);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		} finally {
			setLoading(false);
		}
	}, [form]);

	const handleAddToKit = (question: GeneratedQuestion) => {
		const kit = JSON.parse(localStorage.getItem("interviewKit") || "[]");
		kit.push(question);
		localStorage.setItem("interviewKit", JSON.stringify(kit));
		toast.success("Added to interview kit");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-blue-600" />
						AI Generate Interview Questions
					</DialogTitle>
					<DialogDescription>
						Let AI generate tailored interview questions for any role and level.
					</DialogDescription>
				</DialogHeader>

				{questions.length === 0 && !loading && !error && (
					<div className="space-y-4 py-2">
						<div className="grid gap-2">
							<Label className="text-sm font-medium">Role *</Label>
							<Input
								placeholder="e.g., Senior Frontend Engineer"
								value={form.role}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, role: e.target.value }))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label className="text-sm font-medium">Level</Label>
								<Select
									value={form.level}
									onValueChange={(v) =>
										setForm((prev) => ({ ...prev, level: v }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Junior">Junior</SelectItem>
										<SelectItem value="Mid">Mid</SelectItem>
										<SelectItem value="Senior">Senior</SelectItem>
										<SelectItem value="Lead">Lead</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label className="text-sm font-medium">Type</Label>
								<Select
									value={form.type}
									onValueChange={(v) =>
										setForm((prev) => ({ ...prev, type: v }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Technical">Technical</SelectItem>
										<SelectItem value="Behavioral">Behavioral</SelectItem>
										<SelectItem value="Mixed">Mixed</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid gap-2">
							<Label className="text-sm font-medium">Number of Questions</Label>
							<Input
								type="number"
								min={1}
								max={20}
								value={form.count}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										count: parseInt(e.target.value) || 5,
									}))
								}
							/>
						</div>
						<Button
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
							onClick={handleGenerate}
							disabled={!form.role.trim()}
						>
							<Sparkles className="w-4 h-4 me-2" />
							Generate Questions
						</Button>
					</div>
				)}

				{loading && (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
						<p className="mt-3 text-sm text-muted-foreground">
							Generating questions...
						</p>
					</div>
				)}

				{error && (
					<div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-sm text-red-700">
						{error}
					</div>
				)}

				{questions.length > 0 && (
					<div className="space-y-3">
						{questions.map((q, idx) => (
							<Card key={idx} className="border-border/50">
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="space-y-1.5 flex-1">
											<p className="text-sm font-medium">{q.question}</p>
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="text-[10px] px-1.5 py-0"
												>
													{q.category}
												</Badge>
												<Badge
													variant="outline"
													className="text-[10px] px-1.5 py-0 text-amber-600"
												>
													{q.difficulty}
												</Badge>
											</div>
											{q.evaluationCriteria && (
												<p className="text-xs text-muted-foreground mt-1">
													{q.evaluationCriteria}
												</p>
											)}
										</div>
										<Button
											size="sm"
											variant="ghost"
											className="text-blue-600 h-8"
											onClick={() => handleAddToKit(q)}
										>
											Add to Kit
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
