// @ts-nocheck
import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/store/i18n-store';
import type { Interview } from './interview-types';
import InterviewCard from './InterviewCard';

interface InterviewListProps {
  loading: boolean;
  filteredInterviews: Interview[];
  getTypeLabel: (type: string) => string;
  getStatusLabel: (status: string) => string;
  formatTime: (dateStr: string) => string;
  getInitials: (name: string) => string;
  onSelectInterview: (interview: Interview) => void;
}

export default function InterviewList({
  loading,
  filteredInterviews,
  getTypeLabel,
  getStatusLabel,
  formatTime,
  getInitials,
  onSelectInterview,
}: InterviewListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredInterviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">{t.interviews.noInterviews}</h3>
          <p className="text-sm text-slate-500 mt-1">{t.interviews.noInterviewsDesc}</p>
        </CardContent>
      </Card>
    );
  }

  // Group interviews by date
  const groupedByDate = filteredInterviews.reduce(
    (groups, interview) => {
      const date = new Date(interview.scheduledAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(interview);
      return groups;
    },
    {} as Record<string, Interview[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateInterviews]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {date}
            </h3>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dateInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                getTypeLabel={getTypeLabel}
                getStatusLabel={getStatusLabel}
                formatTime={formatTime}
                getInitials={getInitials}
                onSelect={onSelectInterview}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
