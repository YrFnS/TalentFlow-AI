// @ts-nocheck
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/store/i18n-store";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

import type { Interview } from "./page-components/interview-types";
import {
	statusConfig,
	typeConfig,
	interviewTypes,
} from "./page-components/interview-types";
import InterviewStatsCards from "./page-components/InterviewStatsCards";
import InterviewFilters from "./page-components/InterviewFilters";
import InterviewList from "./page-components/InterviewList";
import InterviewDetailsSheet from "./page-components/InterviewDetailsSheet";
import ScheduleInterviewDialog from "./page-components/ScheduleInterviewDialog";
import CancelInterviewDialog from "./page-components/CancelInterviewDialog";
import AIGenerateQuestionsDialog from "./page-components/AIGenerateQuestionsDialog";
import { cn } from "@/lib/utils";
import { Phone, Video, MapPin, Star } from "lucide-react";

const getTypeLabel = (type: string, t: Record<string, any>) => {
	const labels: Record<string, string> = {
		PHONE: t.interviews.phone,
		VIDEO: t.interviews.video,
		ON_SITE: t.interviews.onsite,
		ASYNC_VIDEO: t.interviews.asyncVideo,
	};
	return labels[type] || type;
};

const getStatusLabel = (status: string, t: Record<string, any>) => {
	const labels: Record<string, string> = {
		SCHEDULED: t.interviews.scheduled,
		IN_PROGRESS: t.interviews.inProgress,
		COMPLETED: t.interviews.completed,
		CANCELLED: t.interviews.cancelled,
	};
	return labels[status] || status;
};

export default function InterviewsPage() {
	const { t } = useI18n();
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
		null,
	);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelTarget, setCancelTarget] = useState<Interview | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [aiQuestionsOpen, setAiQuestionsOpen] = useState(false);

	// Schedule form
	const [formType, setFormType] = useState("VIDEO");
	const [formDate, setFormDate] = useState("");
	const [formTime, setFormTime] = useState("");
	const [formDuration, setFormDuration] = useState("30");
	const [formInterviewer, setFormInterviewer] = useState("");
	const [formNotes, setFormNotes] = useState("");

	const fetchInterviews = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (statusFilter && statusFilter !== "all")
				params.set("status", statusFilter);
			const res = await fetch(`/api/interviews?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				setInterviews(data);
			}
		} catch (error) {
			console.error("Failed to fetch interviews:", error);
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		fetchInterviews();
	}, [fetchInterviews]);

	const filteredInterviews = interviews.filter((interview) => {
		const query = searchQuery.toLowerCase();
		return (
			!searchQuery ||
			interview.application.candidate.user.name.toLowerCase().includes(query) ||
			interview.application.job.title.toLowerCase().includes(query) ||
			interview.assignments.some((a) =>
				a.interviewer.name.toLowerCase().includes(query),
			)
		);
	});

	const handleSchedule = async () => {
		if (!formDate || !formTime) return;
		setSubmitting(true);
		try {
			const scheduledAt = new Date(`${formDate}T${formTime}`).toISOString();
			const res = await fetch("/api/interviews", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					applicationId: "app-demo",
					type: formType,
					scheduledAt,
					durationMinutes: parseInt(formDuration),
					notes: formNotes || undefined,
				}),
			});
			if (res.ok) {
				const newInterview = await res.json();
				setInterviews((prev) => [newInterview, ...prev]);
				setScheduleOpen(false);
				resetForm();
			}
		} catch (error) {
			console.error("Failed to schedule interview:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancelInterview = async () => {
		if (!cancelTarget) return;
		try {
			const res = await fetch(
				`/api/interviews?interviewId=${cancelTarget.id}`,
				{ method: "DELETE" },
			);
			if (res.ok) {
				setInterviews((prev) =>
					prev.map((i) =>
						i.id === cancelTarget.id ? { ...i, status: "CANCELLED" } : i,
					),
				);
				setCancelDialogOpen(false);
				setCancelTarget(null);
				if (detailsOpen && selectedInterview?.id === cancelTarget.id)
					setSelectedInterview({ ...cancelTarget, status: "CANCELLED" });
			}
		} catch (error) {
			console.error("Failed to cancel interview:", error);
		}
	};

	const resetForm = () => {
		setFormType("VIDEO");
		setFormDate("");
		setFormTime("");
		setFormDuration("30");
		setFormInterviewer("");
		setFormNotes("");
	};

	const stats = {
		scheduled: interviews.filter((i) => i.status === "SCHEDULED").length,
		inProgress: interviews.filter((i) => i.status === "IN_PROGRESS").length,
		completed: interviews.filter((i) => i.status === "COMPLETED").length,
		cancelled: interviews.filter((i) => i.status === "CANCELLED").length,
	};

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
								: "text-slate-300",
						)}
					/>
				))}
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900">
						{t.interviews.title}
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						{interviews.length} {t.interviews.title.toLowerCase()}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
						<DialogTrigger asChild>
							<Button className="bg-blue-600 hover:bg-blue-700 text-white">
								<Plus className="w-4 h-4 me-2" />
								{t.interviews.schedule}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>{t.interviews.schedule}</DialogTitle>
								<DialogDescription>
									{t.interviews.selectApplication}
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t.interviews.type}
									</label>
									<Select value={formType} onValueChange={setFormType}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{interviewTypes.map((type) => {
												const cfg = typeConfig[type];
												const Icon = cfg.icon;
												return (
													<SelectItem key={type} value={type}>
														<div className="flex items-center gap-2">
															<Icon className={cn("w-4 h-4", cfg.color)} />
															{getTypeLabel(type, t)}
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<label className="text-sm font-medium">
											{t.interviews.date}
										</label>
										<Input
											type="date"
											value={formDate}
											onChange={(e) => setFormDate(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">
											{t.interviews.time}
										</label>
										<Input
											type="time"
											value={formTime}
											onChange={(e) => setFormTime(e.target.value)}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t.interviews.duration}
									</label>
									<Select value={formDuration} onValueChange={setFormDuration}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="15">
												15 {t.interviews.minutes}
											</SelectItem>
											<SelectItem value="30">
												30 {t.interviews.minutes}
											</SelectItem>
											<SelectItem value="45">
												45 {t.interviews.minutes}
											</SelectItem>
											<SelectItem value="60">
												60 {t.interviews.minutes}
											</SelectItem>
											<SelectItem value="90">
												90 {t.interviews.minutes}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t.interviews.interviewer}
									</label>
									<Input
										placeholder="Interviewer name"
										value={formInterviewer}
										onChange={(e) => setFormInterviewer(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t.interviews.notes}
									</label>
									<Textarea
										placeholder={t.interviews.notes}
										value={formNotes}
										onChange={(e) => setFormNotes(e.target.value)}
										rows={3}
									/>
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setScheduleOpen(false)}
								>
									{t.common.cancel}
								</Button>
								<Button
									className="bg-blue-600 hover:bg-blue-700 text-white"
									onClick={handleSchedule}
									disabled={!formDate || !formTime || submitting}
								>
									{submitting ? (
										<Loader2 className="w-4 h-4 me-2 animate-spin" />
									) : null}
									{submitting ? t.common.loading : t.interviews.schedule}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
					<Button
						variant="outline"
						className="border-slate-300 text-blue-600 hover:bg-slate-50"
						onClick={() => setAiQuestionsOpen(true)}
					>
						<Sparkles className="w-4 h-4 me-2" />
						AI Generate Questions
					</Button>
				</div>
			</div>

			<InterviewStatsCards stats={stats} t={t} />
			<InterviewFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				getStatusLabel={(s) => getStatusLabel(s, t)}
				t={t}
			/>
			<InterviewList
				interviews={filteredInterviews}
				loading={loading}
				onSelectInterview={(i) => {
					setSelectedInterview(i);
					setDetailsOpen(true);
				}}
				getStatusLabel={(s) => getStatusLabel(s, t)}
				renderStars={renderStars}
				t={t}
			/>

			<InterviewDetailsSheet
				interview={selectedInterview}
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				onCancel={(i) => {
					setCancelTarget(i);
					setCancelDialogOpen(true);
				}}
				getStatusLabel={(s) => getStatusLabel(s, t)}
				renderStars={renderStars}
				getInitials={getInitials}
				t={t}
			/>
			<CancelInterviewDialog
				open={cancelDialogOpen}
				onOpenChange={setCancelDialogOpen}
				onConfirm={handleCancelInterview}
				t={t}
			/>
			<AIGenerateQuestionsDialog
				open={aiQuestionsOpen}
				onOpenChange={setAiQuestionsOpen}
				t={t}
			/>
		</div>
	);
}
