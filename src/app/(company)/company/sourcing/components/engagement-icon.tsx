// @ts-nocheck
import { Send, MailOpen, MousePointerClick, CalendarDays, Briefcase, Eye } from 'lucide-react';
import type { EngagementEventType } from './types';

export function EngagementIcon({ type }: { type: EngagementEventType }) {
  switch (type) {
    case 'EMAIL_SENT': return <Send className="h-4 w-4" />;
    case 'EMAIL_OPENED': return <MailOpen className="h-4 w-4" />;
    case 'EMAIL_CLICKED': return <MousePointerClick className="h-4 w-4" />;
    case 'INTERVIEW_SCHEDULED': return <CalendarDays className="h-4 w-4" />;
    case 'APPLIED': return <Briefcase className="h-4 w-4" />;
    case 'VIEWED_PROFILE': return <Eye className="h-4 w-4" />;
  }
}

export function EngagementColor({ type }: { type: EngagementEventType }) {
  switch (type) {
    case 'EMAIL_SENT': return 'bg-teal-100 text-blue-700 dark:bg-teal-950';
    case 'EMAIL_OPENED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950';
    case 'EMAIL_CLICKED': return 'bg-sky-100 text-sky-700 dark:bg-cyan-950';
    case 'INTERVIEW_SCHEDULED': return 'bg-amber-100 text-amber-700 dark:bg-amber-950';
    case 'APPLIED': return 'bg-teal-100 text-blue-700 dark:bg-teal-950';
    case 'VIEWED_PROFILE': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}
