'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Loader2, Mail, MapPin, Send } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import CircularProgress from './circular-progress';
import type { PastCandidate } from './types';

interface CandidateCardProps {
  candidate: PastCandidate;
  index: number;
  tr: Record<string, string>;
  formatDate: (dateStr: string) => string;
  getAvailabilityBadge: (
    availability: PastCandidate['availability'],
  ) => React.ReactNode;
  onReEngage: (candidate: PastCandidate) => void;
  busy?: boolean;
}

export default function CandidateCard({
  candidate,
  index,
  tr,
  formatDate,
  getAvailabilityBadge,
  onReEngage,
  busy = false,
}: CandidateCardProps) {
  return (
    <Card
      className="border-border/60 transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={candidate.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{candidate.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {candidate.currentTitle}
              </p>
            </div>
          </div>
          <CircularProgress value={candidate.matchScore} />
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{candidate.location}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {candidate.experienceYears} years experience
          </span>
          <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </span>
        </div>

        {candidate.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.matchReasons.map((reason) => (
              <Badge key={reason} variant="secondary" className="text-[10px]">
                {reason}
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-lg border bg-muted/25 p-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">
              {tr.appliedBefore || 'Previous application'}:
            </span>{' '}
            {candidate.appliedBefore}
          </p>
          <p className="mt-1 line-clamp-2">{candidate.reasoning}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getAvailabilityBadge(candidate.availability)}
            <span className="text-[10px] text-muted-foreground">
              {tr.lastActive || 'Last active'}: {formatDate(candidate.lastActive)}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {candidate.confidence} confidence
          </Badge>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => onReEngage(candidate)}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="me-2 h-3.5 w-3.5" />
          )}
          {tr.reEngage || 'Re-engage candidate'}
        </Button>
      </CardContent>
    </Card>
  );
}
