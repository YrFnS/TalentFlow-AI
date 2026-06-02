// @ts-nocheck
"use client";

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import type { AiForm } from "./types";

interface AiGenerateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	aiForm: AiForm;
	onAiFormChange: (form: AiForm) => void;
	onGenerate: () => void;
	aiGenerating: boolean;
	aiError: string | null;
	t: Record<string, any>;
}

export default function AiGenerateDialog({
	open,
	onOpenChange,
	aiForm,
	onAiFormChange,
	onGenerate,
	aiGenerating,
	aiError,
	t,
}: AiGenerateDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-blue-600" />
						AI Generate Job Description
					</DialogTitle>
					<DialogDescription>
						Fill in the details below and AI will generate a complete job
						description, responsibilities, qualifications, and benefits.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					{aiError && (
						<div className="flex items-start gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
							<p className="text-xs text-red-700">{aiError}</p>
						</div>
					)}
					<div className="grid gap-2">
						<Label htmlFor="ai-title">Job Title *</Label>
						<Input
							id="ai-title"
							placeholder="e.g., Senior Frontend Engineer"
							value={aiForm.title}
							onChange={(e) =>
								onAiFormChange({ ...aiForm, title: e.target.value })
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="ai-department">Department</Label>
						<Input
							id="ai-department"
							placeholder="e.g., Engineering"
							value={aiForm.department}
							onChange={(e) =>
								onAiFormChange({ ...aiForm, department: e.target.value })
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="ai-level">Level</Label>
						<Select
							value={aiForm.level}
							onValueChange={(v) => onAiFormChange({ ...aiForm, level: v })}
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
						<Label htmlFor="ai-requirements">Key Requirements</Label>
						<Textarea
							id="ai-requirements"
							placeholder="e.g., React, TypeScript, 5+ years experience, team leadership..."
							value={aiForm.requirements}
							onChange={(e) =>
								onAiFormChange({ ...aiForm, requirements: e.target.value })
							}
							rows={3}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
						onClick={onGenerate}
						disabled={!aiForm.title.trim() || aiGenerating}
					>
						{aiGenerating ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Sparkles className="w-4 h-4" />
						)}
						{aiGenerating ? "Generating..." : "Generate"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
