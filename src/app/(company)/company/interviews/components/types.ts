// @ts-nocheck

import {
	Calendar,
	Video,
	Phone,
	MapPin,
	CheckCircle2,
	XCircle,
	PlayCircle,
} from "lucide-react";

export interface InterviewAssignment {
	interviewer: { name: string };
	rating: number | null;
	notes: string | null;
}

export interface Interview {
	id: string;
	applicationId: string;
	type: string;
	status: string;
	scheduledAt: string;
	durationMinutes: number;
	location: string | null;
	meetingLink: string | null;
	feedback: string | null;
	rating: number | null;
	createdAt: string;
	application: {
		id: string;
		candidate: {
			user: { name: string; email: string };
		};
		job: { title: string };
	};
	assignments: InterviewAssignment[];
}

export interface AvailabilitySlot {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

export interface AvailabilityConfig {
	interviewerId: string;
	interviewerName: string;
	slots: AvailabilitySlot[];
	slotDuration: number;
	bufferBetween: number;
	timezone: string;
}

export interface SchedulingSlot {
	id: string;
	interviewerId: string;
	interviewerName: string;
	startTime: string;
	endTime: string;
	duration: number;
	status: "available" | "booked";
	bookedBy: { name: string; email: string } | null;
	token: string;
	jobTitle: string;
	companyName: string;
	location: string;
}

export interface StatusConfig {
	color: string;
	bgColor: string;
	borderColor: string;
	icon: React.ElementType;
}

export interface TypeConfig {
	color: string;
	bgColor: string;
	icon: React.ElementType;
}

export const statusConfig: Record<string, StatusConfig> = {
	SCHEDULED: {
		color: "text-amber-700",
		bgColor: "bg-amber-100 dark:bg-amber-900/30",
		borderColor: "border-amber-200 dark:border-amber-800/30",
		icon: Calendar,
	},
	IN_PROGRESS: {
		color: "text-blue-700",
		bgColor: "bg-teal-100",
		borderColor: "border-slate-200/30",
		icon: PlayCircle,
	},
	COMPLETED: {
		color: "text-emerald-700",
		bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
		borderColor: "border-emerald-200 dark:border-emerald-800/30",
		icon: CheckCircle2,
	},
	CANCELLED: {
		color: "text-red-700",
		bgColor: "bg-red-100 dark:bg-red-900/30",
		borderColor: "border-red-200 dark:border-red-800/30",
		icon: XCircle,
	},
};

export const typeConfig: Record<string, TypeConfig> = {
	PHONE: { color: "text-cyan-600", bgColor: "bg-cyan-50", icon: Phone },
	VIDEO: { color: "text-blue-600", bgColor: "bg-slate-50", icon: Video },
	ON_SITE: {
		color: "text-amber-600",
		bgColor: "bg-amber-50 dark:bg-amber-950/30",
		icon: MapPin,
	},
	ASYNC_VIDEO: {
		color: "text-purple-600 dark:text-purple-400",
		bgColor: "bg-purple-50 dark:bg-purple-950/30",
		icon: Video,
	},
};

export const interviewTypes = ["PHONE", "VIDEO", "ON_SITE", "ASYNC_VIDEO"];
export const interviewStatuses = [
	"SCHEDULED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
];

export const dayNames = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
] as const;

export const timezones = [
	"Asia/Riyadh",
	"Asia/Dubai",
	"Asia/Karachi",
	"Asia/Kolkata",
	"Europe/London",
	"Europe/Paris",
	"Europe/Berlin",
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"Pacific/Auckland",
	"Australia/Sydney",
];
