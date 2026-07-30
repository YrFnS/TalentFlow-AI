'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Video,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type InterviewQuestion = {
  text: string;
  type: string;
};

type ApplicationOption = {
  id: string;
  status: string;
  candidate: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  };
  job: {
    id: string;
    title: string;
  };
};

type VideoInterviewResponse = {
  id: string;
  questionIndex: number;
  duration: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  retakes: number;
  completedAt: string | null;
};

type VideoInterview = {
  id: string;
  applicationId: string;
  title: string;
  description: string | null;
  questions: InterviewQuestion[];
  responseDeadline: string | null;
  maxRetakes: number;
  timePerQuestion: number | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  responses: VideoInterviewResponse[];
  application: ApplicationOption | null;
};

type CreateForm = {
  applicationId: string;
  title: string;
  description: string;
  responseDeadline: string;
  maxRetakes: string;
  timePerQuestion: string;
  questions: InterviewQuestion[];
};

type StatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
};

const initialForm: CreateForm = {
  applicationId: '',
  title: '',
  description: '',
  responseDeadline: '',
  maxRetakes: '1',
  timePerQuestion: '90',
  questions: [{ text: '', type: 'behavioral' }],
};

const terminalApplicationStatuses = new Set([
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-700',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700',
  EXPIRED: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function averageScore(interview: VideoInterview): number | null {
  const values = interview.responses
    .map((response) => response.aiScore)
    .filter((score): score is number => score !== null);

  if (!values.length) return null;
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}

export default function VideoInterviewsContent() {
  const [interviews, setInterviews] = useState<VideoInterview[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VideoInterview | null>(null);
  const [form, setForm] = useState<CreateForm>(initialForm);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [interviewsResponse, applicationsResponse] = await Promise.all([
        fetch('/api/video-interviews', { cache: 'no-store' }),
        fetch('/api/applications', { cache: 'no-store' }),
      ]);

      if (!interviewsResponse.ok) {
        throw new Error(
          await getApiErrorMessage(
            interviewsResponse,
            'Unable to load video interviews',
          ),
        );
      }

      const interviewData = await interviewsResponse.json();
      const applicationData = applicationsResponse.ok
        ? await applicationsResponse.json()
        : [];

      setInterviews(Array.isArray(interviewData) ? interviewData : []);
      setApplications(Array.isArray(applicationData) ? applicationData : []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load video interviews',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeApplicationIds = useMemo(
    () =>
      new Set(
        interviews
          .filter((interview) =>
            ['PENDING', 'IN_PROGRESS'].includes(interview.status),
          )
          .map((interview) => interview.applicationId),
      ),
    [interviews],
  );

  const eligibleApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          !terminalApplicationStatuses.has(application.status) &&
          !activeApplicationIds.has(application.id),
      ),
    [activeApplicationIds, applications],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return interviews.filter((interview) => {
      if (statusFilter !== 'all' && interview.status !== statusFilter) {
        return false;
      }
      if (!term) return true;

      return (
        interview.title.toLowerCase().includes(term) ||
        interview.application?.candidate.user.name
          .toLowerCase()
          .includes(term) ||
        interview.application?.job.title.toLowerCase().includes(term)
      );
    });
  }, [interviews, query, statusFilter]);

  const stats = useMemo(
    () => ({
      total: interviews.length,
      pending: interviews.filter((interview) => interview.status === 'PENDING')
        .length,
      active: interviews.filter(
        (interview) => interview.status === 'IN_PROGRESS',
      ).length,
      completed: interviews.filter(
        (interview) => interview.status === 'COMPLETED',
      ).length,
    }),
    [interviews],
  );

  const statCards: StatCard[] = [
    { label: 'Total assignments', value: stats.total, icon: Video },
    { label: 'Pending', value: stats.pending, icon: CalendarClock },
    { label: 'In progress', value: stats.active, icon: Clock },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
  ];

  function setField<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateQuestion(
    index: number,
    field: keyof InterviewQuestion,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    }));
  }

  function removeQuestion(index: number) {
    setForm((current) => ({
      ...current,
      questions:
        current.questions.length === 1
          ? current.questions
          : current.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  async function createInterview() {
    if (!form.applicationId) {
      toast.error('Select a real candidate application');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Interview title is required');
      return;
    }
    if (form.questions.some((question) => !question.text.trim())) {
      toast.error('Every question needs text');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch('/api/video-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: form.applicationId,
          title: form.title,
          description: form.description || undefined,
          responseDeadline: form.responseDeadline || undefined,
          maxRetakes: Number(form.maxRetakes),
          timePerQuestion: Number(form.timePerQuestion),
          questions: form.questions.map((question) => ({
            text: question.text.trim(),
            type: question.type,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to create video interview'),
        );
      }

      const created = (await response.json()) as VideoInterview;
      setInterviews((current) => [created, ...current]);
      setForm(initialForm);
      setCreateOpen(false);
      toast.success('Video interview assigned');
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : 'Unable to create video interview',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelInterview(interview: VideoInterview) {
    const candidateName =
      interview.application?.candidate.user.name || 'this candidate';
    if (!confirm(`Cancel “${interview.title}” for ${candidateName}?`)) return;

    setCancellingId(interview.id);
    try {
      const response = await apiFetch(
        `/api/video-interviews?id=${encodeURIComponent(interview.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to cancel video interview'),
        );
      }

      const updated = (await response.json()) as VideoInterview;
      setInterviews((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (selected?.id === updated.id) setSelected(updated);
      toast.success('Video interview cancelled');
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : 'Unable to cancel video interview',
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Video interviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign asynchronous interviews to real applications and review
            submitted responses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
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

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={eligibleApplications.length === 0}>
                <Plus className="me-2 h-4 w-4" />
                Assign interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign a video interview</DialogTitle>
                <DialogDescription>
                  The candidate receives a portal notification after the
                  assignment is created.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label>Application *</Label>
                  <Select
                    value={form.applicationId}
                    onValueChange={(value) => setField('applicationId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a candidate and role" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleApplications.map((application) => (
                        <SelectItem key={application.id} value={application.id}>
                          {application.candidate.user.name} — {application.job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interview title *</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setField('title', event.target.value)}
                    placeholder="Frontend engineering interview"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setField('description', event.target.value)
                    }
                    rows={3}
                    placeholder="Explain what the candidate should prepare."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input
                      type="datetime-local"
                      value={form.responseDeadline}
                      onChange={(event) =>
                        setField('responseDeadline', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Retakes</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={form.maxRetakes}
                      onChange={(event) =>
                        setField('maxRetakes', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seconds per question</Label>
                    <Input
                      type="number"
                      min="30"
                      max="900"
                      value={form.timePerQuestion}
                      onChange={(event) =>
                        setField('timePerQuestion', event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Questions *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setField('questions', [
                          ...form.questions,
                          { text: '', type: 'behavioral' },
                        ])
                      }
                    >
                      <Plus className="me-1 h-3 w-3" />
                      Add question
                    </Button>
                  </div>

                  {form.questions.map((question, index) => (
                    <div key={index} className="rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={question.text}
                            onChange={(event) =>
                              updateQuestion(index, 'text', event.target.value)
                            }
                            placeholder={`Question ${index + 1}`}
                          />
                          <Select
                            value={question.type}
                            onValueChange={(value) =>
                              updateQuestion(index, 'type', value)
                            }
                          >
                            <SelectTrigger className="w-full sm:w-56">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="intro">Introduction</SelectItem>
                              <SelectItem value="behavioral">Behavioral</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="situational">Situational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={form.questions.length === 1}
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void createInterview()} disabled={submitting}>
                  {submitting && (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  )}
                  Assign interview
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {eligibleApplications.length === 0 && applications.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              Every eligible application already has an active assignment, or
              the remaining applications are in terminal states.
            </p>
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="min-w-0 flex-1"
          placeholder="Search candidate, role, or interview title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Video className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No video interviews found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assign an interview from a real application to begin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((interview) => {
            const candidate = interview.application?.candidate.user;
            const score = averageScore(interview);
            const canCancel = ['PENDING', 'IN_PROGRESS'].includes(
              interview.status,
            );

            return (
              <Card key={interview.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        <AvatarImage src={candidate?.image || undefined} />
                        <AvatarFallback>
                          {initials(candidate?.name || 'Candidate')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {interview.title}
                        </CardTitle>
                        <p className="truncate text-sm text-muted-foreground">
                          {candidate?.name || 'Candidate'} ·{' '}
                          {interview.application?.job.title || 'Role'}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusStyle[interview.status]}>
                      {interview.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Questions</p>
                      <p className="mt-1 font-semibold">
                        {interview.questions.length}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Responses</p>
                      <p className="mt-1 font-semibold">
                        {interview.responses.length}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">AI score</p>
                      <p className="mt-1 font-semibold">
                        {score === null ? '—' : `${score}%`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Deadline{' '}
                      {interview.responseDeadline
                        ? new Date(interview.responseDeadline).toLocaleString()
                        : 'not set'}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {candidate?.email || 'No email'}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(interview)}
                    >
                      <Eye className="me-2 h-4 w-4" />
                      View
                    </Button>
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={cancellingId === interview.id}
                        onClick={() => void cancelInterview(interview)}
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

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.application?.candidate.user.name} ·{' '}
              {selected?.application?.job.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {selected?.description && (
              <p className="text-sm leading-6 text-muted-foreground">
                {selected.description}
              </p>
            )}
            <div>
              <p className="mb-2 text-sm font-medium">Questions</p>
              <div className="space-y-2">
                {selected?.questions.map((question, index) => {
                  const response = selected.responses.find(
                    (item) => item.questionIndex === index,
                  );
                  return (
                    <div key={index} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <p>
                          {index + 1}. {question.text}
                        </p>
                        <Badge variant="outline">{question.type}</Badge>
                      </div>
                      {response?.aiFeedback && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {response.aiFeedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
