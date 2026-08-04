'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/store/i18n-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

type Job = {
  id: string;
  title: string;
  description: string;
  jobType: string;
  location: string | null;
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
  company: { id: string; name: string; logo: string | null };
  _count: { applications: number };
};

type RawJob = Omit<Job, 'skills'> & { skills: string | string[] | null };

type SavedJob = { jobId: string };
type CandidateApplication = { jobId: string; status: string };

function parseSkills(value: RawJob['skills']): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
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

function companyInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatSalary(job: Job) {
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: job.salaryCurrency || 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${job.salaryCurrency} ${value.toLocaleString()}`;
    }
  };

  if (job.salaryMin && job.salaryMax) {
    return `${format(job.salaryMin)} – ${format(job.salaryMax)}`;
  }
  if (job.salaryMin) return `From ${format(job.salaryMin)}`;
  if (job.salaryMax) return `Up to ${format(job.salaryMax)}`;
  return 'Salary not specified';
}

function timeAgo(value: string | null) {
  if (!value) return '';
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function JobSearchPage() {
  const { dir } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applicationByJob, setApplicationByJob] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [experience, setExperience] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [jobsResponse, savedResponse, applicationsResponse] = await Promise.all([
        fetch('/api/jobs?status=OPEN', { cache: 'no-store' }),
        fetch('/api/candidate/saved-jobs', { cache: 'no-store' }),
        fetch('/api/candidate/applications', { cache: 'no-store' }),
      ]);

      if (!jobsResponse.ok) {
        throw new Error(await getApiErrorMessage(jobsResponse, 'Unable to load jobs'));
      }

      const rawJobs = (await jobsResponse.json()) as RawJob[];
      const saved = savedResponse.ok
        ? ((await savedResponse.json()) as SavedJob[])
        : [];
      const applications = applicationsResponse.ok
        ? ((await applicationsResponse.json()) as CandidateApplication[])
        : [];

      setJobs(
        Array.isArray(rawJobs)
          ? rawJobs.map((job) => ({ ...job, skills: parseSkills(job.skills) }))
          : [],
      );
      setSavedIds(new Set(Array.isArray(saved) ? saved.map((item) => item.jobId) : []));
      setApplicationByJob(
        new Map(
          Array.isArray(applications)
            ? applications.map((application) => [
                application.jobId,
                application.status,
              ])
            : [],
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const locationTerm = location.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesKeyword =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.company.name.toLowerCase().includes(term) ||
        job.skills.some((skill) => skill.toLowerCase().includes(term));
      const matchesLocation =
        !locationTerm ||
        job.location?.toLowerCase().includes(locationTerm) ||
        (locationTerm === 'remote' && job.isRemote);
      const matchesType = jobType === 'all' || job.jobType === jobType;
      const minimumExperience = job.experienceMin ?? 0;
      const matchesExperience =
        experience === 'all' ||
        (experience === 'entry' && minimumExperience <= 2) ||
        (experience === 'mid' && minimumExperience >= 3 && minimumExperience <= 5) ||
        (experience === 'senior' && minimumExperience >= 6);
      return matchesKeyword && matchesLocation && matchesType && matchesExperience;
    });
  }, [experience, jobType, jobs, keyword, location]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleJobs = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = Boolean(
    keyword || location || jobType !== 'all' || experience !== 'all',
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function clearFilters() {
    setKeyword('');
    setLocation('');
    setJobType('all');
    setExperience('all');
    setPage(1);
  }

  async function toggleSave(jobId: string) {
    const isSaved = savedIds.has(jobId);
    setSavingId(jobId);
    try {
      const response = await apiFetch('/api/candidate/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: isSaved ? 'remove' : 'save',
        }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to update saved job'));
      }
      setSavedIds((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      toast.success(isSaved ? 'Removed from saved jobs' : 'Job saved');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to save job');
    } finally {
      setSavingId(null);
    }
  }

  const filters = (
    <div className="space-y-5">
      <div className="space-y-2">
        <LabelText>Keyword</LabelText>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Job title, company, or skill"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <LabelText>Location</LabelText>
        <div className="relative">
          <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="City or Remote"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <LabelText>Employment type</LabelText>
        <Select
          value={jobType}
          onValueChange={(value) => {
            setJobType(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'HYBRID'].map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <LabelText>Experience level</LabelText>
        <Select
          value={experience}
          onValueChange={(value) => {
            setExperience(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="entry">Entry · 0–2 years</SelectItem>
            <SelectItem value="mid">Mid · 3–5 years</SelectItem>
            <SelectItem value="senior">Senior · 6+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" className="w-full" onClick={clearFilters}>
          <X className="me-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
        <Skeleton className="h-20" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Find jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} published opportunities match your filters.
          </p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="me-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'}>
              <SheetHeader>
                <SheetTitle>Job filters</SheetTitle>
              </SheetHeader>
              <div className="p-4">{filters}</div>
            </SheetContent>
          </Sheet>
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

      <div className="flex gap-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-20">
            <CardContent className="p-5">
              <p className="mb-4 flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </p>
              {filters}
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 flex-1">
          {visibleJobs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium">No jobs found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust the filters to discover more opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs.map((job) => {
                const saved = savedIds.has(job.id);
                const applicationStatus = applicationByJob.get(job.id);
                return (
                  <Card key={job.id} className="group transition-shadow hover:shadow-md">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 rounded-xl">
                          <AvatarImage src={job.company.logo || undefined} />
                          <AvatarFallback className="rounded-xl">
                            {companyInitials(job.company.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/candidate/jobs/${job.id}`}
                            className="font-semibold group-hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {job.company.name}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void toggleSave(job.id)}
                          disabled={savingId === job.id}
                          aria-label={saved ? 'Remove saved job' : 'Save job'}
                        >
                          {savingId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : saved ? (
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {job.jobType.replaceAll('_', ' ')}
                        </Badge>
                        {job.isRemote && <Badge variant="outline">Remote</Badge>}
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location || 'Flexible location'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {formatSalary(job)}
                        </p>
                        <p className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {job.experienceMin ?? 0}
                          {job.experienceMax ? `–${job.experienceMax}` : '+'} years
                        </p>
                      </div>

                      {job.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-[10px]">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 4 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{job.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                        <div className="text-xs text-muted-foreground">
                          <p>{job._count?.applications || 0} applicants</p>
                          <p className="mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(job.publishedAt || job.createdAt)}
                          </p>
                        </div>
                        {applicationStatus ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700">
                            <CheckCircle2 className="me-1 h-3 w-3" />
                            {applicationStatus.replaceAll('_', ' ')}
                          </Badge>
                        ) : (
                          <Button asChild size="sm">
                            <Link href={`/candidate/jobs/${job.id}`}>View and apply</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LabelText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium">{children}</p>;
}
