// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';
import { Video, MapPin, Star, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/store/i18n-store';
import { statusConfig, typeConfig } from './interview-types';
import type { Interview } from './interview-types';

interface InterviewDetailsSheetProps {
  selectedInterview: Interview | null;
  detailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
  onCancel: (interview: Interview) => void;
  getTypeLabel: (type: string) => string;
  getStatusLabel: (status: string) => string;
  formatDate: (dateStr: string) => string;
  formatTime: (dateStr: string) => string;
  getInitials: (name: string) => string;
}

export default function InterviewDetailsSheet({
  selectedInterview,
  detailsOpen,
  onDetailsOpenChange,
  onCancel,
  getTypeLabel,
  getStatusLabel,
  formatDate,
  formatTime,
  getInitials,
}: InterviewDetailsSheetProps) {
  const { t } = useI18n();

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

  if (!selectedInterview) return null;

  return (
    <Sheet open={detailsOpen} onOpenChange={onDetailsOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  typeConfig[selectedInterview.type]?.bgColor || 'bg-blue-50'
                )}
              >
                {React.createElement(
                  typeConfig[selectedInterview.type]?.icon || Video,
                  {
                    className: cn(
                      'w-5 h-5',
                      typeConfig[selectedInterview.type]?.color || 'text-blue-600'
                    ),
                  }
                )}
              </div>
              <div className="text-start">
                <p className="font-semibold text-slate-900">{t.interviews.interviewDetails}</p>
                <p className="text-sm text-slate-500">
                  {getTypeLabel(selectedInterview.type)} · {selectedInterview.durationMinutes} {t.interviews.minutes}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Candidate Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                {t.interviews.candidateName}
              </h4>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(selectedInterview.application.candidate.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedInterview.application.candidate.user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedInterview.application.job.title}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Schedule Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                {t.interviews.schedule}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500">{t.interviews.date}</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(selectedInterview.scheduledAt)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500">{t.interviews.time}</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatTime(selectedInterview.scheduledAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    statusConfig[selectedInterview.status]?.color,
                    statusConfig[selectedInterview.status]?.bgColor
                  )}
                >
                  {getStatusLabel(selectedInterview.status)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Interviewer */}
            {selectedInterview.assignments.length > 0 && (
              <>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    {t.interviews.interviewer}
                  </h4>
                  {selectedInterview.assignments.map((assignment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                            {getInitials(assignment.interviewer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-700">{assignment.interviewer.name}</span>
                      </div>
                      {assignment.rating && renderStars(assignment.rating)}
                    </div>
                  ))}
                </div>
                <Separator />
              </>
            )}

            {/* Location / Meeting Link */}
            {(selectedInterview.location || selectedInterview.meetingLink) && (
              <>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    {t.candidates.contactInfo}
                  </h4>
                  {selectedInterview.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {selectedInterview.location}
                    </div>
                  )}
                  {selectedInterview.meetingLink && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Video className="w-4 h-4 text-slate-400" />
                      <a
                        href={selectedInterview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedInterview.meetingLink}
                      </a>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Scorecard */}
            {(selectedInterview.rating || selectedInterview.feedback) && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    {t.interviews.scorecard}
                  </h4>
                  {selectedInterview.rating && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-700">
                          {t.interviews.rating}
                        </span>
                        <span className="text-lg font-bold text-amber-600">
                          {selectedInterview.rating}/5
                        </span>
                      </div>
                      {renderStars(selectedInterview.rating)}
                    </div>
                  )}
                  {selectedInterview.feedback && (
                    <div className="p-3 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {t.interviews.feedback}
                      </p>
                      <p className="text-sm text-slate-700">{selectedInterview.feedback}</p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-2">
            {selectedInterview.status === 'SCHEDULED' && (
              <Button
                variant="outline"
                className="flex-1 text-destructive border-red-300 hover:bg-red-50"
                onClick={() => onCancel(selectedInterview)}
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
