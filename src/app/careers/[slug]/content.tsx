'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUp,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  Globe2,
  Loader2,
  LogIn,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface JobItem {
  id: string;
  title: string;
  department: string;
  location: string | null;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  isRemote: boolean;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  tagline: string;
  values: string[];
  benefits: string[];
  cultureText: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    github: string;
  };
}

type CompanyPayload = {
  id?: string;
  name?: string;
  slug?: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  config?: Record<string, unknown> | null;
};

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeCompany(payload: CompanyPayload, fallbackSlug: string): CompanyInfo {
  const config = payload.config && typeof payload.config === 'object'
    ? payload.config
    : {};
  const social = config.socialLinks && typeof config.socialLinks === 'object'
    ? (config.socialLinks as Record<string, unknown>)
    : {};

  return {
    id: payload.id || '',
    name: payload.name || fallbackSlug,
    slug: payload.slug || fallbackSlug,
    logo: payload.logo || stringValue(config.logo) || null,
    description: payload.description || null,
    website: payload.website || null,
    industry: payload.industry || null,
    location: payload.location || null,
    tagline:
      stringValue(config.tagline) ||
      payload.description ||
      'Build your next chapter with our team.',
    values: stringArray(config.values),
    benefits: stringArray(config.benefits),
    cultureText: stringValue(config.cultureText),
    socialLinks: {
      linkedin: stringValue(social.linkedin),
      twitter: stringValue(social.twitter),
      github: stringValue(social.github),
    },
  };
}

function formatSalary(job: JobItem): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null;

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: job.salaryCurrency || 'USD',
    maximumFractionDigits: 0,
  });

  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${formatter.format(job.salaryMin)} – ${formatter.format(job.salaryMax)}`;
  }
  if (job.salaryMin !== null) return `From ${formatter.format(job.salaryMin)}`;
  return `Up to ${formatter.format(job.salaryMax || 0)}`;
}

function formatPostedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(days) < 30) return formatter.format(days, 'day');
  return date.toLocaleDateString();
}

export default function CareerPageContent({
  slugPromise,
}: {
  slugPromise: Promise<{ slug: string }>;
}) {
  const { dir } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = dir === 'rtl';
  const copy = useMemo(
    () =>
      isArabic
        ? {
            openRoles: 'الوظائف المتاحة',
            joinTeam: 'انضم إلى فريقنا',
            search: 'ابحث عن وظيفة',
            allLocations: 'كل المواقع',
            allTypes: 'كل أنواع الوظائف',
            noJobs: 'لا توجد وظائف مطابقة حالياً.',
            viewDetails: 'عرض التفاصيل',
            requirements: 'المتطلبات',
            benefits: 'المزايا',
            apply: 'التقديم على الوظيفة',
            applyTitle: 'أكمل التقديم من حساب المرشح',
            applyBody:
              'يتم إرسال طلبات التوظيف من خلال حساب مرشح حتى تتمكن من متابعة الحالة واستلام تحديثات المقابلات بأمان.',
            signIn: 'تسجيل الدخول والتقديم',
            createAccount: 'إنشاء حساب مرشح',
            profileNote:
              'سيتم إرفاق ملفك الشخصي وسيرتك الذاتية فقط بعد تسجيل الدخول. هذه الصفحة العامة لا ترسل طلباً وهمياً.',
            loading: 'جارٍ تحميل صفحة الوظائف…',
            loadError: 'تعذر تحميل صفحة الوظائف. حاول مرة أخرى.',
            notFound: 'صفحة الوظائف غير موجودة أو غير منشورة.',
            shareCopied: 'تم نسخ رابط الوظيفة.',
            shareError: 'تعذر مشاركة رابط الوظيفة.',
            poweredBy: 'التقديم الآمن عبر TalentFlow AI',
            backHome: 'العودة إلى الرئيسية',
          }
        : {
            openRoles: 'Open positions',
            joinTeam: 'Join our team',
            search: 'Search roles',
            allLocations: 'All locations',
            allTypes: 'All job types',
            noJobs: 'No matching positions are open right now.',
            viewDetails: 'View details',
            requirements: 'Requirements',
            benefits: 'Benefits',
            apply: 'Apply for this role',
            applyTitle: 'Finish your application in a candidate account',
            applyBody:
              'Applications are submitted through a candidate account so you can securely track status and receive interview updates.',
            signIn: 'Sign in and apply',
            createAccount: 'Create candidate account',
            profileNote:
              'Your profile and resume are attached only after you sign in. This public page never pretends an application was submitted.',
            loading: 'Loading career page…',
            loadError: 'The career page could not be loaded. Please try again.',
            notFound: 'This career page does not exist or is not published.',
            shareCopied: 'Job link copied.',
            shareError: 'The job link could not be shared.',
            poweredBy: 'Secure applications powered by TalentFlow AI',
            backHome: 'Back to home',
          },
    [isArabic],
  );

  const [slug, setSlug] = useState('');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let active = true;
    void slugPromise
      .then(({ slug: resolvedSlug }) => {
        if (active) setSlug(resolvedSlug.trim().toLowerCase());
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slugPromise]);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError('');
      setNotFound(false);

      try {
        const companyResponse = await fetch(`/api/public/companies/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });

        if (companyResponse.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!companyResponse.ok) throw new Error('Company request failed');

        const companyPayload = (await companyResponse.json()) as CompanyPayload;
        const jobsResponse = await fetch(
          `/api/public/jobs?slug=${encodeURIComponent(slug)}`,
          { cache: 'no-store' },
        );
        if (!jobsResponse.ok) throw new Error('Jobs request failed');

        const jobsPayload = await jobsResponse.json();
        if (!Array.isArray(jobsPayload)) throw new Error('Invalid jobs response');

        if (active) {
          setCompany(normalizeCompany(companyPayload, slug));
          setJobs(jobsPayload as JobItem[]);
        }
      } catch {
        if (active) setLoadError(copy.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [copy.loadError, slug]);

  useEffect(() => {
    const requestedJob = searchParams.get('job');
    if (!requestedJob || jobs.length === 0) return;

    const match = jobs.find((job) => job.id === requestedJob);
    if (match) {
      setSelectedJob(match);
      setDetailsOpen(true);
    }
  }, [jobs, searchParams]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const locations = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((job) => job.location).filter((value): value is string => Boolean(value))),
      ).sort(),
    [jobs],
  );
  const jobTypes = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.jobType))).sort(),
    [jobs],
  );
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query);
      const matchesLocation = location === 'all' || job.location === location;
      const matchesType = jobType === 'all' || job.jobType === jobType;
      return matchesSearch && matchesLocation && matchesType;
    });
  }, [jobType, jobs, location, search]);

  function openDetails(job: JobItem) {
    setSelectedJob(job);
    setDetailsOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('job', job.id);
    window.history.replaceState({}, '', url);
  }

  function closeDetails(open: boolean) {
    setDetailsOpen(open);
    if (!open) {
      const url = new URL(window.location.href);
      url.searchParams.delete('job');
      window.history.replaceState({}, '', url);
    }
  }

  async function shareJob(job: JobItem) {
    const url = new URL(`/careers/${slug}`, window.location.origin);
    url.searchParams.set('job', job.id);

    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        toast.success(copy.shareCopied);
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        toast.error(copy.shareError);
      }
    }
  }

  function applyDestination(path: '/auth/login' | '/auth/register') {
    const callbackUrl = selectedJob
      ? `/candidate/jobs/${selectedJob.id}`
      : '/candidate/jobs';
    router.push(`${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{copy.loading}</span>
        </div>
      </main>
    );
  }

  if (notFound || !company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" dir={dir}>
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-10">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h1 className="mt-5 text-2xl font-bold">{copy.notFound}</h1>
            <Button className="mt-6" onClick={() => router.push('/')}>
              {copy.backHome}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            className="flex items-center gap-3 text-start"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
              {company.logo ? (
                <img src={company.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{getInitials(company.name)}</span>
              )}
            </span>
            <span>
              <span className="block font-semibold">{company.name}</span>
              <span className="block text-xs text-muted-foreground">{copy.openRoles}</span>
            </span>
          </button>
          <Button
            size="sm"
            onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Briefcase className="me-2 h-4 w-4" />
            {copy.openRoles}
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b bg-muted/25">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg">
              {company.logo ? (
                <img src={company.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8" />
              )}
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              {copy.joinTeam}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {company.tagline}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              {company.industry && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {company.industry}
                </span>
              )}
              {company.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {company.location}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <Globe2 className="h-4 w-4" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold">{copy.openRoles}</h2>
              <p className="mt-1 text-muted-foreground">
                {filteredJobs.length} / {jobs.length}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {copy.poweredBy}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_220px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.search}
                className="ps-10"
              />
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder={copy.allLocations} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allLocations}</SelectItem>
                {locations.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder={copy.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allTypes}</SelectItem>
                {jobTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {JOB_TYPE_LABELS[item] || item.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadError && (
            <Card className="mt-6 border-destructive/30">
              <CardContent className="p-5 text-sm text-destructive">{loadError}</CardContent>
            </Card>
          )}

          {filteredJobs.length === 0 ? (
            <Card className="mt-8">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Briefcase className="mx-auto h-10 w-10 opacity-40" />
                <p className="mt-4">{copy.noJobs}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => {
                const salary = formatSalary(job);
                return (
                  <Card
                    key={job.id}
                    className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetails(job)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetails(job);
                      }
                    }}
                  >
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{company.name}</p>
                        </div>
                        <Badge variant="secondary">
                          {JOB_TYPE_LABELS[job.jobType] || job.jobType.replaceAll('_', ' ')}
                        </Badge>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {job.description}
                      </p>
                      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location || (job.isRemote ? 'Remote' : 'Flexible location')}
                        </p>
                        {salary && (
                          <p className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {salary}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatPostedDate(job.postedAt)}
                        </p>
                      </div>
                      <Button className="mt-6 w-full" variant="outline" tabIndex={-1}>
                        {copy.viewDetails}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {(company.values.length > 0 || company.cultureText) && (
          <section className="border-t bg-muted/25">
            <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
              <h2 className="text-2xl font-bold">Culture & values</h2>
              {company.values.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {company.values.map((value) => (
                    <Badge key={value} className="px-3 py-1">
                      {value}
                    </Badge>
                  ))}
                </div>
              )}
              {company.cultureText && (
                <p className="mx-auto mt-6 max-w-2xl leading-7 text-muted-foreground">
                  {company.cultureText}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {copy.poweredBy}
      </footer>

      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-6 end-6 z-30 rounded-full shadow-lg"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  {company.name} · {selectedJob.location || 'Flexible location'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {JOB_TYPE_LABELS[selectedJob.jobType] || selectedJob.jobType.replaceAll('_', ' ')}
                  </Badge>
                  {selectedJob.isRemote && <Badge variant="outline">Remote</Badge>}
                  {formatSalary(selectedJob) && (
                    <Badge variant="outline">{formatSalary(selectedJob)}</Badge>
                  )}
                </div>

                <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                  {selectedJob.description}
                </p>

                {selectedJob.requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold">{copy.requirements}</h3>
                    <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                      {selectedJob.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.benefits.length > 0 && (
                  <div>
                    <h3 className="font-semibold">{copy.benefits}</h3>
                    <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                      {selectedJob.benefits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Separator />
              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => void shareJob(selectedJob)}>
                  <Share2 className="me-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    setApplyOpen(true);
                  }}
                >
                  {copy.apply}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.applyTitle}</DialogTitle>
            <DialogDescription>
              {selectedJob ? `${selectedJob.title} — ${company.name}` : company.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="leading-7 text-muted-foreground">{copy.applyBody}</p>
            <div className="rounded-lg border bg-muted/35 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              {copy.profileNote}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => applyDestination('/auth/register')}>
              <UserPlus className="me-2 h-4 w-4" />
              {copy.createAccount}
            </Button>
            <Button onClick={() => applyDestination('/auth/login')}>
              <LogIn className="me-2 h-4 w-4" />
              {copy.signIn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
