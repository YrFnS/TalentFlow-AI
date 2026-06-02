// @ts-nocheck
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Plus,
	Trash2,
	GripVertical,
	ChevronUp,
	ChevronDown,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreeningQuestion } from "./types";
import { questionTypeOptions } from "./types";

interface ScreeningQuestionEditorProps {
	question: ScreeningQuestion;
	index: number;
	total: number;
	onUpdate: (field: keyof ScreeningQuestion, value: unknown) => void;
	onRemove: () => void;
	onMove: (direction: "up" | "down") => void;
	onAddOption: () => void;
	onRemoveOption: (optIndex: number) => void;
	onUpdateOption: (optIndex: number, value: string) => void;
	t: Record<string, any>;
}

export default function ScreeningQuestionEditor({
	question,
	index,
	total,
	onUpdate,
	onRemove,
	onMove,
	onAddOption,
	onRemoveOption,
	onUpdateOption,
	t,
}: ScreeningQuestionEditorProps) {
	const screening = t.screening;

	return (
		<div
			className={cn(
				"border rounded-lg p-4 space-y-4 transition-colors",
				question.isKnockout
					? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10"
					: "border-border",
			)}
		>
			{/* Question Header */}
			<div className="flex items-center gap-2">
				<GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 cursor-grab" />
				<span className="text-xs font-medium text-muted-foreground">
					#{index + 1}
				</span>
				<div className="flex-1" />
				{index > 0 && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => onMove("up")}
						title={screening.moveUp}
					>
						<ChevronUp className="w-4 h-4" />
					</Button>
				)}
				{index < total - 1 && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => onMove("down")}
						title={screening.moveDown}
					>
						<ChevronDown className="w-4 h-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-destructive hover:text-destructive"
					onClick={onRemove}
					title={screening.removeQuestion}
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>

			{/* Question Text */}
			<div className="grid gap-2">
				<Label className="text-xs">{screening.questionText}</Label>
				<Input
					placeholder="e.g., Do you have experience with React?"
					value={question.question}
					onChange={(e) => onUpdate("question", e.target.value)}
				/>
			</div>

			{/* Question Type + Required */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="grid gap-2">
					<Label className="text-xs">{screening.questionType}</Label>
					<Select
						value={question.questionType}
						onValueChange={(v) => onUpdate("questionType", v)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{questionTypeOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{screening[opt.labelKey as keyof typeof screening]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label className="text-xs">
						{screening.required}/{screening.optional}
					</Label>
					<div className="flex items-center gap-3 h-10">
						<Switch
							checked={question.isRequired}
							onCheckedChange={(v) => onUpdate("isRequired", v)}
						/>
						<span className="text-sm text-muted-foreground">
							{question.isRequired ? screening.required : screening.optional}
						</span>
					</div>
				</div>
			</div>

			{/* Multiple Choice Options */}
			{question.questionType === "MULTIPLE_CHOICE" && (
				<div className="grid gap-2">
					<Label className="text-xs">
						{screening.typeMultipleChoice}{" "}
						{screening.questionType.split(" ")[0]}
					</Label>
					<div className="space-y-2">
						{question.options.map((opt, optIndex) => (
							<div key={optIndex} className="flex items-center gap-2">
								<div className="w-5 h-5 rounded-full border border-slate-300 text-blue-600 text-[10px] flex items-center justify-center flex-shrink-0">
									{String.fromCharCode(65 + optIndex)}
								</div>
								<Input
									placeholder={`Option ${optIndex + 1}`}
									value={opt}
									onChange={(e) => onUpdateOption(optIndex, e.target.value)}
									className="flex-1 h-8 text-sm"
								/>
								{question.options.length > 2 && (
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-destructive hover:text-destructive"
										onClick={() => onRemoveOption(optIndex)}
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								)}
							</div>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onAddOption}
						className="h-7 text-xs border-slate-300 text-blue-600"
					>
						<Plus className="w-3 h-3 me-1" />
						{screening.addOption}
					</Button>
				</div>
			)}

			{/* Knockout Toggle */}
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<Switch
						checked={question.isKnockout}
						onCheckedChange={(v) => onUpdate("isKnockout", v)}
					/>
					<div className="flex items-center gap-2">
						<AlertTriangle className="w-4 h-4 text-amber-500" />
						<Label className="text-sm font-medium">{screening.knockout}</Label>
					</div>
				</div>
				{question.isKnockout && (
					<div className="ms-7 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 space-y-3">
						<p className="text-xs text-amber-700">{screening.knockoutDesc}</p>
						<div className="grid gap-2">
							<Label className="text-xs text-amber-700">
								{screening.disqualifyAnswer}
							</Label>
							{question.questionType === "YES_NO" ? (
								<Select
									value={question.knockoutAnswer}
									onValueChange={(v) => onUpdate("knockoutAnswer", v)}
								>
									<SelectTrigger className="h-8 border-amber-300 dark:border-amber-700">
										<SelectValue placeholder={screening.selectAnswer} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Yes">{screening.yes}</SelectItem>
										<SelectItem value="No">{screening.no}</SelectItem>
									</SelectContent>
								</Select>
							) : question.questionType === "MULTIPLE_CHOICE" ? (
								<Select
									value={question.knockoutAnswer}
									onValueChange={(v) => onUpdate("knockoutAnswer", v)}
								>
									<SelectTrigger className="h-8 border-amber-300 dark:border-amber-700">
										<SelectValue placeholder={screening.selectAnswer} />
									</SelectTrigger>
									<SelectContent>
										{question.options
											.filter((o) => o.trim())
											.map((opt, i) => (
												<SelectItem key={i} value={opt}>
													{opt}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							) : (
								<Input
									placeholder={screening.enterAnswer}
									value={question.knockoutAnswer}
									onChange={(e) => onUpdate("knockoutAnswer", e.target.value)}
									className="h-8 border-amber-300 dark:border-amber-700"
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
