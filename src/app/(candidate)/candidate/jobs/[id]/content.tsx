// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Share2,
  Users,
  Star,
  Globe,
  ChevronRight,
  Send,
  X,
  Loader2,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ScreeningQuestionData {
  id: string;
  question: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
  isKnockout: boolean;
  knockoutAnswer: string | null;
  order: number;
}

interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  jobType: string;
  location: string;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceMin: number | null;
  experienceMax: number | null;
  skills: string[];
  openings: number;
  publishedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    industry: string | null;
    location: string | null;
    verified: boolean;
    description: string | null;
  };
}

function getJobTypeBadge(type: string) {
  const map: Record<string, { label: string; className: string }> = {
    FULL_TIME: { label: 'Full-time', className: 'bg-slate-50 text-blue-700' },
    PART_TIME: { label: 'Part-time', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40' },
    CONTRACT: { label: 'Contract', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40' },
    INTERNSHIP: { label: 'Internship', className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
    REMOTE: { label: 'Remote', className: 'bg-emerald-50 text-emerald-700' },
    HYBRID: { label: 'Hybrid', className: 'bg-cyan-50 text-cyan-700' },
  };
  return map[type] || { label: type, className: 'bg-muted text-muted-foreground' };
}

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min || !max) return 'Salary not specified';
  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export default function JobDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const [isSaved, setIsSaved] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [job, setJob] = useState<JobData | null>(null);
  const [similarJobs, setSimilarJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Screening questions state
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestionData[]>([]);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [applyStep, setApplyStep] = useState<'cover' | 'screening'>('cover');

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setJob({
            id: data.id,
            title: data.title,
            description: data.description || '',
            requirements: data.requirements ? JSON.parse(data.requirements) : [],
            responsibilities: data.responsibilities ? JSON.parse(data.responsibilities) : [],
            benefits: data.benefits ? JSON.parse(data.benefits) : [],
            jobType: data.jobType || 'FULL_TIME',
            location: data.location || '',
            isRemote: data.isRemote || false,
            salaryMin: data.salaryMin,
            salaryMax: data.salaryMax,
            salaryCurrency: data.salaryCurrency || 'USD',
            experienceMin: data.experienceMin,
            experienceMax: data.experienceMax,
            skills: data.skills ? JSON.parse(data.skills) : [],
            openings: data.openings || 1,
            publishedAt: data.publishedAt,
            createdAt: data.createdAt,
            company: {
              id: data.company?.id || '',
              name: data.company?.name || '',
              logo: data.company?.logo || null,
              industry: data.company?.industry || null,
              location: data.company?.location || null,
              verified: data.company?.verified || false,
              description: data.company?.description || null,
            },
          });

          // Fetch similar jobs
          const similarRes = await fetch('/api/jobs?status=OPEN');
          if (similarRes.ok) {
            const allJobs = await similarRes.json();
            setSimilarJobs(
              allJobs
                .filter((j: any) => j.id !== data.id)
                .slice(0, 3)
                .map((j: any) => ({
                  id: j.id,
                  title: j.title,
                  company: j.company?.name || '',
                  location: j.location || '',
                  salaryMin: j.salaryMin,
                  salaryMax: j.salaryMax,
                  jobType: j.jobType,
                  skills: j.skills ? JSON.parse(j.skills) : [],
                  publishedAt: j.publishedAt || j.createdAt,
                }))
            );
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchJob();
  }, [params.id]);

  // Fetch screening questions when apply dialog opens
  useEffect(() => {
    if (applyDialogOpen && job) {
      setScreeningLoading(true);
      fetch(`/api/screening-questions?jobId=${job.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setScreeningQuestions(data);
          }
        })
        .catch(() => {
          setScreeningQuestions([]);
        })
        .finally(() => {
          setScreeningLoading(false);
        });
    } else {
      setScreeningQuestions([]);
      setScreeningAnswers({});
      setApplyStep('cover');
    }
  }, [applyDialogOpen, job]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Job not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">This job may have been removed or is no longer available.</p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/candidate/jobs">{t.candidate.searchJobs}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jobTypeBadge = getJobTypeBadge(job.jobType);

  const canSubmitScreening = () => {
    const requiredQuestions = screeningQuestions.filter((q) => q.isRequired);
    return requiredQuestions.every((q) => screeningAnswers[q.id]?.trim());
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          coverLetter,
        }),
      });
      if (res.ok) {
        const appData = await res.json();
        // Submit screening responses if there are questions
        if (screeningQuestions.length > 0 && Object.keys(screeningAnswers).length > 0) {
          const responses = Object.entries(screeningAnswers)
            .filter(([, answer]) => answer.trim())
            .map(([questionId, answer]) => ({
              questionId,
              answer,
            }));
          if (responses.length > 0) {
            await fetch('/api/screening-responses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicationId: appData.id,
                responses,
              }),
            });
          }
        }
        setHasApplied(true);
        setApplyDialogOpen(false);
        toast.success('Application submitted successfully!');
      } else {
        toast.error('Failed to submit application');
      }
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const renderScreeningInput = (q: ScreeningQuestionData) => {
    const answer = screeningAnswers[q.id] || '';

    switch (q.questionType) {
      case 'YES_NO':
        return (
          <RadioGroup
            value={answer}
            onValueChange={(v) => setScreeningAnswers((prev) => ({ ...prev, [q.id]: v }))}
            className="flex items-center gap-6 mt-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="Yes" id={`${q.id}-yes`} />
              <Label htmlFor={`${q.id}-yes`} className="text-sm cursor-pointer">{t.screening.yes}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="No" id={`${q.id}-no`} />
              <Label htmlFor={`${q.id}-no`} className="text-sm cursor-pointer">{t.screening.no}</Label>
            </div>
          </RadioGroup>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={answer}
            onValueChange={(v) => setScreeningAnswers((prev) => ({ ...prev, [q.id]: v }))}
            className="space-y-2 mt-2"
          >
            {q.options?.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${q.id}-opt-${i}`} />
                <Label htmlFor={`${q.id}-opt-${i}`} className="text-sm cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'TEXT':
        return (
          <Textarea
            value={answer}
            onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={t.screening.enterAnswer}
            rows={3}
            className="mt-2 resize-y"
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={answer}
            onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={t.screening.enterNumber}
            className="mt-2"
          />
        );

      case 'DATE':
        return (
          <Input
            type="date"
            value={answer}
            onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            className="mt-2"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button and actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsSaved(!isSaved)}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-blue-600" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {isSaved ? t.candidate.saved : t.jobs.saveJob}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-4 w-4" />
            {t.jobs.shareJob}
          </Button>
        </div>
      </div>

      {/* Job Header Card */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
                <p className="text-muted-foreground mt-0.5">{job.company.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('border-0', jobTypeBadge.className)}>
                  <Briefcase className="w-3 h-3 me-1" />
                  {jobTypeBadge.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </Badge>
                {job.isRemote && (
                  <Badge className="border-0 bg-emerald-50 text-emerald-700">
                    <Globe className="w-3 h-3 me-1" />
                    Remote
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </Badge>
                {job.experienceMin && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {job.experienceMin}{job.experienceMax ? `-${job.experienceMax}` : '+'} yrs exp
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {job.publishedAt && <span>{t.jobs.postedOn} {new Date(job.publishedAt).toLocaleDateString()}</span>}
                {job.publishedAt && <span>·</span>}
                {job.publishedAt && <span>{daysAgo(job.publishedAt)}</span>}
                <span>·</span>
                <span>{job.openings} {t.jobs.openings}</span>
              </div>
            </div>
            <div className="shrink-0 sm:ms-auto">
              {hasApplied ? (
                <Button disabled className="bg-emerald-600 text-white gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.jobs.applicationSent}
                </Button>
              ) : (
                <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2">
                      <Send className="h-4 w-4" />
                      {t.jobs.applyNow}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[580px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>
                        {applyStep === 'cover' ? t.jobs.applyNow : t.screening.screeningStep}
                      </DialogTitle>
                      <DialogDescription>
                        {applyStep === 'cover'
                          ? `${t.jobs.jobTitle}: ${job.title} — ${job.company.name}`
                          : t.screening.screeningStepDesc}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Step indicator */}
                    {screeningQuestions.length > 0 && (
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          'flex items-center gap-1.5 text-xs font-medium',
                          applyStep === 'cover' ? 'text-blue-600' : 'text-blue-600'
                        )}>
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                            applyStep === 'cover' ? 'bg-blue-600 text-white' : 'bg-teal-100 text-blue-600'
                          )}>
                            {applyStep === 'screening' ? <CheckCircle2 className="w-3 h-3" /> : '1'}
                          </div>
                          {t.applications.coverLetter}
                        </div>
                        <div className={cn(
                          'flex-1 h-px',
                          applyStep === 'screening' ? 'bg-teal-300' : 'bg-border'
                        )} />
                        <div className={cn(
                          'flex items-center gap-1.5 text-xs font-medium',
                          applyStep === 'screening' ? 'text-blue-600' : 'text-muted-foreground'
                        )}>
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                            applyStep === 'screening' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                          )}>
                            2
                          </div>
                          {t.screening.screeningStep}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-4">
                      {applyStep === 'cover' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t.applications.coverLetter}</Label>
                          <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={6}
                            className="resize-y"
                            placeholder={t.jobs.coverLetterPlaceholder}
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional but recommended. Tell the employer why you are a great fit.
                          </p>
                        </div>
                      )}

                      {applyStep === 'screening' && (
                        <div className="space-y-5">
                          {screeningLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                          ) : screeningQuestions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              {t.screening.noQuestions}
                            </div>
                          ) : (
                            screeningQuestions.map((q, i) => (
                              <div key={q.id} className="space-y-1.5">
                                <Label className="text-sm font-medium">
                                  <span className="text-muted-foreground me-1">{i + 1}.</span>
                                  {q.question}
                                  {q.isRequired && <span className="text-red-500 ms-1">*</span>}
                                </Label>
                                {renderScreeningInput(q)}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t">
                      {applyStep === 'screening' && (
                        <Button
                          variant="outline"
                          onClick={() => setApplyStep('cover')}
                        >
                          {t.common.back}
                        </Button>
                      )}
                      {applyStep === 'cover' && (
                        <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                          {t.common.cancel}
                        </Button>
                      )}
                      {applyStep === 'cover' && screeningQuestions.length > 0 ? (
                        <Button
                          onClick={() => setApplyStep('screening')}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          {t.common.next}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : applyStep === 'cover' && screeningQuestions.length === 0 ? (
                        <Button
                          onClick={handleApply}
                          disabled={isApplying}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          {isApplying ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              {t.common.loading}
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {t.jobs.applyNow}
                            </>
                          )}
                        </Button>
                      ) : null}
                      {applyStep === 'screening' && (
                        <Button
                          onClick={handleApply}
                          disabled={isApplying || !canSubmitScreening()}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          {isApplying ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              {t.screening.answering}
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {t.screening.submitResponses}
                            </>
                          )}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {job.description && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.jobDescription}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {job.description.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {job.requirements.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.requirements}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.responsibilities.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.responsibilities}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <ChevronRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.benefits.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.benefits}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {job.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {job.description.length === 0 && job.requirements.length === 0 && job.responsibilities.length === 0 && job.benefits.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No details available</h3>
                <p className="mt-1 text-sm text-muted-foreground">The employer hasn&apos;t added detailed information yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {job.company.name && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.aboutCompany}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{job.company.name}</p>
                      {job.company.verified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                    {job.company.industry && <p className="text-xs text-muted-foreground">{job.company.industry}</p>}
                  </div>
                </div>
                {(job.company.location || job.company.description) && <Separator />}
                <div className="space-y-3">
                  {job.company.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{job.company.location}</span>
                    </div>
                  )}
                  {job.company.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{job.company.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {job.skills.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.skills}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-slate-50 text-blue-700 border-0"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(job.salaryMin || job.experienceMin) && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.jobs.salaryRange}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.salaryMin && (
                  <div className="text-2xl font-bold text-blue-700">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {job.experienceMin && (
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">{job.experienceMin}{job.experienceMax ? `-${job.experienceMax}` : '+'} years</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">{t.jobs.openings}</p>
                    <p className="font-medium">{job.openings} positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t.jobs.similarJobs}</CardTitle>
            <CardDescription>Jobs you might also be interested in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarJobs.map((simJob) => {
                const simTypeBadge = getJobTypeBadge(simJob.jobType);
                return (
                  <Link
                    key={simJob.id}
                    href={`/candidate/jobs/${simJob.id}`}
                    className="group block"
                  >
                    <div className="rounded-xl border border-border/60 p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">{simJob.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{simJob.company}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px] h-5 gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {simJob.location}
                          </Badge>
                          <Badge className={cn('text-[10px] h-5 border-0', simTypeBadge.className)}>{simTypeBadge.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-700">
                            {formatSalary(simJob.salaryMin, simJob.salaryMax, 'USD')}/yr
                          </span>
                          <span className="text-[10px] text-muted-foreground">{daysAgo(simJob.publishedAt)}</span>
                        </div>
                        {simJob.skills && simJob.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {simJob.skills.slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-[10px] h-5 bg-muted/50">{skill}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
