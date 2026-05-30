'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Users,
  Calendar,
  Clock,
  DollarSign,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Zap,
  QrCode,
  MessageSquare,
  Linkedin,
  Copy,
  ExternalLink,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  jobType: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  isRemote: boolean;
  openings: number;
  deadline: string | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { applications: number };
  company: { id: string; name: string };
  createdBy: { id: string; name: string };
}

interface QuickApplyConfigData {
  enableQuickApply: boolean;
  enableOneClick: boolean;
  enableTextApply: boolean;
  textApplyCode: string | null;
  qrCodeUrl: string | null;
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400', dotColor: 'bg-gray-400' },
  OPEN: { label: 'Open', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', dotColor: 'bg-teal-500' },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500' },
  CLOSED: { label: 'Closed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500', dotColor: 'bg-gray-400' },
};

const jobTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export default function JobsPage() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyId, setCompanyId] = useState<string>('');

  // Quick Apply Config dialog
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configJob, setConfigJob] = useState<Job | null>(null);
  const [configData, setConfigData] = useState<QuickApplyConfigData>({
    enableQuickApply: true,
    enableOneClick: false,
    enableTextApply: false,
    textApplyCode: null,
    qrCodeUrl: null,
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      const seedData = await seedRes.json();
      const cId = seedData.companyId;
      setCompanyId(cId);

      const res = await fetch(`/api/jobs?companyId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const openQuickApplyConfig = async (job: Job) => {
    setConfigJob(job);
    setShowConfigDialog(true);
    setConfigLoading(true);

    // Try to fetch existing config
    try {
      const qrRes = await fetch(`/api/jobs/${job.id}/qr-apply`);
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setConfigData((prev) => ({
          ...prev,
          qrCodeUrl: qrData.qrCodeUrl,
        }));
      }
    } catch {}

    // Generate a text apply code if not set
    const textCode = `APPLY-${job.slug.slice(0, 8).toUpperCase()}`;
    setConfigData((prev) => ({
      ...prev,
      textApplyCode: prev.textApplyCode || textCode,
    }));

    setConfigLoading(false);
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    // Simulate save (in real app, would POST to API)
    await new Promise((r) => setTimeout(r, 800));
    setConfigSaving(false);
    setShowConfigDialog(false);
    toast.success(t.quickApply.configSaved);
  };

  const handleCopyLink = () => {
    const applyUrl = `${window.location.origin}/apply/${configJob?.slug}`;
    navigator.clipboard.writeText(applyUrl);
    toast.success(t.quickApply.linkCopied);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: jobs.length,
    DRAFT: jobs.filter((j) => j.status === 'DRAFT').length,
    OPEN: jobs.filter((j) => j.status === 'OPEN').length,
    PAUSED: jobs.filter((j) => j.status === 'PAUSED').length,
    CLOSED: jobs.filter((j) => j.status === 'CLOSED').length,
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified';
    const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.jobs.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your job postings and track applicants</p>
        </div>
        <Link href="/company/jobs/create">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 me-2" />
            {t.jobs.createJob}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.jobs.searchJobs}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="OPEN" className="text-xs px-3">
                Open ({statusCounts.OPEN})
              </TabsTrigger>
              <TabsTrigger value="DRAFT" className="text-xs px-3">
                Draft ({statusCounts.DRAFT})
              </TabsTrigger>
              <TabsTrigger value="PAUSED" className="text-xs px-3">
                Paused ({statusCounts.PAUSED})
              </TabsTrigger>
              <TabsTrigger value="CLOSED" className="text-xs px-3">
                Closed ({statusCounts.CLOSED})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-e-none"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-s-none"
              onClick={() => setView('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first job posting to get started'}
            </p>
            <Link href="/company/jobs/create">
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.jobs.createJob}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const status = statusConfig[job.status] || statusConfig.DRAFT;
            return (
              <Card key={job.id} className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 dark:hover:border-teal-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.company.name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 me-2" />View Details</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="w-4 h-4 me-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openQuickApplyConfig(job)}>
                          <Zap className="w-4 h-4 me-2" />
                          {t.quickApply.configTitle}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 me-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 transition-colors duration-300', status.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full me-1 transition-all duration-300', status.dotColor, 'animate-pulse')} />
                      {status.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {jobTypeLabels[job.jobType] || job.jobType}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {job.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{job.location}{job.isRemote ? ' · Remote' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3 flex-shrink-0" />
                      <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span>{job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''} · {job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-teal-600 hover:text-teal-700"
                        onClick={() => openQuickApplyConfig(job)}
                      >
                        <Zap className="w-3 h-3 me-1" />
                        <span className="hidden sm:inline">{t.quickApply.configTitle}</span>
                      </Button>
                      <Link href={`/company/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-teal-600 hover:text-teal-700">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t.jobs.jobTitle}</TableHead>
                <TableHead className="text-xs">{t.jobs.status}</TableHead>
                <TableHead className="text-xs">{t.jobs.jobType}</TableHead>
                <TableHead className="text-xs">{t.jobs.location}</TableHead>
                <TableHead className="text-xs">{t.jobs.applicants}</TableHead>
                <TableHead className="text-xs">{t.jobs.salary}</TableHead>
                <TableHead className="text-xs">Posted</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const status = statusConfig[job.status] || statusConfig.DRAFT;
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-sm">{job.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', status.color)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full me-1', status.dotColor)} />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{jobTypeLabels[job.jobType] || job.jobType}</TableCell>
                    <TableCell className="text-xs">{job.location || '—'}{job.isRemote ? ' · Remote' : ''}</TableCell>
                    <TableCell className="text-xs">{job._count.applications}</TableCell>
                    <TableCell className="text-xs">{formatSalary(job.salaryMin, job.salaryMax)}</TableCell>
                    <TableCell className="text-xs">{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 me-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Pencil className="w-4 h-4 me-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openQuickApplyConfig(job)}>
                            <Zap className="w-4 h-4 me-2" />
                            {t.quickApply.configTitle}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 me-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Quick Apply Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600" />
              {t.quickApply.configTitle}
            </DialogTitle>
            <DialogDescription>
              {configJob?.title}
            </DialogDescription>
          </DialogHeader>

          {configLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-500" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Enable Quick Apply */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.quickApply.enableQuickApply}</Label>
                    <p className="text-xs text-muted-foreground">{t.quickApply.subtitle}</p>
                  </div>
                </div>
                <Switch
                  checked={configData.enableQuickApply}
                  onCheckedChange={(checked) => setConfigData({ ...configData, enableQuickApply: checked })}
                />
              </div>

              <Separator />

              {/* Enable One-Click Apply */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.quickApply.enableOneClick}</Label>
                    <p className="text-xs text-muted-foreground">{t.quickApply.oneClickDesc}</p>
                  </div>
                </div>
                <Switch
                  checked={configData.enableOneClick}
                  onCheckedChange={(checked) => setConfigData({ ...configData, enableOneClick: checked })}
                />
              </div>

              <Separator />

              {/* Enable Text-to-Apply */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.quickApply.enableTextApply}</Label>
                    <p className="text-xs text-muted-foreground">{t.quickApply.textApplySubtitle}</p>
                  </div>
                </div>
                <Switch
                  checked={configData.enableTextApply}
                  onCheckedChange={(checked) => setConfigData({ ...configData, enableTextApply: checked })}
                />
              </div>

              {configData.enableTextApply && configData.textApplyCode && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 animate-fade-in">
                  <Label className="text-xs text-muted-foreground">{t.quickApply.textCodeLabel}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/30 rounded">
                      {configData.textApplyCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(configData.textApplyCode || '');
                        toast.success(t.quickApply.linkCopied);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* QR Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  <Label className="text-sm font-medium">{t.quickApply.qrCodeLabel}</Label>
                </div>
                {configData.qrCodeUrl ? (
                  <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <img
                      src={configData.qrCodeUrl}
                      alt={t.quickApply.qrApplyTitle}
                      className="w-40 h-40 rounded-lg"
                    />
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <a href={configData.qrCodeUrl} target="_blank" rel="noopener noreferrer" download>
                        {t.quickApply.qrApplyDownload}
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 rounded-lg bg-muted/30 border border-border/50">
                    <QrCode className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">{t.quickApply.qrApplyScan}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Apply URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t.quickApply.applyUrl}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${configJob?.slug || ''}`}
                    className="text-xs h-9 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 flex-shrink-0"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={configSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {configSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t.common.loading}
                    </span>
                  ) : (
                    t.common.save
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
