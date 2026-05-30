// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import { useCsrf } from '@/hooks/use-csrf';
import {
  Search,
  FileText,
  Sparkles,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageSquare,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  coverLetter: string | null;
  aiAnalysis: string | null;
  source: string | null;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    user: { id: string; name: string; email: string; image: string | null };
    currentTitle: string | null;
    location: string | null;
    skills: string | null;
    experienceYears: number | null;
    bio: string | null;
  };
  job: { id: string; title: string; company: { name: string } };
  currentStage: { id: string; name: string; color: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  APPLIED: { label: 'Applied', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: FileText },
  SCREENING: { label: 'Screening', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Search },
  INTERVIEW: { label: 'Interview', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Calendar },
  OFFERED: { label: 'Offered', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: CheckCircle2 },
  HIRED: { label: 'Hired', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400', icon: XCircle },
};

const sourceLabels: Record<string, string> = {
  direct: 'Direct',
  linkedin: 'LinkedIn',
  referral: 'Referral',
  'job-board': 'Job Board',
};

const nextActions: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  APPLIED: [
    { label: 'Move to Screening', nextStatus: 'SCREENING', color: 'text-cyan-600' },
    { label: 'Reject', nextStatus: 'REJECTED', color: 'text-destructive' },
  ],
  SCREENING: [
    { label: 'Schedule Interview', nextStatus: 'INTERVIEW', color: 'text-amber-600' },
    { label: 'Reject', nextStatus: 'REJECTED', color: 'text-destructive' },
  ],
  INTERVIEW: [
    { label: 'Send Offer', nextStatus: 'OFFERED', color: 'text-violet-600' },
    { label: 'Reject', nextStatus: 'REJECTED', color: 'text-destructive' },
  ],
  OFFERED: [
    { label: 'Mark as Hired', nextStatus: 'HIRED', color: 'text-emerald-600' },
    { label: 'Reject', nextStatus: 'REJECTED', color: 'text-destructive' },
  ],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export default function ApplicationsPage() {
  const { t } = useI18n();
  const { csrfToken } = useCsrf();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);

  const fetchApplications = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      const seedData = await seedRes.json();
      const cId = seedData.companyId;
      setCompanyId(cId);

      const [appsRes, jobsRes] = await Promise.all([
        fetch(`/api/applications?companyId=${cId}`),
        fetch(`/api/jobs?companyId=${cId}`),
      ]);

      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data);
      }
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.job.id === jobFilter;
    const matchesSearch =
      !searchQuery ||
      app.candidate.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesJob && matchesSearch;
  });

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const parseSkills = (skills: string | null): string[] => {
    if (!skills) return [];
    try {
      return JSON.parse(skills);
    } catch {
      return skills.split(',').map((s) => s.trim());
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatDate(date);
  };

  // Status counts
  const statusCounts: Record<string, number> = {
    all: applications.length,
    APPLIED: applications.filter((a) => a.status === 'APPLIED').length,
    SCREENING: applications.filter((a) => a.status === 'SCREENING').length,
    INTERVIEW: applications.filter((a) => a.status === 'INTERVIEW').length,
    OFFERED: applications.filter((a) => a.status === 'OFFERED').length,
    HIRED: applications.filter((a) => a.status === 'HIRED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.applications.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {applications.length} total applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
            {Object.entries(statusConfig).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label} ({statusCounts[key] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <Briefcase className="w-4 h-4 me-2 text-muted-foreground" />
            <SelectValue placeholder="All Jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Summary Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(statusConfig).map(([key, val]) => {
          const count = statusCounts[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                val.color,
                statusFilter === key ? 'ring-2 ring-offset-1 ring-teal-500' : ''
              )}
            >
              {count} {val.label}
            </button>
          );
        })}
      </div>

      {/* Applications Table */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No applications found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all' || jobFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here when candidates apply to your jobs'}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Candidate</TableHead>
                <TableHead className="text-xs">Job</TableHead>
                <TableHead className="text-xs">{t.applications.applicationStatus}</TableHead>
                <TableHead className="text-xs">{t.candidates.matchScore}</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Applied</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => {
                const status = statusConfig[app.status] || statusConfig.APPLIED;
                const actions = nextActions[app.status] || [];
                return (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-accent/30"
                    onClick={() => {
                      setSelectedApp(app);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs">
                            {app.candidate.user.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{app.candidate.user.name}</p>
                          <p className="text-xs text-muted-foreground">{app.candidate.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{app.job.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', status.color)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.matchScore ? (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-500" />
                          <span className="text-xs font-semibold">{app.matchScore}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {sourceLabels[app.source || 'direct'] || app.source}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(app.appliedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {actions.slice(0, 1).map((action) => (
                          <Button
                            key={action.nextStatus}
                            variant="ghost"
                            size="sm"
                            className={cn('h-7 text-xs px-2', action.color)}
                            onClick={() => handleStatusChange(app.id, action.nextStatus)}
                          >
                            <ArrowRight className="w-3 h-3 me-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => (
                            <DropdownMenuItem
                              key={action.nextStatus}
                              onClick={() => handleStatusChange(app.id, action.nextStatus)}
                              className={action.color}
                            >
                              <ArrowRight className="w-4 h-4 me-2" />
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 me-2" />
                            {t.applications.addNote}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 me-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Application Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0">
          {selectedApp && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                        {selectedApp.candidate.user.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-start">
                      <p className="font-semibold">{selectedApp.candidate.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedApp.candidate.currentTitle || 'No title'} · Applied for {selectedApp.job.title}
                      </p>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none px-6 h-10 bg-transparent">
                    <TabsTrigger value="overview" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none">Overview</TabsTrigger>
                    <TabsTrigger value="analysis" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none">AI Analysis</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-6 space-y-5 mt-0">
                    {/* Status & Score */}
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs', statusConfig[selectedApp.status]?.color)}>
                        {statusConfig[selectedApp.status]?.label}
                      </Badge>
                      {selectedApp.matchScore && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          {selectedApp.matchScore}% Match
                        </div>
                      )}
                      {selectedApp.source && (
                        <Badge variant="outline" className="text-[10px]">
                          via {sourceLabels[selectedApp.source] || selectedApp.source}
                        </Badge>
                      )}
                    </div>

                    {/* Candidate Info */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Candidate Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedApp.candidate.user.email}</span>
                        </div>
                        {selectedApp.candidate.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedApp.candidate.location}</span>
                          </div>
                        )}
                        {selectedApp.candidate.experienceYears && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedApp.candidate.experienceYears} years experience</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Skills */}
                    {selectedApp.candidate.skills && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {parseSkills(selectedApp.candidate.skills).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Cover Letter */}
                    {selectedApp.coverLetter && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.applications.coverLetter}</h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/30 border border-border/50">
                          {selectedApp.coverLetter}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.applications.timeline}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                          <div>
                            <p className="text-sm font-medium">Application Submitted</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedApp.appliedAt)}</p>
                          </div>
                        </div>
                        {selectedApp.currentStage && (
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedApp.currentStage.color }} />
                            <div>
                              <p className="text-sm font-medium">Moved to {selectedApp.currentStage.name}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(selectedApp.updatedAt)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="p-6 space-y-5 mt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-500" />
                        <h3 className="text-base font-semibold">{t.candidates.aiAnalysis}</h3>
                      </div>
                      {selectedApp.aiAnalysis ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 rounded-lg bg-muted/30 border border-border/50">
                          {selectedApp.aiAnalysis}
                        </div>
                      ) : (
                        <div className="p-6 rounded-lg border border-dashed border-border text-center">
                          <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">AI analysis not yet generated</p>
                          <Button variant="outline" size="sm" className="mt-3 border-teal-300 dark:border-teal-700 text-teal-600">
                            <Sparkles className="w-3.5 h-3.5 me-1.5" />
                            Generate Analysis
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Match Score Breakdown */}
                    {selectedApp.matchScore && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Match Breakdown</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Skills Match', value: Math.min(100, (selectedApp.matchScore || 0) + 5) },
                            { label: 'Experience Level', value: Math.min(100, (selectedApp.matchScore || 0) - 5) },
                            { label: 'Education', value: Math.min(100, (selectedApp.matchScore || 0) + 2) },
                          ].map((item) => (
                            <div key={item.label} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{item.label}</span>
                                <span className="font-medium">{item.value}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-500 rounded-full"
                                  style={{ width: `${item.value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="p-6 space-y-4 mt-0">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.applications.addNote}</h4>
                      <Textarea
                        placeholder="Add a note about this application..."
                        rows={4}
                      />
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                        Save Note
                      </Button>
                    </div>
                    {selectedApp.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Existing Notes</h4>
                        <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border/50">
                          {selectedApp.notes}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Actions */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  {(nextActions[selectedApp.status] || []).map((action) => (
                    <Button
                      key={action.nextStatus}
                      size="sm"
                      variant={action.nextStatus === 'REJECTED' ? 'outline' : 'default'}
                      className={cn(
                        action.nextStatus !== 'REJECTED' && 'bg-teal-600 hover:bg-teal-700 text-white',
                        action.nextStatus === 'REJECTED' && 'text-destructive border-red-300 dark:border-red-800'
                      )}
                      onClick={() => handleStatusChange(selectedApp.id, action.nextStatus)}
                    >
                      <ArrowRight className="w-4 h-4 me-1.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
