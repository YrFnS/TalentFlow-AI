'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Target, TrendingUp } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, getInitials } from '@/lib/utils';
import { EngagementColor, EngagementIcon } from './engagement-icon';
import type { EngagementEvent, EngagementEventType } from './types';

interface EngagementTabProps {
  ts: Record<string, string>;
  formatDateTime: (dateStr: string) => string;
}

const FILTERS = [
  'ALL',
  'EMAIL_SENT',
  'EMAIL_OPENED',
  'EMAIL_CLICKED',
  'INTERVIEW_SCHEDULED',
  'APPLIED',
  'VIEWED_PROFILE',
] as const;

function detailText(details: Record<string, unknown>): string {
  const message = details.message;
  if (typeof message === 'string' && message.trim()) return message;
  const jobTitle = details.jobTitle;
  const status = details.deliveryStatus;
  if (typeof jobTitle === 'string' && jobTitle) {
    return `Opportunity: ${jobTitle}${typeof status === 'string' ? ` · ${status}` : ''}`;
  }
  if (typeof status === 'string') return `Delivery status: ${status}`;
  return 'Engagement recorded';
}

export default function EngagementTab({
  ts,
  formatDateTime,
}: EngagementTabProps) {
  const [engagementFilter, setEngagementFilter] =
    useState<EngagementEventType | 'ALL'>('ALL');
  const [events, setEvents] = useState<EngagementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/talent-rediscovery/engagements', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load engagement history'),
        );
      }
      const data = await response.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load engagement history',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredEvents = useMemo(() => {
    if (engagementFilter === 'ALL') return events;
    return events.filter((event) => event.type === engagementFilter);
  }, [engagementFilter, events]);

  function getEventTypeLabel(type: EngagementEventType): string {
    const map: Record<EngagementEventType, string> = {
      EMAIL_SENT: ts.emailSent || 'Email sent',
      EMAIL_OPENED: ts.emailOpened || 'Email opened',
      EMAIL_CLICKED: ts.emailClicked || 'Email clicked',
      INTERVIEW_SCHEDULED: ts.interviewScheduled || 'Interview scheduled',
      APPLIED: ts.applied || 'Applied',
      VIEWED_PROFILE: ts.viewedProfile || 'Profile reviewed',
    };
    return map[type];
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {ts.engagementTab || 'Engagement history'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Outreach and candidate activity recorded for this company.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {ts.filterByType || 'Filter'}:
        </span>
        {FILTERS.map((type) => (
          <Button
            key={type}
            variant={engagementFilter === type ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0 text-xs"
            onClick={() => setEngagementFilter(type)}
          >
            {type === 'ALL'
              ? ts.allTypes || 'All'
              : getEventTypeLabel(type)}
          </Button>
        ))}
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            {ts.eventTimeline || 'Event timeline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg bg-muted/40"
                />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                {ts.noEvents || 'No engagement events yet'}
              </p>
            </div>
          ) : (
            <div className="relative space-y-1">
              <div className="absolute bottom-4 start-5 top-4 w-px bg-border" />
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative flex items-start gap-4 py-3"
                >
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      EngagementColor({ type: event.type }),
                    )}
                  >
                    <EngagementIcon type={event.type} />
                  </div>

                  <div className="min-w-0 flex-1 rounded-lg border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={event.candidateImage || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(event.candidateName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {event.candidateName}
                          </p>
                          {event.candidateTitle && (
                            <p className="truncate text-xs text-muted-foreground">
                              {event.candidateTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            'border-0 text-[10px]',
                            EngagementColor({ type: event.type }),
                          )}
                        >
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateTime(event.date)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {detailText(event.details)}
                    </p>
                    {event.campaignName && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Target className="h-3 w-3" />
                        {event.campaignName}
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
