'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { cn, getInitials } from '@/lib/utils';
import { useI18n } from '@/store/i18n-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JobData {
  id: string;
  title: string;
  slug: string;
  description: string;
  jobType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  location: string | null;
  isRemote: boolean;
  company: {
    id: string;
    name: string;
    logo: string | null;
    industry: string | null;
    location: string | null;
  };
}

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export default function TextApplyContent({
  tokenPromise,
}: {
  tokenPromise: Promise<{ token: string }>;
}) {
  const { t, dir } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState('');
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  useEffect(() => {
    let active = true;
    void tokenPromise.then((params) => {
      if (active) setToken(params.token);
    });
    return () => {
      active = false;
    };
  }, [tokenPromise]);

  const verifyToken = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setJob(null);

    try {
      const response = await apiFetch('/api/text-apply/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.verified || !data.job) {
        throw new Error(
          data.error ||
            data.message ||
            'This application link is invalid or has expired.',
        );
      }

      setJob(data.job as JobData);
      setFormData({
        name: data.prefill?.name || '',
        email: data.prefill?.email || '',
        phone: data.prefill?.phone || '',
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'This application link is invalid or has expired.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void verifyToken();
  }, [token, verifyToken]);

  function selectResume(file: File | null) {
    if (!file) return;
    if (file.size > MAX_RESUME_SIZE) {
      toast.error('Resume files must be 5 MB or smaller');
      return;
    }
    if (
      file.type &&
      !ALLOWED_RESUME_TYPES.has(file.type) &&
      !/\.(pdf|doc|docx)$/i.test(file.name)
    ) {
      toast.error('Upload a PDF, DOC, or DOCX resume');
      return;
    }
    setResumeFile(file);
  }

  function formatSalary(): string | null {
    if (!job || (!job.salaryMin && !job.salaryMax)) return null;
    const currency = job.salaryCurrency || 'USD';
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    if (job.salaryMin && job.salaryMax) {
      return `${formatter.format(job.salaryMin)} – ${formatter.format(job.salaryMax)}`;
    }
    if (job.salaryMin) return `From ${formatter.format(job.salaryMin)}`;
    return job.salaryMax ? `Up to ${formatter.format(job.salaryMax)}` : null;
  }

  async function handleSubmit() {
    if (!job) return;
    if (!formData.name.trim()) {
      toast.error(t.quickApply.nameRequired);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast.error(t.quickApply.emailRequired);
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('phone', formData.phone.trim());
      payload.append('jobId', job.id);
      payload.append('textApplyToken', token);
      if (resumeFile) payload.append('resume', resumeFile);

      const response = await apiFetch(`/api/jobs/${job.id}/quick-apply`, {
        method: 'POST',
        body: payload,
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to submit application'),
        );
      }

      const data = await response.json();
      if (!data.applicationId) {
        throw new Error('The application was created without a reference number');
      }
      setApplicationId(data.applicationId);
      setSubmitted(true);
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : 'Unable to submit application',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background p-6"
        dir={dir}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold">
              {t.quickApply.successTitle}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t.quickApply.successMessage}
            </p>
            <div className="mt-5 rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                {t.quickApply.successAppId}
              </p>
              <p className="mt-1 break-all font-mono text-lg font-bold text-primary">
                {applicationId}
              </p>
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href="/">{t.quickApply.successViewJobs}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={dir}>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold">
              {t.quickApply.textApplyTitle}
            </span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : error || !job ? (
          <Card className="border-destructive/40">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">
                Application link unavailable
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error || 'This application link is invalid or has expired.'}
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={() => void verifyToken()}>
                  Try again
                </Button>
                <Button asChild>
                  <Link href="/">Browse jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Badge variant="secondary" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {t.quickApply.textApplySubtitle}
              </Badge>
            </div>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarImage src={job.company.logo || undefined} />
                    <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                      {getInitials(job.company.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold">{job.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {job.company.name}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Briefcase className="me-1 h-3 w-3" />
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </Badge>
                      {job.location && (
                        <Badge variant="outline">
                          <MapPin className="me-1 h-3 w-3" />
                          {job.location}
                        </Badge>
                      )}
                      {job.isRemote && <Badge variant="outline">Remote</Badge>}
                    </div>
                    {formatSalary() && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5 p-5">
                <h2 className="text-lg font-bold">
                  {t.quickApply.quickApplyBtn}
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="quick-name" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {t.quickApply.fullName} *
                  </Label>
                  <Input
                    id="quick-name"
                    autoComplete="name"
                    maxLength={100}
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {t.quickApply.emailAddress} *
                  </Label>
                  <Input
                    id="quick-email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-phone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {t.quickApply.phoneNumber}
                  </Label>
                  <Input
                    id="quick-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.quickApply.resumeUpload}</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={(event) =>
                      selectResume(event.target.files?.[0] || null)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDragOver(false);
                      selectResume(event.dataTransfer.files[0] || null);
                    }}
                    className={cn(
                      'relative flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                      isDragOver
                        ? 'border-primary bg-primary/5'
                        : resumeFile
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-border hover:bg-muted/40',
                    )}
                  >
                    {resumeFile ? (
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        {resumeFile.name}
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        PDF, DOC, or DOCX · maximum 5 MB
                      </span>
                    )}
                  </button>
                  {resumeFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        setResumeFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="me-1.5 h-3.5 w-3.5" />
                      Remove file
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              className="h-12 w-full text-base"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" />
              )}
              {submitting
                ? t.quickApply.submitting
                : t.quickApply.quickApplyBtn}
            </Button>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t py-4">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t.careerPage.poweredBy}
        </div>
      </footer>
    </div>
  );
}
