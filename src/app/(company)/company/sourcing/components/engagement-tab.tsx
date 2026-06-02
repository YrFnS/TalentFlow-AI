// @ts-nocheck
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockEngagementEvents } from './mock-data';
import { EngagementIcon, EngagementColor } from './engagement-icon';
import type { EngagementEventType, EngagementEvent } from './types';

interface EngagementTabProps {
  ts: Record<string, string>;
  formatDateTime: (dateStr: string) => string;
}

export default function EngagementTab({ ts, formatDateTime }: EngagementTabProps) {
  const [engagementFilter, setEngagementFilter] = useState<EngagementEventType | 'ALL'>('ALL');

  const filteredEvents = useMemo(() => {
    if (engagementFilter === 'ALL') return mockEngagementEvents;
    return mockEngagementEvents.filter(e => e.type === engagementFilter);
  }, [engagementFilter]);

  const getEventTypeLabel = (type: EngagementEventType): string => {
    const map: Record<string, string> = {
      EMAIL_SENT: ts.emailSent,
      EMAIL_OPENED: ts.emailOpened,
      EMAIL_CLICKED: ts.emailClicked,
      INTERVIEW_SCHEDULED: ts.interviewScheduled,
      APPLIED: ts.applied,
      VIEWED_PROFILE: ts.viewedProfile,
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-muted-foreground shrink-0">{ts.filterByType}:</span>
        {(['ALL', 'EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'INTERVIEW_SCHEDULED', 'APPLIED', 'VIEWED_PROFILE'] as const).map((type) => (
          <Button
            key={type}
            variant={engagementFilter === type ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 text-[10px] shrink-0',
              engagementFilter === type
                ? 'bg-gradient-to-r bg-blue-600 text-white border-0'
                : 'border-border/50'
            )}
            onClick={() => setEngagementFilter(type)}
          >
            {type === 'ALL' ? ts.allTypes : getEventTypeLabel(type)}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            {ts.eventTimeline}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{ts.noEvents}</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute start-5 top-2 bottom-2 w-px bg-border/50" />

              {filteredEvents.map((event, idx) => (
                <div key={event.id} className="relative flex items-start gap-4 py-3 animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  {/* Dot */}
                  <div className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    EngagementColor({ type: event.type })
                  )}>
                    <EngagementIcon type={event.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2 border-b border-border/20 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{event.candidateName}</span>
                        <Badge className={cn('text-[10px] border-0', EngagementColor({ type: event.type }))}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(event.date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.details}</p>
                    {event.campaignName && (
                      <p className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1">
                        <Target className="h-2.5 w-2.5" />{event.campaignName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
