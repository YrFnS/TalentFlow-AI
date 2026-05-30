'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Upload,
  X,
  CheckCircle2,
  Linkedin,
  Clock,
  ArrowLeft,
  FileText,
  User,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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

// Mock job for demo
const MOCK_JOB: JobData = {
  id: 'mock-job-1',
  title: 'Senior Frontend Engineer',
  slug: 'senior-frontend-engineer',
  description: 'We are looking for a Senior Frontend Engineer to join our growing team. You will be responsible for building and maintaining our web applications using modern frameworks and best practices. Work with cutting-edge technology and collaborate with a talented team of engineers, designers, and product managers.',
  jobType: 'FULL_TIME',
  status: 'OPEN',
  salaryMin: 140000,
  salaryMax: 180000,
  salaryCurrency: 'USD',
  location: 'San Francisco, CA',
  isRemote: true,
  company: {
    id: 'mock-company-1',
    name: 'TechCorp',
    logo: null,
    industry: 'Technology',
    location: 'San Francisco, CA',
  },
};

type ApplyStep = 'info' | 'resume' | 'submit';

const DRAFT_KEY = 'quick-apply-draft';

export default function QuickApplyContent({ slugPromise }: { slugPromise: Promise<{ jobSlug: string }> }) {
  const { t, dir } = useI18n();
  const [slug, setSlug] = useState('');
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<ApplyStep>('info');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  // Load slug from promise
  useEffect(() => {
    slugPromise.then((p) => setSlug(p.jobSlug));
  }, [slugPromise]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (slug && (formData.name || formData.email || formData.phone)) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ slug, ...formData }));
        } catch {}
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slug, formData]);

  // Load draft from localStorage
  useEffect(() => {
    if (slug) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.slug === slug) {
            setFormData({
              name: parsed.name || '',
              email: parsed.email || '',
              phone: parsed.phone || '',
            });
          }
        }
      } catch {}
    }
  }, [slug]);

  // Fetch job data
  const fetchJob = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // First try to find by slug from API
      const res = await fetch(`/api/public/jobs?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setJob(data[0]);
        } else if (data.id) {
          setJob(data);
        } else {
          // Use mock job for demo
          setJob(MOCK_JOB);
        }
      } else {
        // Use mock job for demo
        setJob(MOCK_JOB);
      }
    } catch {
      // Use mock job for demo
      setJob(MOCK_JOB);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchJob();
  }, [slug, fetchJob]);

  const formatSalary = () => {
    if (!job?.salaryMin && !job?.salaryMax) return null;
    const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    if (job.salaryMax) return `Up to ${fmt(job.salaryMax!)}`;
    return null;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNext = () => {
    if (step === 'info') {
      if (!formData.name.trim()) {
        toast.error(t.quickApply.nameRequired);
        return;
      }
      if (!formData.email.trim()) {
        toast.error(t.quickApply.emailRequired);
        return;
      }
      if (!validateEmail(formData.email)) {
        toast.error(t.quickApply.invalidEmail);
        return;
      }
      setStep('resume');
    } else if (step === 'resume') {
      setStep('submit');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('email', formData.email);
      formPayload.append('phone', formData.phone);
      formPayload.append('jobId', job?.id || '');
      if (resumeFile) {
        formPayload.append('resume', resumeFile);
      }

      const res = await fetch(`/api/jobs/${job?.id}/quick-apply`, {
        method: 'POST',
        body: formPayload,
      });

      if (res.ok) {
        const data = await res.json();
        setApplicationId(data.applicationId || data.id || 'APP-' + Date.now().toString(36).toUpperCase());
        setSubmitted(true);
        // Clear draft
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
      } else {
        // Fallback: simulate success for demo
        setApplicationId('APP-' + Date.now().toString(36).toUpperCase());
        setSubmitted(true);
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
      }
    } catch {
      // Fallback: simulate success for demo
      setApplicationId('APP-' + Date.now().toString(36).toUpperCase());
      setSubmitted(true);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkedInApply = async () => {
    setSubmitting(true);
    // Simulated LinkedIn apply
    await new Promise((r) => setTimeout(r, 2000));
    setApplicationId('APP-LI-' + Date.now().toString(36).toUpperCase());
    setSubmitted(true);
    setSubmitting(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const steps: { key: ApplyStep; label: string; num: number }[] = [
    { key: 'info', label: t.quickApply.stepInfo, num: 1 },
    { key: 'resume', label: t.quickApply.stepResume, num: 2 },
    { key: 'submit', label: t.quickApply.stepSubmit, num: 3 },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  // Not found
  if (!loading && notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6" dir={dir}>
        <Briefcase className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">{t.quickApply.jobNotFound}</h1>
        <p className="text-muted-foreground mb-6 text-center">{t.quickApply.jobNotFoundDesc}</p>
        <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
          {t.common.backToHome}
        </Button>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6" dir={dir}>
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.quickApply.successTitle}</h1>
          <p className="text-muted-foreground mb-4">{t.quickApply.successMessage}</p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1">{t.quickApply.successAppId}</p>
            <p className="text-lg font-mono font-bold text-teal-600 dark:text-teal-400">{applicationId}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white h-12">
              {t.quickApply.successViewJobs}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-lg mx-auto flex items-center h-14 px-4">
          <button onClick={() => window.history.back()} className="p-2 -ms-2 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold">{t.quickApply.title}</span>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        ) : job ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Job Header Card */}
            <Card className="card-hover-lift border-border/50 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                    {job.company.logo ? (
                      <img src={job.company.logo} alt={job.company.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      getInitials(job.company.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold leading-tight">{job.title}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{job.company.name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {job.jobType && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                      <Briefcase className="w-3 h-3 me-1" />
                      {jobTypeLabels[job.jobType] || job.jobType}
                    </Badge>
                  )}
                  {job.location && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <MapPin className="w-3 h-3 me-1" />
                      {job.location}
                    </Badge>
                  )}
                  {job.isRemote && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      Remote
                    </Badge>
                  )}
                </div>

                {formatSalary() && (
                  <div className="flex items-center gap-1.5 mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    {formatSalary()}
                    <span className="text-xs text-muted-foreground font-normal">/year</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-0">
              {steps.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                      i <= stepIndex
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {i < stepIndex ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        s.num
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-medium transition-colors hidden sm:block',
                      i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300',
                      i < stepIndex ? 'bg-teal-500' : 'bg-muted'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <Card className="card-hover-lift border-border/50">
              <CardContent className="p-5">
                {/* Step 1: Info */}
                {step === 'info' && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-lg font-bold">{t.quickApply.stepInfo}</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="qa-name" className="text-sm font-medium flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          {t.quickApply.fullName} *
                        </Label>
                        <Input
                          id="qa-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t.quickApply.fullNamePlaceholder}
                          className="h-12 text-base"
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qa-email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          {t.quickApply.emailAddress} *
                        </Label>
                        <Input
                          id="qa-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={t.quickApply.emailPlaceholder}
                          className="h-12 text-base"
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qa-phone" className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          {t.quickApply.phoneNumber}
                        </Label>
                        <Input
                          id="qa-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={t.quickApply.phonePlaceholder}
                          className="h-12 text-base"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Resume */}
                {step === 'resume' && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-lg font-bold">{t.quickApply.stepResume}</h2>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          setResumeFile(file);
                        } else if (file) {
                          toast.error('File too large. Max 5MB.');
                        }
                      }}
                      className={cn(
                        'relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                        isDragOver
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 scale-[1.02]'
                          : resumeFile
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-muted-foreground/25 hover:border-teal-400 hover:bg-muted/30'
                      )}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            setResumeFile(file);
                          } else if (file) {
                            toast.error('File too large. Max 5MB.');
                          }
                        };
                        input.click();
                      }}
                    >
                      {resumeFile ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                          <p className="text-xs text-teal-600 dark:text-teal-400">{t.quickApply.resumeUploaded}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="text-teal-600 dark:text-teal-400 font-medium">{t.quickApply.resumeDragDrop}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{t.quickApply.resumeOrClick}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{t.quickApply.resumeFormats}</p>
                        </div>
                      )}
                      {resumeFile && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                          className="absolute top-3 end-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{t.quickApply.resumeFormats}</p>
                  </div>
                )}

                {/* Step 3: Submit */}
                {step === 'submit' && (
                  <div className="space-y-5 animate-fade-in">
                    <h2 className="text-lg font-bold">{t.quickApply.stepSubmit}</h2>
                    {/* Review Info */}
                    <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t.quickApply.fullName}</p>
                          <p className="text-sm font-medium">{formData.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t.quickApply.emailAddress}</p>
                          <p className="text-sm font-medium">{formData.email}</p>
                        </div>
                      </div>
                      {formData.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{t.quickApply.phoneNumber}</p>
                            <p className="text-sm font-medium">{formData.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t.quickApply.resumeUpload}</p>
                          <p className="text-sm font-medium">{resumeFile ? resumeFile.name : '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                      {t.quickApply.autoSaveDraft}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {step === 'info' && (
                <>
                  <Button
                    onClick={handleNext}
                    className="w-full h-12 text-base bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg"
                  >
                    {t.common.next}
                    <ChevronRight className="w-4 h-4 ms-1" />
                  </Button>
                  <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                      {t.auth.orContinueWith || 'or'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLinkedInApply}
                    disabled={submitting}
                    className="w-full h-12 text-base border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
                  >
                    <Linkedin className="w-5 h-5 me-2" />
                    {t.quickApply.oneClickApply}
                  </Button>
                </>
              )}

              {step === 'resume' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    className="flex-1 h-12"
                  >
                    {t.common.back}
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-[2] h-12 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg"
                  >
                    {t.common.next}
                    <ChevronRight className="w-4 h-4 ms-1" />
                  </Button>
                </div>
              )}

              {step === 'submit' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('resume')}
                    className="flex-1 h-12"
                  >
                    {t.common.back}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-[2] h-12 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t.quickApply.submitting}
                      </span>
                    ) : (
                      t.quickApply.quickApplyBtn
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-4 mt-auto">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            {t.careerPage.poweredBy}
          </div>
        </div>
      </footer>
    </div>
  );
}
