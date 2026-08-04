'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CalendarPlus,
  CheckCircle2,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Search,
  UserRound,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

type Application = {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  coverLetter: string | null;
  aiAnalysis: string | null;
  source: string | null;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    currentTitle: string | null;
    location: string | null;
    skills: string | null;
    experienceYears: number | null;
    bio: string | null;
    resumeUrl: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
  job: {
    id: string;
    title: string;
    companyId: string;
    company: { id: string; name: string };
  };
  currentStage: { id: string; name: string; color: string | null } | null;
};

type Job = { id: string; title: string };
type Stage = { id: string; name: string; color: string | null; order: number };

type ScheduleForm = {
  type: 'PHONE' | 'VIDEO' | 'ON_SITE' | 'ASYNC_VIDEO';
  date: string;
  time: string;
  durationMinutes: string;
  location: string;
  meetingLink: string;
  notes: string;
};

const EMPTY_SCHEDULE: ScheduleForm = {
  type: 'VIDEO',
  date: '',
  time: '',
  durationMinutes: '30',
  location: '',
  meetingLink: '',
  notes: '',
};

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-primary/10 text-primary',
  SCREENING: 'bg-cyan-500/10 text-cyan-700',
  INTERVIEW: 'bg-amber-500/10 text-amber-700',
  OFFERED: 'bg-violet-500/10 text-violet-700',
  HIRED: 'bg-emerald-500/10 text-emerald-700',
  REJECTED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-muted text-muted-foreground',
};

const EDITABLE_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'REJECTED',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function parseSkills(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function stageStatus(stageName: string): ApplicationStatus | undefined {
  const name = stageName.toLowerCase();
  if (name.includes('applied') || name.includes('new')) return 'APPLIED';
  if (name.includes('screen')) return 'SCREENING';
  if (name.includes('interview')) return 'INTERVIEW';
  if (name.includes('offer')) return 'OFFERED';
  if (name.includes('hire')) return 'HIRED';
  if (name.includes('reject')) return 'REJECTED';
  return undefined;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, validateSession } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Application | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleForm>(EMPTY_SCHEDULE);
  const [scheduling, setScheduling] = useState(false);

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
      const [applicationsResponse, jobsResponse, stagesResponse] = await Promise.all([
        fetch('/api/applications', { cache: 'no-store' }),
        fetch('/api/jobs', { cache: 'no-store' }),
        fetch('/api/pipeline-stages', { cache: 'no-store' }),
      ]);

      if (!applicationsResponse.ok) {
        throw new Error(
          await getApiErrorMessage(applicationsResponse, 'Unable to load applications'),
        );
      }

      const applicationData = await applicationsResponse.json();
      const jobData = jobsResponse.ok ? await jobsResponse.json() : [];
      const stageData = stagesResponse.ok ? await stagesResponse.json() : [];
      setApplications(Array.isArray(applicationData) ? applicationData : []);
      setJobs(Array.isArray(jobData) ? jobData : []);
      setStages(
        Array.isArray(stageData)
          ? stageData.map((stage: Stage) => ({
              id: stage.id,
              name: stage.name,
              color: stage.color,
              order: stage.order,
            }))
          : [],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load applications');
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
    return applications.filter((application) => {
      if (statusFilter !== 'all' && application.status !== statusFilter) return false;
      if (jobFilter !== 'all' && application.job.id !== jobFilter) return false;
      if (!term) return true;
      return (
        application.candidate.user.name.toLowerCase().includes(term) ||
        application.candidate.user.email.toLowerCase().includes(term) ||
        application.job.title.toLowerCase().includes(term)
      );
    });
  }, [applications, jobFilter, query, statusFilter]);

  const counts = useMemo(
    () =>
      applications.reduce<Record<string, number>>(
        (result, application) => {
          result[application.status] = (result[application.status] || 0) + 1;
          result.all += 1;
          return result;
        },
        { all: 0 },
      ),
    [applications],
  );

  async function updateApplication(
    application: Application,
    patch: { status?: ApplicationStatus; currentStageId?: string | null; notes?: string },
  ) {
    setSavingId(application.id);
    try {
      const response = await apiFetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, ...patch }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to update application'),
        );
      }

      const updated = (await response.json()) as Application;
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected((current) => (current?.id === updated.id ? updated : current));
      setNotes(updated.notes || '');
      toast.success('Application updated');
      return updated;
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to update application',
      );
      return null;
    } finally {
      setSavingId(null);
    }
  }

  function openDetails(application: Application) {
    setSelected(application);
    setNotes(application.notes || '');
    setDetailsOpen(true);
  }

  function openSchedule(application: Application) {
    setScheduleTarget(application);
    setSchedule(EMPTY_SCHEDULE);
    setScheduleOpen(true);
  }

  async function scheduleInterview() {
    if (!scheduleTarget || !schedule.date || !schedule.time) {
      toast.error('Choose an interview date and time');
      return;
    }

    setScheduling(true);
    try {
      const scheduledAt = new Date(`${schedule.date}T${schedule.time}`);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error('The interview date and time are invalid');
      }

      const response = await apiFetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: scheduleTarget.id,
          type: schedule.type,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: Number(schedule.durationMinutes),
          location: schedule.location || undefined,
          meetingLink: schedule.meetingLink || undefined,
          notes: schedule.notes || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to schedule interview'));
      }

      const interviewStage = stages.find((stage) =>
        stage.name.toLowerCase().includes('interview'),
      );
      await updateApplication(scheduleTarget, {
        status: 'INTERVIEW',
        ...(interviewStage ? { currentStageId: interviewStage.id } : {}),
      });
      setScheduleOpen(false);
      toast.success('Interview scheduled');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to schedule interview');
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review candidates and move them through the hiring process.
          </p>
        </div>
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Search candidate, email, or job"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses ({counts.all || 0})</SelectItem>
            {(Object.keys(STATUS_STYLE) as ApplicationStatus[]).map((value) => (
              <SelectItem key={value} value={value}>
                {value.replaceAll('_', ' ')} ({counts[value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-full lg:w-56">
            <Briefcase className="me-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No applications found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New candidate applications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={application.candidate.user.image || undefined} />
                          <AvatarFallback>
                            {initials(application.candidate.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {application.candidate.user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {application.candidate.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{application.job.title}</p>
                      {application.candidate.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {application.candidate.location}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLE[application.status]}>
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.currentStage ? (
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                application.currentStage.color || 'var(--primary)',
                            }}
                          />
                          {application.currentStage.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No stage</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDetails(application)}
                          aria-label="View application"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit &&
                          !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(
                            application.status,
                          ) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openSchedule(application)}
                              aria-label="Schedule interview"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.candidate.user.image || undefined} />
                    <AvatarFallback>{initials(selected.candidate.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <SheetTitle>{selected.candidate.user.name}</SheetTitle>
                    <SheetDescription>
                      {selected.candidate.currentTitle || 'Candidate'} · {selected.job.title}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 py-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="mt-1 font-medium">
                      {selected.candidate.experienceYears ?? 0} years
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">AI match</p>
                    <p className="mt-1 font-medium">
                      {selected.matchScore == null ? 'Not scored' : `${selected.matchScore}%`}
                    </p>
                  </div>
                </div>

                {parseSkills(selected.candidate.skills).length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parseSkills(selected.candidate.skills).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selected.candidate.bio && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Profile summary</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {selected.candidate.bio}
                    </p>
                  </div>
                )}

                {selected.coverLetter && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Cover letter</p>
                    <p className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm leading-6">
                      {selected.coverLetter}
                    </p>
                  </div>
                )}

                {canEdit && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={selected.status}
                        onValueChange={(value) =>
                          void updateApplication(selected, {
                            status: value as ApplicationStatus,
                          })
                        }
                        disabled={savingId === selected.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITABLE_STATUSES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value.replaceAll('_', ' ')}
                            </SelectItem>
                          ))}
                          {!EDITABLE_STATUSES.includes(selected.status) && (
                            <SelectItem value={selected.status} disabled>
                              {selected.status.replaceAll('_', ' ')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pipeline stage</Label>
                      <Select
                        value={selected.currentStage?.id || 'none'}
                        onValueChange={(value) => {
                          const stage = stages.find((item) => item.id === value);
                          void updateApplication(selected, {
                            currentStageId: value === 'none' ? null : value,
                            ...(stageStatus(stage?.name || '')
                              ? { status: stageStatus(stage?.name || '') }
                              : {}),
                          });
                        }}
                        disabled={savingId === selected.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No stage</SelectItem>
                          {stages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Internal notes</Label>
                  <Textarea
                    rows={5}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    disabled={!canEdit}
                    placeholder="Add interview context, follow-up items, or reviewer notes."
                  />
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateApplication(selected, { notes: notes.trim() })
                      }
                      disabled={savingId === selected.id}
                    >
                      {savingId === selected.id ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="me-2 h-4 w-4" />
                      )}
                      Save notes
                    </Button>
                  )}
                </div>
              </div>

              <SheetFooter className="flex-col gap-2 sm:flex-row">
                {canEdit &&
                  !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(selected.status) && (
                    <Button variant="outline" onClick={() => openSchedule(selected)}>
                      <CalendarPlus className="me-2 h-4 w-4" />
                      Schedule interview
                    </Button>
                  )}
                {canEdit && selected.status === 'INTERVIEW' && (
                  <Button onClick={() => router.push('/company/offers')}>
                    <FileCheck className="me-2 h-4 w-4" />
                    Create offer
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              {scheduleTarget
                ? `${scheduleTarget.candidate.user.name} · ${scheduleTarget.job.title}`
                : 'Choose interview details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={schedule.type}
                onValueChange={(type) =>
                  setSchedule((current) => ({
                    ...current,
                    type: type as ScheduleForm['type'],
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
              <Label>Date</Label>
              <Input
                type="date"
                value={schedule.date}
                onChange={(event) =>
                  setSchedule((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
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
              <Label>Interviewer notes</Label>
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
    </div>
  );
}
