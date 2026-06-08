// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Star } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { statusConfig, typeConfig } from './interview-types';
import type { Interview } from './interview-types';

interface InterviewCardProps {
  interview: Interview;
  getTypeLabel: (type: string) => string;
  getStatusLabel: (status: string) => string;
  formatTime: (dateStr: string) => string;
  getInitials: (name: string) => string;
  onSelect: (interview: Interview) => void;
}

export default function InterviewCard({
  interview,
  getTypeLabel,
  getStatusLabel,
  formatTime,
  getInitials,
  onSelect,
}: InterviewCardProps) {
  const { t } = useI18n();
  const sConfig = statusConfig[interview.status] || statusConfig.SCHEDULED;
  const tConfig = typeConfig[interview.type] || typeConfig.VIDEO;
  const SIcon = sConfig.icon;
  const TIcon = tConfig.icon;
  const interviewerNames = interview.assignments
    .map((a) => a.interviewer.name)
    .join(', ');

  const renderStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'border cursor-pointer transition-colors hover:shadow-md hover:border-blue-300',
        sConfig.borderColor
      )}
      onClick={() => onSelect(interview)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-md', tConfig.bgColor)}>
              <TIcon className={cn('w-4 h-4', tConfig.color)} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {getTypeLabel(interview.type)}
              </p>
              <p className="text-xs text-slate-500">
                {formatTime(interview.scheduledAt)} · {interview.durationMinutes} {t.interviews.minutes}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 font-medium flex-shrink-0',
              sConfig.color,
              sConfig.bgColor,
              sConfig.borderColor
            )}
          >
            <SIcon className="w-3 h-3 me-1" />
            {getStatusLabel(interview.status)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                {getInitials(interview.application.candidate.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {interview.application.candidate.user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {interview.application.job.title}
              </p>
            </div>
          </div>

          {interviewerNames && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="w-3 h-3" />
              <span className="truncate">{interviewerNames}</span>
            </div>
          )}

          {interview.rating && (
            <div className="flex items-center gap-1">
              {renderStars(interview.rating)}
            </div>
          )}

          {interview.location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{interview.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
