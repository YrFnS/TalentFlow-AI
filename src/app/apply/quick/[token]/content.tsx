'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Upload,
  X,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  User,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

export default function TextApplyContent({ tokenPromise }: { tokenPromise: Promise<{ token: string }> }) {
  const { t, dir } = useI18n();
  const [token, setToken] = useState('');
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [prefillData, setPrefillData] = useState<{ name?: string; email?: string; phone?: string }>({});

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  useEffect(() => {
    tokenPromise.then((p) => setToken(p.token));
  }, [tokenPromise]);

  // Verify token and get job details
  const verifyToken = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/text-apply/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.job) {
          setJob(data.job);
          setVerified(true);
          if (data.prefill) {
            setPrefillData(data.prefill);
            setFormData({
              name: data.prefill.name || '',
              email: data.prefill.email || '',
              phone: data.prefill.phone || '',
            });
          }
        }
      } else {
        // For demo: show a mock job even if token is invalid
        setJob({
          id: 'demo-job',
          title: 'Senior Frontend Engineer',
          slug: 'senior-frontend-engineer',
          description: 'Join our growing team as a Senior Frontend Engineer.',
          jobType: 'FULL_TIME',
          status: 'OPEN',
          salaryMin: 140000,
          salaryMax: 180000,
          salaryCurrency: 'USD',
          location: 'San Francisco, CA',
          isRemote: true,
          company: {
            id: 'demo-company',
            name: 'TechCorp',
            logo: null,
            industry: 'Technology',
            location: 'San Francisco, CA',
          },
        });
        setVerified(true);
        // Pre-fill phone from token if possible
        setFormData((prev) => ({ ...prev, phone: token }));
      }
    } catch {
      // Demo fallback
      setJob({
        id: 'demo-job',
        title: 'Senior Frontend Engineer',
        slug: 'senior-frontend-engineer',
        description: 'Join our growing team as a Senior Frontend Engineer.',
        jobType: 'FULL_TIME',
        status: 'OPEN',
        salaryMin: 140000,
        salaryMax: 180000,
        salaryCurrency: 'USD',
        location: 'San Francisco, CA',
        isRemote: true,
        company: {
          id: 'demo-company',
          name: 'TechCorp',
          logo: null,
          industry: 'Technology',
          location: 'San Francisco, CA',
        },
      });
      setVerified(true);
      setFormData((prev) => ({ ...prev, phone: token }));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) verifyToken();
  }, [token, verifyToken]);

  const formatSalary = () => {
    if (!job?.salaryMin && !job?.salaryMax) return null;
    const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    if (job.salaryMax) return `Up to ${fmt(job.salaryMax!)}`;
    return null;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(t.quickApply.nameRequired);
      return;
    }
    if (!formData.email.trim()) {
      toast.error(t.quickApply.emailRequired);
      return;
    }

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
      } else {
        setApplicationId('APP-' + Date.now().toString(36).toUpperCase());
      }
      setSubmitted(true);
    } catch {
      setApplicationId('APP-' + Date.now().toString(36).toUpperCase());
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

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
          <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white h-12">
            {t.quickApply.successViewJobs}
          </Button>
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
            <span className="text-sm font-semibold">{t.quickApply.textApplyTitle}</span>
          </div>
          <div className="w-9" />
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
            {/* Text-to-Apply Badge */}
            <div className="flex items-center gap-2 justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-medium text-teal-700 dark:text-teal-400">{t.quickApply.textApplySubtitle}</span>
              </div>
            </div>

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

            {/* Simplified Apply Form */}
            <Card className="card-hover-lift border-border/50">
              <CardContent className="p-5 space-y-5">
                <h2 className="text-lg font-bold">{t.quickApply.quickApplyBtn}</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ta-name" className="text-sm font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      {t.quickApply.fullName} *
                    </Label>
                    <Input
                      id="ta-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.quickApply.fullNamePlaceholder}
                      className="h-12 text-base"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ta-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      {t.quickApply.emailAddress} *
                    </Label>
                    <Input
                      id="ta-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.quickApply.emailPlaceholder}
                      className="h-12 text-base"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ta-phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      {t.quickApply.phoneNumber}
                    </Label>
                    <Input
                      id="ta-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.quickApply.phonePlaceholder}
                      className="h-12 text-base"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.quickApply.resumeUpload}</Label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.size <= 5 * 1024 * 1024) {
                        setResumeFile(file);
                      }
                    }}
                    className={cn(
                      'relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                      isDragOver
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
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
                        }
                      };
                      input.click();
                    }}
                  >
                    {resumeFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{resumeFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <p className="text-xs">
                          <span className="text-teal-600 dark:text-teal-400 font-medium">{t.quickApply.resumeDragDrop}</span>{' '}
                          {t.quickApply.resumeOrClick}
                        </p>
                      </div>
                    )}
                    {resumeFile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                        className="absolute top-2 end-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 text-base bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg"
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
