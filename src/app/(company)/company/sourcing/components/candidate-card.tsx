// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Clock, Send } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import CircularProgress from './circular-progress';
import type { PastCandidate } from './types';

interface CandidateCardProps {
  candidate: PastCandidate;
  index: number;
  tr: Record<string, string>;
  formatDate: (dateStr: string) => string;
  getAvailabilityBadge: (availability: PastCandidate['availability']) => React.ReactNode;
  onReEngage: (candidate: PastCandidate) => void;
}

export default function CandidateCard({ candidate, index, tr, formatDate, getAvailabilityBadge, onReEngage }: CandidateCardProps) {
  return (
    <Card key={candidate.id} className="border-border/50 card-animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{candidate.name}</p>
              <p className="text-xs text-muted-foreground truncate">{candidate.currentTitle}</p>
            </div>
          </div>
          <CircularProgress value={candidate.matchScore} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{candidate.experienceYears}y exp</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {candidate.matchReasons.map((reason) => (
            <Badge key={reason} className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 text-[10px]">
              {reason}
            </Badge>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{tr.appliedBefore}:</span> {candidate.appliedBefore}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {getAvailabilityBadge(candidate.availability)}
            <span className="text-[10px] text-muted-foreground">{tr.lastActive}: {formatDate(candidate.lastActive)}</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 h-8 text-xs"
          onClick={() => onReEngage(candidate)}
        >
          <Send className="h-3 w-3 me-1.5" />
          {tr.reEngage}
        </Button>
      </CardContent>
    </Card>
  );
}
