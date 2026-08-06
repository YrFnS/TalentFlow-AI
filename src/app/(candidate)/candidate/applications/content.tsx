'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Inbox,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

type TimelineEntry = {
  id: string;
  stageName: string;
  stageColor: string | null;
  date: string;
  exitedAt: string | null;
  note: string;
};

type Interview = {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | null;
  durationMinutes: number;
  location: string | null;
  meetingLink: string | null;
};

type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo: string | null;
  location: string;
  jobType: string;
  appliedAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  matchScore: number;
  currentStage: { id: string; name: string; color: string | null } | null;
  timeline: TimelineEntry[];
  interviews: Interview[];
};

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof Send }
> = {
  APPLIED: {
    label: 'Applied',
    className: 'bg-primary/10 text-primary',
    icon: Send,
  },
  SCREENING: {
    label: 'Screening',
    className: 'bg-cyan-500/10 text-cyan-700',
    icon: Clock,
  },
  INTERVIEW: {
    label: 'Interview',
    className: 'bg-amber-500/10 text-amber-700',
    icon: Calendar,
  },
  OFFERED: {
    label: 'Offer received',
    className: 'bg-violet-500/10 text-violet-700',
    icon: CheckCircle2,
  },
  HIRED: {
    label: 'Hired',
    className: 'bg-emerald-500/10 text-emerald-700',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Not selected',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-muted text-muted-foreground',
    icon: AlertCircle,
  },
};

function companyInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/candidate/applications', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load applications'),
        );
      }
      const data = await response.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? applications
        : applications.filter(
            (application) => application.status === statusFilter,
          ),
    [applications, statusFilter],
  );

  const counts = useMemo(
    () =>
      applications.reduce<Record<string, number>>(
        (result, application) => {
          result[application.status] = (result[application.status] || 0) + 1;
          return result;
        },
        {},
      ),
    [applications],
  );

  async function withdrawApplication() {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      const response = await apiFetch('/api/candidate/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: withdrawTarget.id,
          action: 'withdraw',
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to withdraw application'),
        );
      }

      const updated = (await response.json()) as Application;
      setApplications((current) =>
        current.map((application) =>
          application.id === updated.id ? updated : application,
        ),
      );
      setWithdrawTarget(null);
      toast.success('Application withdrawn');
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to withdraw application',
      );
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-16" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track real stage history, interviews, and outcomes.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses ({applications.length})</SelectItem>
              {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_CONFIG[status].label} ({counts[status] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-label="Refresh applications"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {applications.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(STATUS_CONFIG) as ApplicationStatus[])
            .filter((status) => (counts[status] || 0) > 0)
            .map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(statusFilter === status ? 'all' : status)
                }
                className={`rounded-xl border p-3 text-start transition-colors ${
                  statusFilter === status
                    ? STATUS_CONFIG[status].className
                    : 'bg-card hover:bg-muted/40'
                }`}
              >
                <p className="text-xl font-bold">{counts[status]}</p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_CONFIG[status].label}
                </p>
              </button>
            ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">
              {applications.length === 0
                ? 'No applications yet'
                : 'No applications match this filter'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse published jobs and submit your first application.
            </p>
            {applications.length === 0 && (
              <Button asChild className="mt-4">
                <Link href="/candidate/jobs">Browse jobs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => {
            const config = STATUS_CONFIG[application.status];
            const expanded = expandedId === application.id;
            const canWithdraw = ['APPLIED', 'SCREENING', 'INTERVIEW'].includes(
              application.status,
            );
            const nextInterview = application.interviews.find(
              (interview) =>
                ['SCHEDULED', 'IN_PROGRESS'].includes(interview.status) &&
                interview.scheduledAt,
            );

            return (
              <Card key={application.id} className="overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-start gap-4 p-5 text-start"
                  onClick={() => setExpandedId(expanded ? null : application.id)}
                >
                  <Avatar className="h-11 w-11 rounded-xl">
                    <AvatarImage src={application.companyLogo || undefined} />
                    <AvatarFallback className="rounded-xl">
                      {companyInitials(application.company)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{application.jobTitle}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {application.company}
                          {application.location && (
                            <>
                              <span>·</span>
                              <MapPin className="h-3 w-3" />
                              {application.location}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.className}>{config.label}</Badge>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                      {application.matchScore > 0 && (
                        <span>{Math.round(application.matchScore)}% stored match score</span>
                      )}
                      {nextInterview?.scheduledAt && (
                        <span className="flex items-center gap-1 text-primary">
                          <Calendar className="h-3 w-3" />
                          Interview {new Date(nextInterview.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="space-y-5 border-t px-5 pb-5 pt-4">
                    <div>
                      <p className="mb-3 text-sm font-medium">Stage history</p>
                      {application.timeline.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No stage history has been recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {application.timeline.map((entry) => (
                            <div key={entry.id} className="flex gap-3">
                              <span
                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: entry.stageColor || 'var(--primary)',
                                }}
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {entry.stageName || 'Pipeline stage'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Entered {new Date(entry.date).toLocaleString()}
                                  {entry.exitedAt
                                    ? ` · Exited ${new Date(entry.exitedAt).toLocaleString()}`
                                    : ' · Current'}
                                </p>
                                {entry.note && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {application.interviews.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-medium">Interviews</p>
                        <div className="space-y-2">
                          {application.interviews.map((interview) => (
                            <div
                              key={interview.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {interview.type.replaceAll('_', ' ')} interview
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {interview.scheduledAt
                                    ? new Date(interview.scheduledAt).toLocaleString()
                                    : 'Time not set'}{' '}
                                  · {interview.durationMinutes} minutes
                                </p>
                              </div>
                              <Badge variant="outline">{interview.status}</Badge>
                              {interview.meetingLink &&
                                ['SCHEDULED', 'IN_PROGRESS'].includes(interview.status) && (
                                  <Button asChild size="sm" variant="outline">
                                    <a
                                      href={interview.meetingLink}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open meeting
                                    </a>
                                  </Button>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/candidate/jobs/${application.jobId}`}>
                          View job
                        </Link>
                      </Button>
                      {canWithdraw && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setWithdrawTarget(application)}
                        >
                          Withdraw application
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(withdrawTarget)}
        onOpenChange={(open) => !open && setWithdrawTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw application?</DialogTitle>
            <DialogDescription>
              This removes the application from the active hiring pipeline for{' '}
              {withdrawTarget?.jobTitle}. The company will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawTarget(null)}>
              Keep application
            </Button>
            <Button
              variant="destructive"
              onClick={() => void withdrawApplication()}
              disabled={withdrawing}
            >
              {withdrawing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Confirm withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
