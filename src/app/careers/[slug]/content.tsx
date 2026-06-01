// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Globe,
  TrendingUp,
  Lightbulb,
  Heart,
  Share2,
  Upload,
  X,
  ChevronDown,
  ArrowUp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface JobItem {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  isRemote: boolean;
}

interface CompanyConfig {
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  primaryColor: string;
  values: string[];
  benefits: string[];
  cultureText: string;
  socialLinks: { linkedin: string; twitter: string; github: string };
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
}

const emptyCompanyConfig: CompanyConfig = {
  name: '',
  slug: '',
  tagline: '',
  logo: null,
  primaryColor: 'blue',
  values: [],
  benefits: [],
  cultureText: '',
  socialLinks: { linkedin: '', twitter: '', github: '' },
  isPublished: false,
  metaTitle: '',
  metaDescription: '',
};

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export default function CareerPageContent({ slugPromise }: { slugPromise: Promise<{ slug: string }> }) {
  const { t, dir } = useI18n();
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [company, setCompany] = useState<CompanyConfig>(emptyCompanyConfig);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);

  const [deptFilter, setDeptFilter] = useState('all');
  const [locFilter, setLocFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const [appForm, setAppForm] = useState({ name: '', email: '', phone: '', coverLetter: '', resumeFile: null as File | null });
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    slugPromise.then((p) => setSlug(p.slug));
  }, [slugPromise]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setCompanyNotFound(false);
    try {
      const compRes = await fetch(`/api/public/companies/${slug}`);
      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.config) {
          setCompany((prev) => ({ ...prev, ...compData.config, name: compData.name || prev.name, slug: compData.slug || prev.slug }));
        } else {
          setCompany((prev) => ({ ...prev, name: compData.name || prev.name, slug: compData.slug || slug }));
        }
      } else {
        setCompanyNotFound(true);
      }

      const jobsRes = await fetch(`/api/public/jobs?slug=${slug}`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
        }
      }
    } catch {
      // Show empty states on error
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))];
  const jobTypes = [...new Set(jobs.map((j) => j.jobType).filter(Boolean))];

  const filteredJobs = jobs.filter((job) => {
    const matchDept = deptFilter === 'all' || job.department === deptFilter;
    const matchLoc = locFilter === 'all' || job.location === locFilter;
    const matchType = typeFilter === 'all' || job.jobType === typeFilter;
    return matchDept && matchLoc && matchType;
  });

  const formatSalary = (job: JobItem) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const isHourly = job.jobType === 'INTERNSHIP' || job.jobType === 'CONTRACT';
    const fmt = (n: number) => (isHourly ? `$${n}/hr` : `$${(n / 1000).toFixed(0)}k`);
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    return `Up to ${fmt(job.salaryMax!)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t.careerPage.postedDate + ' today';
    if (diff === 1) return t.careerPage.postedDate + ' 1 day ago';
    return `${t.careerPage.postedDate} ${diff} days ago`;
  };

  const handleApply = async () => {
    if (!appForm.name || !appForm.email) {
      toast.error('Please fill in your name and email');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setShowApplyDialog(false);
    setShowJobDialog(false);
    setAppForm({ name: '', email: '', phone: '', coverLetter: '', resumeFile: null });
    toast.success(t.careerPage.applicationSuccess);
  };

  const handleShare = (job: JobItem) => {
    const url = `${window.location.origin}/careers/${slug}?job=${job.id}`;
    if (navigator.share) {
      navigator.share({ title: job.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const scrollToJobs = () => {
    document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Show company not found state
  if (!loading && companyNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background" dir={dir}>
        <Building2 className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.careerPage.companyNotFound || 'Company Not Found'}</h1>
        <p className="text-muted-foreground mb-6">{t.careerPage.companyNotFoundDesc || 'The company you are looking for does not exist or has not published a career page.'}</p>
        <Button onClick={() => router.push('/')} className="bg-blue-600 text-white">
          {t.common.backToHome || 'Back to Home'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <span className="text-sm font-bold">{getInitials(company.name)}</span>
              )}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900">{company.name}</span>
              <span className="text-xs text-muted-foreground ms-2 hidden sm:inline">{company.tagline}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <button onClick={scrollToJobs} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.careerPage.openPositions}
            </button>
            <a href="#culture" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              {t.careerPage.companyCulture}
            </a>
            {company.socialLinks.linkedin && (
              <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-slate-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div>
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-lg mb-6">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <Building2 className="h-8 w-8" />
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-slate-900">
              {t.careerPage.joinTeam}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">{company.name}</p>
            <p className="text-muted-foreground max-w-xl mx-auto">{company.tagline}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 mt-10 max-w-sm mx-auto">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-4 text-center">
                <Briefcase className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-slate-900">{filteredJobs.length}</p>
                <p className="text-xs text-muted-foreground">{t.careerPage.openPositions}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            {t.careerPage.whyJoinUs}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, titleKey: 'growth' as const, descKey: 'growthDesc' as const },
              { icon: Lightbulb, titleKey: 'innovation' as const, descKey: 'innovationDesc' as const },
              { icon: Heart, titleKey: 'impact' as const, descKey: 'impactDesc' as const },
              { icon: Users, titleKey: 'culture' as const, descKey: 'cultureDesc' as const },
            ].map((item, i) => (
              <Card key={i} className="border-slate-200 text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{t.careerPage[item.titleKey]}</h3>
                  <p className="text-sm text-muted-foreground">{t.careerPage[item.descKey]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            {t.careerPage.openPositions}
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {filteredJobs.length} {t.careerPage.openPositions.toLowerCase()}
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 items-center justify-center">
            <span className="text-sm text-muted-foreground">{t.careerPage.filterBy}:</span>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder={t.careerPage.department} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.careerPage.allDepartments}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locFilter} onValueChange={setLocFilter}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder={t.careerPage.location} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.careerPage.allLocations}</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder={t.careerPage.jobType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.careerPage.allTypes}</SelectItem>
                {jobTypes.map((jt) => (
                  <SelectItem key={jt} value={jt}>{jobTypeLabels[jt] || jt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(deptFilter !== 'all' || locFilter !== 'all' || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setDeptFilter('all'); setLocFilter('all'); setTypeFilter('all'); }} className="text-xs">
                {t.common.clearFilters}
              </Button>
            )}
          </div>

          {/* Job Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-20" />
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">{t.careerPage.noOpenPositions}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border-slate-200 group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelectedJob(job); setShowJobDialog(true); }}
                >
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-base text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200">
                        {job.department}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200">
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </Badge>
                      {job.isRemote && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">
                          Remote
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      {formatSalary(job) && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 flex-shrink-0" />
                          <span>{formatSalary(job)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDate(job.postedAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full text-xs h-8 text-blue-600 hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowJobDialog(true); }}
                    >
                      {t.careerPage.viewDetails}
                      <ChevronDown className="w-3 h-3 ms-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Culture Section */}
      <section id="culture" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
            {t.careerPage.companyCulture}
          </h2>

          {/* Values */}
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{t.careerPage.companyValues}</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {company.values.map((val, i) => (
                <Badge key={i} className="px-3 py-1 text-sm bg-blue-600 text-white border-0">
                  {val}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{company.cultureText}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-background py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{t.careerPage.poweredBy}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            {company.socialLinks.linkedin && (
              <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                LinkedIn
              </a>
            )}
            {company.socialLinks.twitter && (
              <a href={company.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                Twitter
              </a>
            )}
            {company.socialLinks.github && (
              <a href={company.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                GitHub
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 end-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">{selectedJob?.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs px-2 border-slate-200">
                {selectedJob?.department}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 border-slate-200">
                {selectedJob ? jobTypeLabels[selectedJob.jobType] || selectedJob.jobType : ''}
              </Badge>
              {selectedJob?.isRemote && (
                <Badge variant="outline" className="text-xs px-2 text-blue-600 border-blue-200">
                  Remote
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{selectedJob.location}</div>
                {formatSalary(selectedJob) && (
                  <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{formatSalary(selectedJob)}</div>
                )}
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(selectedJob.postedAt)}</div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">{t.careerPage.requirements}</h4>
                <ul className="space-y-1.5">
                  {selectedJob.requirements.map((req, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">{t.careerPage.benefits}</h4>
                <ul className="space-y-1.5">
                  {selectedJob.benefits.map((ben, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      {ben}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => { setShowJobDialog(false); setShowApplyDialog(true); }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t.careerPage.applyNow}
                </Button>
                <Button variant="outline" onClick={() => handleShare(selectedJob)} className="flex-1">
                  <Share2 className="w-4 h-4 me-2" />
                  {t.careerPage.shareJob}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{t.careerPage.applicationForm}</DialogTitle>
            <DialogDescription>
              {selectedJob?.title} — {company.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name" className="text-sm font-medium">{t.careerPage.fullName} *</Label>
              <Input
                id="app-name"
                value={appForm.name}
                onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                placeholder={t.careerPage.fullName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-email" className="text-sm font-medium">{t.careerPage.emailAddress} *</Label>
              <Input
                id="app-email"
                type="email"
                value={appForm.email}
                onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                placeholder={t.careerPage.emailAddress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-phone" className="text-sm font-medium">{t.careerPage.phoneNumber}</Label>
              <Input
                id="app-phone"
                value={appForm.phone}
                onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                placeholder={t.careerPage.phoneNumber}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.careerPage.resumeUpload}</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setAppForm({ ...appForm, resumeFile: file });
                }}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-muted-foreground/25 hover:border-blue-400 hover:bg-muted/30'
                )}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) setAppForm({ ...appForm, resumeFile: file });
                  };
                  input.click();
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {appForm.resumeFile ? (
                      <span className="text-blue-600">{appForm.resumeFile.name}</span>
                    ) : (
                      <>
                        <span className="text-blue-600">Click to upload</span> or drag and drop
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">PDF, DOC, DOCX (max 5MB)</p>
                </div>
                {appForm.resumeFile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAppForm({ ...appForm, resumeFile: null }); }}
                    className="absolute top-2 end-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-cover" className="text-sm font-medium">{t.careerPage.coverLetter}</Label>
              <Textarea
                id="app-cover"
                value={appForm.coverLetter}
                onChange={(e) => setAppForm({ ...appForm, coverLetter: e.target.value })}
                placeholder={t.jobs.coverLetterPlaceholder}
                rows={3}
                className="resize-y min-h-[80px]"
              />
            </div>

            {/* Compact EEO Survey */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Voluntary Self-Identification (Optional)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Gender</Label>
                  <Select>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Ethnicity</Label>
                  <Select>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="black">Black/African American</SelectItem>
                      <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleApply}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.common.loading}
                </span>
              ) : (
                t.careerPage.submitApplication
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
