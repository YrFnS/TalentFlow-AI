'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Star,
  UserRound,
  Video,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type InterviewType = 'PHONE' | 'VIDEO' | 'ON_SITE' | 'ASYNC_VIDEO';

type Interview = {
  id: string;
  applicationId: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string | null;
  durationMinutes: number;
  location: string | null;
  meetingLink: string | null;
  feedback: string | null;
  rating: number | null;
  createdAt: string;
  application: {
    id: string;
    candidate: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
      };
    };
    job: { id: string; title: string; companyId: string };
  };
  assignments: Array<{
    id: string;
    notes: string | null;
    interviewer: { id: string; name: string };
  }>;
};

type ApplicationOption = {
  id: string;
  status: string;
  candidate: {
    user: { name: string; email: string; image: string | null };
  };
  job: { id: string; title: string };
};

type ScheduleForm = {
  applicationId: string;
  type: InterviewType;
  date: string;
  time: string;
  durationMinutes: string;
  location: string;
  meetingLink: string;
  notes: string;
};

const EMPTY_SCHEDULE: ScheduleForm = {
  applicationId: '',
  type: 'VIDEO',
  date: '',
  time: '',
  durationMinutes: '30',
  location: '',
  meetingLink: '',
  notes: '',
};

const STATUS_STYLE: Record<InterviewStatus, string> = {
  SCHEDULED: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-700',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function typeIcon(type: InterviewType) {
  return type === 'PHONE' ? UserRound : type === 'ON_SITE' ? MapPin : Video;
}

export default function InterviewsPage() {
  const { user, validateSession } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InterviewStatus>('all');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleForm>(EMPTY_SCHEDULE);
  const [scheduling, setScheduling] = useState(false);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [updating, setUpdating] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canEdit = [
    'SUPER_ADMIN',
    'ADMIN',
    'COMPANY_ADMIN',
    'HR_MANAGER',
    'RECRUITER',
  ].includes(user?.role || '');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [interviewsResponse, applicationsResponse] = await Promise.all([
        fetch('/api/interviews', { cache: 'no-store' }),
        fetch('/api/applications', { cache: 'no-store' }),
      ]);
      if (!interviewsResponse.ok) {
        throw new Error(
          await getApiErrorMessage(interviewsResponse, 'Unable to load interviews'),
        );
      }

      const interviewData = await interviewsResponse.json();
      const applicationData = applicationsResponse.ok
        ? await applicationsResponse.json()
        : [];
      setInterviews(Array.isArray(interviewData) ? interviewData : []);
      setApplications(
        Array.isArray(applicationData)
          ? applicationData.filter(
              (application: ApplicationOption) =>
                !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(application.status),
            )
          : [],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load interviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return interviews.filter((interview) => {
      if (statusFilter !== 'all' && interview.status !== statusFilter) return false;
      if (!term) return true;
      return (
        interview.application.candidate.user.name.toLowerCase().includes(term) ||
        interview.application.candidate.user.email.toLowerCase().includes(term) ||
        interview.application.job.title.toLowerCase().includes(term) ||
        interview.assignments.some((assignment) =>
          assignment.interviewer.name.toLowerCase().includes(term),
        )
      );
    });
  }, [interviews, query, statusFilter]);

  const counts = useMemo(
    () =>
      interviews.reduce<Record<string, number>>(
        (result, interview) => {
          result[interview.status] = (result[interview.status] || 0) + 1;
          result.all += 1;
          return result;
        },
        { all: 0 },
      ),
    [interviews],
  );

  function openDetails(interview: Interview) {
    setSelected(interview);
    setFeedback(interview.feedback || '');
    setRating(interview.rating ? String(interview.rating) : '');
    setDetailsOpen(true);
  }

  async function scheduleInterview() {
    if (!schedule.applicationId || !schedule.date || !schedule.time) {
      toast.error('Application, date, and time are required');
      return;
    }

    const scheduledAt = new Date(`${schedule.date}T${schedule.time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('The interview date and time are invalid');
      return;
    }
    if (scheduledAt <= new Date()) {
      toast.error('Interview time must be in the future');
      return;
    }

    setScheduling(true);
    try {
      const response = await apiFetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: schedule.applicationId,
          type: schedule.type,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: Number(schedule.durationMinutes),
          location: schedule.location || undefined,
          meetingLink: schedule.meetingLink || undefined,
          notes: schedule.notes || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to schedule interview'),
        );
      }

      const interview = (await response.json()) as Interview;
      setInterviews((current) => [...current, interview].sort((left, right) => {
        const leftTime = left.scheduledAt ? new Date(left.scheduledAt).getTime() : 0;
        const rightTime = right.scheduledAt ? new Date(right.scheduledAt).getTime() : 0;
        return leftTime - rightTime;
      }));

      await apiFetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schedule.applicationId, status: 'INTERVIEW' }),
      });

      setSchedule(EMPTY_SCHEDULE);
      setScheduleOpen(false);
      toast.success('Interview scheduled');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to schedule interview');
    } finally {
      setScheduling(false);
    }
  }

  async function updateInterview(status?: InterviewStatus) {
    if (!selected) return;
    setUpdating(true);
    try {
      const response = await apiFetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: selected.id,
          status: status || selected.status,
          feedback: feedback.trim() || null,
          rating: rating ? Number(rating) : null,
        }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to update interview'));
      }

      const updated = (await response.json()) as Interview;
      setInterviews((current) =>
        current.map((interview) =>
          interview.id === updated.id ? updated : interview,
        ),
      );
      setSelected(updated);
      toast.success('Interview updated');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to update interview');
    } finally {
      setUpdating(false);
    }
  }

  async function cancelInterview(interview: Interview) {
    if (!window.confirm('Cancel this interview?')) return;
    setCancellingId(interview.id);
    try {
      const response = await apiFetch(
        `/api/interviews?interviewId=${encodeURIComponent(interview.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to cancel interview'));
      }
      const updated = (await response.json()) as Interview;
      setInterviews((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setSelected((current) =>
        current?.id === updated.id ? { ...current, ...updated } : current,
      );
      toast.success('Interview cancelled');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to cancel interview');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-12" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule interviews and capture structured feedback.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setScheduleOpen(true)}>
              <CalendarPlus className="me-2 h-4 w-4" />
              Schedule interview
            </Button>
          )}
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

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Search candidate, job, or interviewer"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses ({counts.all || 0})</SelectItem>
            {(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {status.replaceAll('_', ' ')} ({counts[status] || 0})
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No interviews found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Scheduled candidate interviews will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((interview) => {
            const Icon = typeIcon(interview.type);
            return (
              <Card key={interview.id} className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage
                        src={interview.application.candidate.user.image || undefined}
                      />
                      <AvatarFallback>
                        {initials(interview.application.candidate.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {interview.application.candidate.user.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {interview.application.job.title}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLE[interview.status]}>
                      {interview.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Date and time
                      </p>
                      <p className="mt-1 font-medium">
                        {interview.scheduledAt
                          ? new Date(interview.scheduledAt).toLocaleString()
                          : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" /> Type
                      </p>
                      <p className="mt-1 font-medium">
                        {interview.type.replaceAll('_', ' ')} · {interview.durationMinutes}m
                      </p>
                    </div>
                  </div>

                  {(interview.location || interview.meetingLink) && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {interview.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {interview.location}
                        </p>
                      )}
                      {interview.meetingLink && (
                        <a
                          className="flex items-center gap-2 text-primary hover:underline"
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open meeting link
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDetails(interview)}
                    >
                      View details
                    </Button>
                    {canEdit && interview.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => void cancelInterview(interview)}
                        disabled={cancellingId === interview.id}
                      >
                        {cancellingId === interview.id ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="me-2 h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              Select an active application and add the interview details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Application *</Label>
              <Select
                value={schedule.applicationId}
                onValueChange={(applicationId) =>
                  setSchedule((current) => ({ ...current, applicationId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose candidate and job" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {application.candidate.user.name} — {application.job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={schedule.type}
                onValueChange={(type) =>
                  setSchedule((current) => ({
                    ...current,
                    type: type as InterviewType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['PHONE', 'VIDEO', 'ON_SITE', 'ASYNC_VIDEO'] as const).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {type.replaceAll('_', ' ')}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={schedule.durationMinutes}
                onValueChange={(durationMinutes) =>
                  setSchedule((current) => ({ ...current, durationMinutes }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['15', '30', '45', '60', '90'].map((minutes) => (
                    <SelectItem key={minutes} value={minutes}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={schedule.date}
                onChange={(event) =>
                  setSchedule((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={schedule.time}
                onChange={(event) =>
                  setSchedule((current) => ({ ...current, time: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Location</Label>
              <Input
                value={schedule.location}
                onChange={(event) =>
                  setSchedule((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Office, phone, or video platform"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Meeting link</Label>
              <Input
                type="url"
                value={schedule.meetingLink}
                onChange={(event) =>
                  setSchedule((current) => ({
                    ...current,
                    meetingLink: event.target.value,
                  }))
                }
                placeholder="https://meet.example.com/..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes for interviewer</Label>
              <Textarea
                rows={3}
                value={schedule.notes}
                onChange={(event) =>
                  setSchedule((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void scheduleInterview()} disabled={scheduling}>
              {scheduling ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="me-2 h-4 w-4" />
              )}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.application.candidate.user.name}</DialogTitle>
                <DialogDescription>
                  {selected.application.job.title} · {selected.type.replaceAll('_', ' ')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                    <p className="mt-1 font-medium">
                      {selected.scheduledAt
                        ? new Date(selected.scheduledAt).toLocaleString()
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`mt-2 ${STATUS_STYLE[selected.status]}`}>
                      {selected.status}
                    </Badge>
                  </div>
                </div>

                {selected.assignments.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Interviewers</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.assignments.map((assignment) => (
                        <Badge key={assignment.id} variant="secondary">
                          {assignment.interviewer.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Select
                    value={rating || 'none'}
                    onValueChange={(value) => setRating(value === 'none' ? '' : value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not rated</SelectItem>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea
                    rows={6}
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    disabled={!canEdit}
                    placeholder="Record evidence, strengths, concerns, and recommendation."
                  />
                </div>

                {selected.rating && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-amber-500" /> Current rating:{' '}
                    {selected.rating}/5
                  </p>
                )}
              </div>

              <DialogFooter className="flex-wrap">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                {canEdit && selected.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    onClick={() => void updateInterview()}
                    disabled={updating}
                  >
                    {updating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    Save feedback
                  </Button>
                )}
                {canEdit && selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                  <Button
                    onClick={() => void updateInterview('COMPLETED')}
                    disabled={updating}
                  >
                    <CheckCircle2 className="me-2 h-4 w-4" />
                    Complete interview
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
