// @ts-nocheck
"use client";

import type React from "react";
import { Calendar, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Video,
	Phone,
	MapPin,
	Star,
	CheckCircle2,
	XCircle,
	PlayCircle,
} from "lucide-react";
import type { Interview, StatusConfig, TypeConfig } from "./types";
import { statusConfig, typeConfig } from "./types";
import { getInitials } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
	Calendar,
	Video,
	Phone,
	MapPin,
	CheckCircle2,
	XCircle,
	PlayCircle,
	SCHEDULED: Calendar,
	IN_PROGRESS: PlayCircle,
	COMPLETED: CheckCircle2,
	CANCELLED: XCircle,
};

interface InterviewsTabProps {
	interviews: Interview[];
	loading: boolean;
	searchQuery: string;
	onSearchChange: (q: string) => void;
	statusFilter: string;
	onStatusFilterChange: (s: string) => void;
	onSelectInterview: (i: Interview) => void;
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

const interviewStatuses = [
	"SCHEDULED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
];

export default function InterviewsTab({
	interviews,
	loading,
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	onSelectInterview,
	formatDate,
	formatTime,
	getInitials,
	t,
}: InterviewsTabProps) {
	const stats = {
		scheduled: interviews.filter((i) => i.status === "SCHEDULED").length,
		inProgress: interviews.filter((i) => i.status === "IN_PROGRESS").length,
		completed: interviews.filter((i) => i.status === "COMPLETED").length,
		cancelled: interviews.filter((i) => i.status === "CANCELLED").length,
	};

	const groupedByDate = interviews.reduce(
		(groups, interview) => {
			const date = new Date(interview.scheduledAt).toLocaleDateString(
				undefined,
				{ year: "numeric", month: "long", day: "numeric" },
			);
			if (!groups[date]) groups[date] = [];
			groups[date].push(interview);
			return groups;
		},
		{} as Record<string, Interview[]>,
	);

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{[
					{
						label: t.interviews.scheduled,
						count: stats.scheduled,
						...statusConfig.SCHEDULED,
					},
					{
						label: t.interviews.inProgress,
						count: stats.inProgress,
						...statusConfig.IN_PROGRESS,
					},
					{
						label: t.interviews.completed,
						count: stats.completed,
						...statusConfig.COMPLETED,
					},
					{
						label: t.interviews.cancelled,
						count: stats.cancelled,
						...statusConfig.CANCELLED,
					},
				].map((stat) => {
					const Icon = stat.icon;
					return (
						<Card
							key={stat.label}
							className={cn("border card-", stat.borderColor)}
						>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className={cn("p-2 rounded-lg", stat.bgColor)}>
										<Icon className={cn("w-4 h-4", stat.color)} />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											{stat.label}
										</p>
										<p className="text-xl font-bold">{stat.count}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t.common.search}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="ps-9 h-9"
					/>
				</div>
				<Select value={statusFilter} onValueChange={onStatusFilterChange}>
					<SelectTrigger className="w-[160px] h-9">
						<SelectValue placeholder={t.interviews.status} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t.interviews.allStatuses}</SelectItem>
						{interviewStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{getStatusLabel(status, t)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Interview List */}
			{loading ? (
				<div className="space-y-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-4">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 rounded-full bg-muted" />
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-muted rounded w-1/3" />
										<div className="h-3 bg-muted rounded w-1/2" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : interviews.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
						<h3 className="text-lg font-medium">{t.interviews.noInterviews}</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{t.interviews.noInterviewsDesc}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{Object.entries(groupedByDate).map(([date, dateInterviews]) => (
						<div key={date}>
							<div className="flex items-center gap-2 mb-3">
								<Calendar className="w-4 h-4 text-blue-600" />
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									{date}
								</h3>
								<Separator className="flex-1" />
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
								{dateInterviews.map((interview) => {
									const sConfig =
										statusConfig[interview.status] || statusConfig.SCHEDULED;
									const tConfig =
										typeConfig[interview.type] || typeConfig.VIDEO;
									const SIcon = sConfig.icon;
									const TIcon = tConfig.icon;
									const interviewerNames = interview.assignments
										.map((a) => a.interviewer.name)
										.join(", ");
									return (
										<Card
											key={interview.id}
											className={cn(
												"border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-slate-300 card-",
												sConfig.borderColor,
											)}
											onClick={() => onSelectInterview(interview)}
										>
											<CardContent className="p-4">
												<div className="flex items-start justify-between gap-2 mb-3">
													<div className="flex items-center gap-2">
														<div
															className={cn(
																"p-1.5 rounded-md",
																tConfig.bgColor,
															)}
														>
															<TIcon className={cn("w-4 h-4", tConfig.color)} />
														</div>
														<div>
															<p className="text-xs font-medium text-muted-foreground">
																{getTypeLabel(interview.type, t)}
															</p>
															<p className="text-xs text-muted-foreground">
																{formatTime(interview.scheduledAt)} ·{" "}
																{interview.durationMinutes}{" "}
																{t.interviews.minutes}
															</p>
														</div>
													</div>
													<Badge
														variant="outline"
														className={cn(
															"text-[10px] px-1.5 py-0 font-medium flex-shrink-0",
															sConfig.color,
															sConfig.bgColor,
															sConfig.borderColor,
														)}
													>
														<SIcon className="w-3 h-3 me-1" />
														{getStatusLabel(interview.status, t)}
													</Badge>
												</div>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Avatar className="w-8 h-8">
															<AvatarFallback className="bg-teal-100 text-blue-700 text-[10px]">
																{getInitials(
																	interview.application.candidate.user.name,
																)}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<p className="text-sm font-medium truncate">
																{interview.application.candidate.user.name}
															</p>
															<p className="text-xs text-muted-foreground truncate">
																{interview.application.job.title}
															</p>
														</div>
													</div>
													{interviewerNames && (
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Star className="w-3 h-3" />
															<span className="truncate">
																{interviewerNames}
															</span>
														</div>
													)}
													{interview.rating && (
														<div className="flex items-center gap-1">
															{renderStars(interview.rating)}
														</div>
													)}
													{interview.location && (
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<MapPin className="w-3 h-3" />
															<span className="truncate">
																{interview.location}
															</span>
														</div>
													)}
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
