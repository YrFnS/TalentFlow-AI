// @ts-nocheck
"use client";

import React from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Video, MapPin, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Interview } from "./types";
import { statusConfig, typeConfig } from "./types";

interface InterviewDetailsSheetProps {
	interview: Interview | null;
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onCancel: (i: Interview) => void;
	formatDate: (d: string) => string;
	formatTime: (d: string) => string;
	getInitials: (name: string) => string;
	t: Record<string, any>;
}

const renderStars = (rating: number | null) => {
	if (rating === null) return null;
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={cn(
						"w-4 h-4",
						star <= rating
							? "fill-amber-400 text-amber-400"
							: "text-muted-foreground/30",
					)}
				/>
			))}
		</div>
	);
};

export default function InterviewDetailsSheet({
	interview,
	open,
	onOpenChange,
	onCancel,
	formatDate,
	formatTime,
	getInitials,
	t,
}: InterviewDetailsSheetProps) {
	if (!interview) return null;

	const sConfig = statusConfig[interview.status] || statusConfig.SCHEDULED;
	const tConfig = typeConfig[interview.type] || typeConfig.VIDEO;
	const TIcon = tConfig.icon;

	const getTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			PHONE: t.interviews.phone,
			VIDEO: t.interviews.video,
			ON_SITE: t.interviews.onsite,
			ASYNC_VIDEO: t.interviews.asyncVideo,
		};
		return labels[type] || type;
	};

	const getStatusLabel = (status: string) => {
		const labels: Record<string, string> = {
			SCHEDULED: t.interviews.scheduled,
			IN_PROGRESS: t.interviews.inProgress,
			COMPLETED: t.interviews.completed,
			CANCELLED: t.interviews.cancelled,
		};
		return labels[status] || status;
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[480px] sm:max-w-[480px] p-0">
				<div className="flex flex-col h-full">
					<SheetHeader className="p-6 pb-4 border-b">
						<SheetTitle className="flex items-center gap-3">
							<div className={cn("p-2 rounded-lg", tConfig.bgColor)}>
								<TIcon className={cn("w-5 h-5", tConfig.color)} />
							</div>
							<div className="text-start">
								<p className="font-semibold">{t.interviews.interviewDetails}</p>
								<p className="text-sm text-muted-foreground">
									{getTypeLabel(interview.type)} · {interview.durationMinutes}{" "}
									{t.interviews.minutes}
								</p>
							</div>
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
						{/* Candidate */}
						<div className="space-y-2">
							<h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
								{t.interviews.candidateName}
							</h4>
							<div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
								<Avatar className="w-10 h-10">
									<AvatarFallback className="bg-teal-100 text-blue-700">
										{getInitials(interview.application.candidate.user.name)}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm font-medium">
										{interview.application.candidate.user.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{interview.application.job.title}
									</p>
								</div>
							</div>
						</div>
						<Separator />

						{/* Schedule */}
						<div className="space-y-3">
							<h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
								{t.interviews.schedule}
							</h4>
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 rounded-lg border border-border/50">
									<p className="text-xs text-muted-foreground">
										{t.interviews.date}
									</p>
									<p className="text-sm font-medium">
										{formatDate(interview.scheduledAt)}
									</p>
								</div>
								<div className="p-3 rounded-lg border border-border/50">
									<p className="text-xs text-muted-foreground">
										{t.interviews.time}
									</p>
									<p className="text-sm font-medium">
										{formatTime(interview.scheduledAt)}
									</p>
								</div>
							</div>
							<Badge
								variant="outline"
								className={cn("text-xs", sConfig.color, sConfig.bgColor)}
							>
								{getStatusLabel(interview.status)}
							</Badge>
						</div>
						<Separator />

						{/* Interviewers */}
						{interview.assignments.length > 0 && (
							<>
								<div className="space-y-2">
									<h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
										{t.interviews.interviewer}
									</h4>
									{interview.assignments.map((assignment, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between p-3 rounded-lg border border-border/50"
										>
											<div className="flex items-center gap-2">
												<Avatar className="w-7 h-7">
													<AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 text-[10px]">
														{getInitials(assignment.interviewer.name)}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm">
													{assignment.interviewer.name}
												</span>
											</div>
											{assignment.rating && renderStars(assignment.rating)}
										</div>
									))}
								</div>
								<Separator />
							</>
						)}

						{/* Location / Meeting Link */}
						{(interview.location || interview.meetingLink) && (
							<>
								<div className="space-y-2">
									<h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
										{t.candidates.contactInfo}
									</h4>
									{interview.location && (
										<div className="flex items-center gap-2 text-sm">
											<MapPin className="w-4 h-4 text-muted-foreground" />
											{interview.location}
										</div>
									)}
									{interview.meetingLink && (
										<div className="flex items-center gap-2 text-sm">
											<Video className="w-4 h-4 text-muted-foreground" />
											<a
												href={interview.meetingLink}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{interview.meetingLink}
											</a>
										</div>
									)}
								</div>
								<Separator />
							</>
						)}

						{/* Rating / Feedback */}
						{(interview.rating || interview.feedback) && (
							<>
								<div className="space-y-3">
									<h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
										{t.interviews.scorecard}
									</h4>
									{interview.rating && (
										<div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-medium text-amber-700">
													{t.interviews.rating}
												</span>
												<span className="text-lg font-bold text-amber-600">
													{interview.rating}/5
												</span>
											</div>
											{renderStars(interview.rating)}
										</div>
									)}
									{interview.feedback && (
										<div className="p-3 rounded-lg border border-border/50">
											<p className="text-xs font-medium text-muted-foreground mb-1">
												{t.interviews.feedback}
											</p>
											<p className="text-sm">{interview.feedback}</p>
										</div>
									)}
								</div>
								<Separator />
							</>
						)}
					</div>
					<div className="p-4 border-t flex gap-2">
						{interview.status === "SCHEDULED" && (
							<Button
								variant="outline"
								className="flex-1 text-destructive border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
								onClick={() => onCancel(interview)}
							>
								<Trash2 className="w-4 h-4 me-2" />
								{t.interviews.cancelInterview}
							</Button>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
