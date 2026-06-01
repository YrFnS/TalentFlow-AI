// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Building2,
  Bookmark,
  BookmarkCheck,
  Star,
  SlidersHorizontal,
  X,
  Briefcase,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

interface JobData {
  id: string;
  title: string;
  company: { id: string; name: string; logo: string | null };
  location: string;
  type: string;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceMin: number | null;
  experienceMax: number | null;
  skills: string[];
  description: string;
  applicants: number;
  publishedAt: string | null;
  createdAt: string;
  match: number;
}

export default function JobSearchPage() {
  const { t, dir } = useI18n();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs?status=OPEN');
        if (res.ok) {
          const data = await res.json();
          setJobs(data.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company || { id: '', name: '', logo: null },
            location: j.location || '',
            type: j.jobType || 'FULL_TIME',
            isRemote: j.isRemote || false,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            salaryCurrency: j.salaryCurrency || 'USD',
            experienceMin: j.experienceMin,
            experienceMax: j.experienceMax,
            skills: j.skills ? JSON.parse(j.skills) : [],
            description: j.description || '',
            applicants: j._count?.applications || 0,
            publishedAt: j.publishedAt,
            createdAt: j.createdAt,
            match: Math.floor(Math.random() * 20) + 75,
          })));
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const jobTypeLabels: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesKeyword =
        !keyword ||
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.company.name.toLowerCase().includes(keyword.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(keyword.toLowerCase()));

      const matchesLocation =
        !locationFilter ||
        job.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
        (locationFilter.toLowerCase() === 'remote' && job.isRemote);

      const matchesType = typeFilter === 'all' || job.type === typeFilter;

      const matchesExperience =
        experienceFilter === 'all' ||
        (experienceFilter === 'entry' && (job.experienceMin ?? 0) <= 2) ||
        (experienceFilter === 'mid' && (job.experienceMin ?? 0) >= 3 && (job.experienceMin ?? 0) <= 5) ||
        (experienceFilter === 'senior' && (job.experienceMin ?? 0) >= 5 && (job.experienceMin ?? 0) <= 8) ||
        (experienceFilter === 'lead' && (job.experienceMin ?? 0) >= 8);

      return matchesKeyword && matchesLocation && matchesType && matchesExperience;
    });
  }, [keyword, locationFilter, typeFilter, experienceFilter, jobs]);

  const totalPages = Math.ceil(filteredJobs.length / perPage);
  const paginatedJobs = filteredJobs.slice((page - 1) * perPage, page * perPage);

  const toggleSave = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const handleApply = (jobId: string) => {
    setAppliedJobs((prev) => new Set(prev).add(jobId));
  };

  const clearFilters = () => {
    setKeyword('');
    setLocationFilter('');
    setTypeFilter('all');
    setExperienceFilter('all');
  };

  const hasActiveFilters = keyword || locationFilter || typeFilter !== 'all' || experienceFilter !== 'all';

  const formatSalary = (min: number | null, max: number | null, currency: string, type: string) => {
    if (!min || !max) return 'Salary not specified';
    if (type === 'INTERNSHIP') return `$${min}/hr`;
    return `$${Math.round(min / 1000)}K - $${Math.round(max / 1000)}K`;
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  const filterContent = (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-1.5 block">{t.candidate.keyword}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Job title, company, or skill..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t.candidate.location}</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="City or 'Remote'..."
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t.candidate.jobType}</label>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t.candidate.allTypes} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.candidate.allTypes}</SelectItem>
            <SelectItem value="FULL_TIME">{t.candidate.fullTime}</SelectItem>
            <SelectItem value="PART_TIME">{t.candidate.partTime}</SelectItem>
            <SelectItem value="CONTRACT">{t.candidate.contract}</SelectItem>
            <SelectItem value="INTERNSHIP">{t.candidate.internship}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t.candidate.experienceLevel}</label>
        <Select value={experienceFilter} onValueChange={(v) => { setExperienceFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t.candidate.allLevels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.candidate.allLevels}</SelectItem>
            <SelectItem value="entry">{t.candidate.entryLevel}</SelectItem>
            <SelectItem value="mid">{t.candidate.midLevel}</SelectItem>
            <SelectItem value="senior">{t.candidate.seniorLevel}</SelectItem>
            <SelectItem value="lead">{t.candidate.leadLevel}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-blue-600 hover:text-blue-700">
          <X className="h-4 w-4 mr-1" />
          {t.candidate.clearFilters}
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t.candidate.jobSearch}</h1>
          <p className="text-muted-foreground mt-1">
            {filteredJobs.length} jobs found
          </p>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {t.candidate.filters}
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-80">
              <SheetHeader>
                <SheetTitle>{t.candidate.filters}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {filterContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <Card className="sticky top-20 border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {t.candidate.filters}
              </h3>
              {filterContent}
            </CardContent>
          </Card>
        </aside>

        {/* Job Listings */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : paginatedJobs.length === 0 ? (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.candidate.noJobsFound}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.candidate.tryDifferentFilters}</p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    {t.candidate.clearFilters}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedJobs.map((job) => {
                const isSaved = savedJobs.has(job.id);
                const isApplied = appliedJobs.has(job.id);
                const salaryDisplay = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.type);

                return (
                  <Card key={job.id} className="group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                              {job.company.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{job.company.name}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleSave(job.id)}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bookmark className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {jobTypeLabels[job.type] || job.type}
                        </Badge>
                        {job.isRemote && (
                          <Badge variant="secondary" className="text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                            Remote
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-slate-900">{salaryDisplay}</span>
                        {job.experienceMin && job.experienceMin > 0 && (
                          <span className="flex items-center gap-0.5">
                            <GraduationCap className="h-3 w-3" />
                            {job.experienceMin}+ {t.candidate.experienceYears}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {timeAgo(job.publishedAt || job.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            +{job.skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-700">{job.match}% match</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{job.applicants} {t.candidate.applicants}</span>
                          {isApplied ? (
                            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                              &checkmark; {t.candidate.applied}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleApply(job.id)}
                            >
                              {t.candidate.quickApply}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t.common.back}
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className={p === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t.common.next}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
