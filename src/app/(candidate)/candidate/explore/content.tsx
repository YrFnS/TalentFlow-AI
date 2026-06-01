// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Building2,
  Star,
  Briefcase,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Code2,
  Palette,
  Database,
  Package,
  Server,
  Zap,
  Loader2,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface JobData {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  isRemote: boolean;
  jobType: string;
  skills: string[];
  publishedAt: string | null;
  applicantCount: number;
}

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  logo: string | null;
  openJobs: number;
}

const categoryConfig = [
  { key: 'engineering', icon: Code2 },
  { key: 'design', icon: Palette },
  { key: 'data', icon: Database },
  { key: 'product', icon: Package },
  { key: 'devops', icon: Server },
];

export default function ExplorePage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, companiesRes] = await Promise.all([
          fetch('/api/jobs?status=OPEN'),
          fetch('/api/admin/companies'),
        ]);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company?.name || '',
            companyLogo: j.company?.logo || null,
            location: j.location || '',
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            salaryCurrency: j.salaryCurrency || 'USD',
            isRemote: j.isRemote || false,
            jobType: j.jobType || 'FULL_TIME',
            skills: j.skills ? JSON.parse(j.skills) : [],
            publishedAt: j.publishedAt || j.createdAt,
            applicantCount: j._count?.applications || 0,
          })));
        }
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies((companiesData.companies || companiesData).slice(0, 6).map((c: any) => ({
            id: c.id,
            name: c.name,
            industry: c.industry || '',
            logo: c.logo,
            openJobs: c._count?.jobs || 0,
          })));
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryLabelMap: Record<string, string> = {
    engineering: t.jobs.engineering,
    design: t.jobs.design,
    data: t.jobs.data,
    product: t.jobs.product,
    devops: t.jobs.devOps,
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !activeCategory || job.jobType.toLowerCase().includes(activeCategory);
      return matchesSearch && (activeCategory ? matchesCategory : true);
    });
  }, [searchQuery, activeCategory, jobs]);

  const stats = [
    { label: t.jobs.openPositions, value: jobs.length.toString(), icon: Briefcase, color: 'text-blue-600' },
    { label: t.dashboard.totalCompanies, value: companies.length.toString(), icon: Building2, color: 'text-blue-600' },
  ];

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min || !max) return '';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${Math.round(min / 1000)}K - ${symbol}${Math.round(max / 1000)}K`;
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-blue-600">
        <div className="relative px-4 md:px-6 lg:px-8 py-12 md:py-20 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-white/90 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              {t.common.poweredBy}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              {t.jobs.dreamJob}
            </h1>
            <p className="text-lg text-white/80 mb-8">
              {t.jobs.explore} — {t.jobs.browseCategories}
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t.jobs.searchJobs}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 ps-12 pe-4 text-base bg-white rounded-xl border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-400"
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 mt-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 text-white">
                <stat.icon className="h-5 w-5 text-white/70" />
                <div>
                  <span className="text-xl font-bold">{stat.value}</span>
                  <span className="text-white/70 text-sm ms-1.5">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-10">
        {/* Featured Jobs */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                <Zap className="h-5 w-5 text-blue-500" />
                {t.jobs.featuredJobs}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Hand-picked opportunities for you</p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              {t.common.viewAll}
              <ArrowRight className="h-4 w-4 ms-1" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No jobs available yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Check back soon for new opportunities!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {jobs.slice(0, 4).map((job) => (
                <Card
                  key={job.id}
                  className="group border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                          {job.company.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{job.location}</span>
                      {job.isRemote && <Badge variant="secondary" className="text-[10px]">Remote</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] h-5">{skill}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(job.publishedAt)}</span>
                    </div>
                    <Button className="w-full mt-3 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                      {t.jobs.applyNow}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Jobs by Category */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              {t.jobs.jobsByCategory}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className={activeCategory === null ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              {t.common.all}
            </Button>
            {categoryConfig.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                  className={activeCategory === cat.key ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  <Icon className="h-3.5 w-3.5 me-1.5" />
                  {categoryLabelMap[cat.key]}
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0 rounded-lg">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">
                          {job.company.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{job.location}</span>
                    <Clock className="h-3 w-3 ms-1" />
                    <span>{timeAgo(job.publishedAt)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-5">{skill}</Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        +{job.skills.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </span>
                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                      {t.jobs.applyNow}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && !loading && (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.common.noResults}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or category filter</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Trending Companies */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                <Building2 className="h-5 w-5 text-blue-500" />
                {t.jobs.trendingCompanies}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Top companies hiring now</p>
            </div>
          </div>
          {companies.length === 0 ? (
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No companies yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Companies will appear here once they start posting jobs.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold rounded-xl">
                          {company.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">{company.name}</h3>
                        <p className="text-xs text-muted-foreground">{company.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                        <span>{company.openJobs} {t.jobs.openPositions.toLowerCase()}</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs hover:bg-slate-50 hover:text-blue-700 hover:border-blue-200">
                        {t.common.viewAll}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
