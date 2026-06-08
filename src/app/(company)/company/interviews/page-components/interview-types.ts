// @ts-nocheck
import React from 'react';
import {
  Video,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from 'lucide-react';

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

export interface InterviewStats {
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  SCHEDULED: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    icon: Calendar,
  },
  IN_PROGRESS: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: PlayCircle,
  },
  COMPLETED: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
};

export const typeConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  PHONE: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Phone,
  },
  VIDEO: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Video,
  },
  ON_SITE: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: MapPin,
  },
  ASYNC_VIDEO: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: Video,
  },
};

export const interviewTypes = ['PHONE', 'VIDEO', 'ON_SITE', 'ASYNC_VIDEO'];
export const interviewStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
