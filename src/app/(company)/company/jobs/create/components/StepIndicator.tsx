// @ts-nocheck
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Check,
	Briefcase,
	FileText,
	DollarSign,
	HelpCircle,
	Eye,
} from "lucide-react";

const stepIcons = [Briefcase, FileText, DollarSign, HelpCircle, Eye];
const stepTitles = [
	"Details",
	"Requirements",
	"Compensation",
	"Screening",
	"Preview",
];

interface StepIndicatorProps {
	currentStep: number;
	onStepClick: (step: number) => void;
}

export default function StepIndicator({
	currentStep,
	onStepClick,
}: StepIndicatorProps) {
	return (
		<div className="flex items-center gap-2">
			{stepTitles.map((title, index) => {
				const stepId = index + 1;
				const Icon = stepIcons[index];
				const isActive = currentStep === stepId;
				const isComplete = currentStep > stepId;
				return (
					<React.Fragment key={stepId}>
						<button
							onClick={() => stepId < currentStep && onStepClick(stepId)}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
								isActive && "bg-blue-600/10 text-blue-700",
								isComplete && "text-blue-600 cursor-pointer",
								!isActive && !isComplete && "text-muted-foreground",
							)}
						>
							<div
								className={cn(
									"flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
									isActive && "bg-blue-600 text-white",
									isComplete && "bg-teal-100 text-blue-600",
									!isActive && !isComplete && "bg-muted text-muted-foreground",
								)}
							>
								{isComplete ? <Check className="w-3.5 h-3.5" /> : stepId}
							</div>
							<span className="hidden sm:inline">{title}</span>
						</button>
						{index < stepTitles.length - 1 && (
							<div
								className={cn(
									"flex-1 h-px mx-1",
									isComplete ? "bg-teal-300 dark:bg-blue-700" : "bg-border",
								)}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
