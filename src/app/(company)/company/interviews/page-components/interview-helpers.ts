// @ts-nocheck
import { useI18n } from '@/store/i18n-store';

export function useInterviewHelpers() {
  const { t } = useI18n();

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PHONE: t.interviews.phone,
      VIDEO: t.interviews.video,
      ON_SITE: t.interviews.onsite,
      ASYNC_VIDEO: t.interviews.asyncVideo,
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      SCHEDULED: t.interviews.scheduled,
      IN_PROGRESS: t.interviews.inProgress,
      COMPLETED: t.interviews.completed,
      CANCELLED: t.interviews.cancelled,
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return { getTypeLabel, getStatusLabel, formatDate, formatTime, getInitials };
}
