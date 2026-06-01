// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  ArrowRightLeft,
  Search,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface InternalJobPosting {
  id: string;
  jobId: string;
  companyId: string;
  postedById: string;
  isInternalOnly: boolean;
  minTenureMonths: number;
  notifyEmployees: boolean;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  department: string;
  location: string;
  applicationsCount: number;
}

interface InternalApplication {
  id: string;
  jobId: string;
  candidateId: string;
  currentRoleId: string | null;
  managerNotified: boolean;
  managerApproved: boolean | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  applicantName: string;
  currentRole: string;
  jobTitle: string;
  postingId: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  MANAGER_APPROVED: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  INTERVIEW: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 border-0',
  OFFERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  HIRED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-0',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  MANAGER_APPROVED: 'Approved',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

const departmentColors: Record<string, string> = {
  Engineering: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Marketing: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Sales: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 border-0',
  Product: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Design: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0',
};

// Mock jobs for create dialog
const mockJobs = [
  { id: 'job-6', title: 'DevOps Engineer', department: 'Engineering' },
  { id: 'job-7', title: 'Content Strategist', department: 'Marketing' },
  { id: 'job-8', title: 'Account Executive', department: 'Sales' },
];

export default function CompanyInternalJobsContent() {
  const { t } = useI18n();
  const it = t.internalJobs as Record<string, string>;

  const [postings, setPostings] = useState<InternalJobPosting[]>([]);
  const [applications, setApplications] = useState<InternalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<InternalJobPosting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Create form
  const [selectedJobId, setSelectedJobId] = useState('');
  const [minTenure, setMinTenure] = useState('6');
  const [isInternalOnly, setIsInternalOnly] = useState(true);
  const [notifyEmployees, setNotifyEmployees] = useState(true);
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/internal-jobs');
        const data = await res.json();
        setPostings(data.postings || []);
        setApplications(data.applications || []);
      } catch {
        // Use empty arrays on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const openings = postings.length;
    const appCount = applications.length;
    const hired = applications.filter(a => a.status === 'HIRED').length;
    const completedApps = applications.filter(a => ['HIRED', 'REJECTED'].includes(a.status));
    const avgDays = completedApps.length > 0 ? 18 : 0;
    return { openings, appCount, hired, avgDays };
  }, [postings, applications]);

  // Filtered postings
  const filteredPostings = useMemo(() => {
    return postings.filter(p => {
      if (filterDept !== 'all' && p.department !== filterDept) return false;
      if (searchQuery && !p.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) && !p.department.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [postings, filterDept, searchQuery]);

  // Filtered applications for selected posting
  const postingApplications = useMemo(() => {
    if (!selectedPosting) return [];
    return applications.filter(a => a.postingId === selectedPosting.id);
  }, [selectedPosting, applications]);

  const departments = [...new Set(postings.map(p => p.department))];

  const handleCreate = () => {
    if (!selectedJobId) {
      toast.error(it.selectJob);
      return;
    }
    const job = mockJobs.find(j => j.id === selectedJobId);
    const newPosting: InternalJobPosting = {
      id: `ij-${Date.now()}`,
      jobId: selectedJobId,
      companyId: 'comp-1',
      postedById: 'user-1',
      isInternalOnly,
      minTenureMonths: parseInt(minTenure) || 6,
      notifyEmployees,
      internalNotes: internalNotes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle: job?.title || 'New Position',
      department: job?.department || 'General',
      location: 'Remote',
      applicationsCount: 0,
    };
    setPostings(prev => [newPosting, ...prev]);
    toast.success(it.postingCreated);
    setCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedJobId('');
    setMinTenure('6');
    setIsInternalOnly(true);
    setNotifyEmployees(true);
    setInternalNotes('');
  };

  const handleApprove = (appId: string, action: 'approve' | 'reject') => {
    setApplications(prev => prev.map(a => {
      if (a.id === appId) {
        return {
          ...a,
          status: action === 'approve' ? 'MANAGER_APPROVED' : 'REJECTED',
          managerApproved: action === 'approve',
        };
      }
      return a;
    }));
    toast.success(action === 'approve' ? it.approved : it.rejected);
  };

  const openDetail = (posting: InternalJobPosting) => {
    setSelectedPosting(posting);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-soft flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-5 w-5 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{it.title}</h1>
            <p className="text-sm text-muted-foreground">{it.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 me-2" />
          {it.createPosting}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{it.internalOpenings}</p>
                <p className="text-xl font-bold">{stats.openings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{it.internalApplications}</p>
                <p className="text-xl font-bold">{stats.appCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{it.hiredInternally}</p>
                <p className="text-xl font-bold">{stats.hired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{it.avgTimeToHire}</p>
                <p className="text-xl font-bold">{stats.avgDays}d</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={it.department} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Internal Job Postings Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          {it.internalBoard}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPostings.map((posting) => {
            const daysAgo = Math.floor((Date.now() - new Date(posting.createdAt).getTime()) / 86400000);
            return (
              <Card key={posting.id} className="border-border/50 card-">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">{posting.jobTitle}</CardTitle>
                    <Badge className={cn('text-[10px] border-0', departmentColors[posting.department] || 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0')}>
                      {posting.department}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{posting.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{posting.minTenureMonths} {it.tenureMonths}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{daysAgo} {it.daysAgo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {posting.isInternalOnly && (
                          <Badge className="text-[9px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
                            {it.isInternalOnly}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{posting.applicationsCount} {it.applications}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                      onClick={() => openDetail(posting)}
                    >
                      <Eye className="h-3 w-3 me-1" />
                      {it.applications}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredPostings.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3" />
              <p className="text-sm">{it.noInternalJobs}</p>
            </div>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {it.applications}
        </h2>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.currentRole}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.department}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.managerApproval}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{it.applicationStatus}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-600 text-white text-[9px]">
                              {getInitials(app.applicantName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium block">{app.applicantName}</span>
                            <span className="text-[10px] text-muted-foreground">{app.currentRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{app.jobTitle}</span>
                      </td>
                      <td className="p-3">
                        {app.managerApproved === true ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {it.approved}
                          </Badge>
                        ) : app.managerApproved === false ? (
                          <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 text-[10px]">
                            <XCircle className="h-3 w-3 me-1" />
                            {it.rejected}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 border-0 text-[10px]">
                            <Clock className="h-3 w-3 me-1" />
                            {it.pendingApproval}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px]', statusColors[app.status] || 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0')}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {app.status === 'PENDING' && app.managerApproved === null && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => handleApprove(app.id, 'approve')}
                            >
                              <CheckCircle2 className="h-3 w-3 me-1" />
                              {it.approve}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleApprove(app.id, 'reject')}
                            >
                              <XCircle className="h-3 w-3 me-1" />
                              {it.rejectBtn}
                            </Button>
                          </div>
                        )}
                        {app.status !== 'PENDING' && (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{it.noApplications}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Internal Posting Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              {it.createPosting}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{it.selectJob}</label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={it.selectJobPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {mockJobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.title} — {j.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{it.minTenureMonths}</label>
              <Input
                type="number"
                min={0}
                value={minTenure}
                onChange={(e) => setMinTenure(e.target.value)}
                className="mt-1"
                placeholder="6"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isInternalOnly ? (
                  <ToggleRight className="h-5 w-5 text-blue-600 cursor-pointer" onClick={() => setIsInternalOnly(false)} />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground cursor-pointer" onClick={() => setIsInternalOnly(true)} />
                )}
                <span className="text-sm">{it.isInternalOnly}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notifyEmployees ? (
                  <ToggleRight className="h-5 w-5 text-blue-600 cursor-pointer" onClick={() => setNotifyEmployees(false)} />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground cursor-pointer" onClick={() => setNotifyEmployees(true)} />
                )}
                <span className="text-sm">{it.notifyEmployees}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{it.internalNotes}</label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder={it.internalNotesPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-gradient-to-r bg-blue-600 text-white"
              onClick={handleCreate}
            >
              {it.createPosting}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posting Detail / Applications Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              {selectedPosting?.jobTitle} — {it.applications}
            </DialogTitle>
          </DialogHeader>
          {selectedPosting && (
            <div className="space-y-4 py-2">
              {/* Posting Info */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">{it.department}:</span>
                      <span className="font-medium">{selectedPosting.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">{it.location}:</span>
                      <span className="font-medium">{selectedPosting.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">{it.minTenure}:</span>
                      <span className="font-medium">{selectedPosting.minTenureMonths} {it.tenureMonths}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">{it.applications}:</span>
                      <span className="font-medium">{postingApplications.length}</span>
                    </div>
                  </div>
                  {selectedPosting.internalNotes && (
                    <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3 inline me-1" />
                      {selectedPosting.internalNotes}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Applications List */}
              {postingApplications.length > 0 ? (
                <div className="space-y-2">
                  {postingApplications.map(app => (
                    <Card key={app.id} className="border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                                {getInitials(app.applicantName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{app.applicantName}</p>
                              <p className="text-[10px] text-muted-foreground">{app.currentRole}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.managerApproved === null && app.status === 'PENDING' && (
                              <>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => handleApprove(app.id, 'approve')}>
                                  <CheckCircle2 className="h-3 w-3 me-1" /> {it.approve}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleApprove(app.id, 'reject')}>
                                  <XCircle className="h-3 w-3 me-1" /> {it.rejectBtn}
                                </Button>
                              </>
                            )}
                            <Badge className={cn('text-[10px]', statusColors[app.status] || '')}>
                              {statusLabels[app.status] || app.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">{it.noApplications}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
