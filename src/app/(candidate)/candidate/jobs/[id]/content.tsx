'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  Globe,
  Loader2,
  MapPin,
  Send,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type Question = {
  id: string;
  question: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
};

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string | string[] | null;
  responsibilities: string | string[] | null;
  benefits: string | string[] | null;
  skills: string | string[] | null;
  jobType: string;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceMin: number | null;
  experienceMax: number | null;
  openings: number;
  publishedAt: string | null;
  company: {
    id: string;
    name: string;
    industry: string | null;
    location: string | null;
    verified: boolean;
    description: string | null;
  };
};

function parseList(value: Job['skills']): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function salary(job: Job) {
  const format = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: job.salaryCurrency || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  if (job.salaryMin && job.salaryMax) return `${format(job.salaryMin)} – ${format(job.salaryMax)}`;
  if (job.salaryMin) return `From ${format(job.salaryMin)}`;
  if (job.salaryMax) return `Up to ${format(job.salaryMax)}`;
  return 'Salary not specified';
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.questionType === 'YES_NO' || question.questionType === 'MULTIPLE_CHOICE') {
    const options = question.questionType === 'YES_NO' ? ['Yes', 'No'] : question.options || [];
    return (
      <RadioGroup value={value} onValueChange={onChange} className="mt-2 space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
            <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (question.questionType === 'TEXT') {
    return <Textarea className="mt-2" value={value} onChange={(event) => onChange(event.target.value)} />;
  }

  return (
    <Input
      className="mt-2"
      type={question.questionType === 'DATE' ? 'date' : 'number'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Job not found');
        const payload = await response.json();
        const current = (payload.job || payload) as Job;
        if (!active) return;
        setJob(current);

        const [savedResponse, applicationResponse] = await Promise.all([
          fetch(`/api/candidate/saved-jobs?jobId=${current.id}`, { cache: 'no-store' }),
          fetch('/api/candidate/applications', { cache: 'no-store' }),
        ]);
        if (savedResponse.ok) setSaved(Boolean((await savedResponse.json()).saved));
        if (applicationResponse.ok) {
          const applications = (await applicationResponse.json()) as Array<{ jobId: string }>;
          setApplied(applications.some((application) => application.jobId === current.id));
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load job');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (params.id) void load();
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!dialogOpen || !job) return;
    void fetch(`/api/screening-questions?jobId=${job.id}`, { cache: 'no-store' })
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data) => setQuestions(Array.isArray(data) ? data : []));
  }, [dialogOpen, job]);

  const lists = useMemo(
    () => ({
      responsibilities: parseList(job?.responsibilities || null),
      requirements: parseList(job?.requirements || null),
      benefits: parseList(job?.benefits || null),
      skills: parseList(job?.skills || null),
    }),
    [job],
  );

  async function toggleSave() {
    if (!job) return;
    setBusy(true);
    try {
      const response = await apiFetch('/api/candidate/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, action: saved ? 'remove' : 'save' }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      setSaved(!saved);
      toast.success(saved ? 'Removed from saved jobs' : 'Job saved');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to update saved job');
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!job) return;
    const missing = questions.some((question) => question.isRequired && !answers[question.id]?.trim());
    if (missing) {
      toast.error('Please answer every required screening question');
      return;
    }

    setBusy(true);
    try {
      const response = await apiFetch('/api/applications/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, coverLetter }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response));
      const payload = await response.json();
      const applicationId = payload.application?.id as string | undefined;
      const screeningResponses = Object.entries(answers)
        .filter(([, answer]) => answer.trim())
        .map(([questionId, answer]) => ({ questionId, answer: answer.trim() }));

      if (applicationId && screeningResponses.length) {
        const screening = await apiFetch('/api/screening-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, responses: screeningResponses }),
        });
        if (!screening.ok) toast.warning(await getApiErrorMessage(screening, 'Application sent, but screening answers could not be saved'));
      }

      setApplied(true);
      setDialogOpen(false);
      toast.success('Application submitted');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to apply');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!job) return;
    try {
      if (navigator.share) await navigator.share({ title: job.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Job link copied');
      }
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') toast.error('Unable to share job');
    }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  if (error || !job) {
    return (
      <Card><CardContent className="py-16 text-center"><Briefcase className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">{error || 'Job not found'}</p><Button asChild className="mt-4"><Link href="/candidate/jobs">Browse jobs</Link></Button></CardContent></Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href="/candidate/jobs"><ArrowLeft className="me-2 h-4 w-4" />Back to jobs</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void toggleSave()} disabled={busy}>{saved ? <BookmarkCheck className="me-2 h-4 w-4" /> : <Bookmark className="me-2 h-4 w-4" />}{saved ? 'Saved' : 'Save'}</Button>
          <Button variant="outline" onClick={() => void share()}><Share2 className="me-2 h-4 w-4" />Share</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 className="h-7 w-7" /></div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground">{job.company.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary"><Briefcase className="me-1 h-3 w-3" />{job.jobType.replaceAll('_', ' ')}</Badge>
                <Badge variant="outline"><MapPin className="me-1 h-3 w-3" />{job.location || 'Flexible location'}</Badge>
                {job.isRemote && <Badge variant="outline"><Globe className="me-1 h-3 w-3" />Remote</Badge>}
                <Badge variant="outline"><DollarSign className="me-1 h-3 w-3" />{salary(job)}</Badge>
              </div>
            </div>
            {applied ? (
              <Button disabled><CheckCircle2 className="me-2 h-4 w-4" />Application sent</Button>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button><Send className="me-2 h-4 w-4" />Apply now</Button></DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader><DialogTitle>Apply for {job.title}</DialogTitle><DialogDescription>Your profile is attached automatically. A cover letter is optional.</DialogDescription></DialogHeader>
                  <div className="space-y-5 py-2">
                    <div><Label>Cover letter</Label><Textarea className="mt-2" rows={5} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} /></div>
                    {questions.map((question, index) => (
                      <div key={question.id}><Label>{index + 1}. {question.question}{question.isRequired && <span className="text-destructive"> *</span>}</Label><QuestionInput question={question} value={answers[question.id] || ''} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} /></div>
                    ))}
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => void apply()} disabled={busy}>{busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}Submit application</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>About the role</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7 text-muted-foreground">{job.description}</p></CardContent></Card>
          {(['responsibilities', 'requirements', 'benefits'] as const).map((key) => lists[key].length > 0 && (
            <Card key={key}><CardHeader><CardTitle className="capitalize">{key}</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-2 ps-5 text-muted-foreground">{lists[key].map((item) => <li key={item}>{item}</li>)}</ul></CardContent></Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Role details</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>{job.openings} opening{job.openings === 1 ? '' : 's'}</p><p>{job.experienceMin ?? 0}{job.experienceMax ? `–${job.experienceMax}` : '+'} years experience</p>{job.publishedAt && <p>Published {new Date(job.publishedAt).toLocaleDateString()}</p>}</CardContent></Card>
          {lists.skills.length > 0 && <Card><CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{lists.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</CardContent></Card>}
          <Card><CardHeader><CardTitle className="text-base">About {job.company.name}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{job.company.description || `${job.company.name} has not added a company description yet.`}</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
