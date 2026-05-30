// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  Search,
  Filter,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface InternalJobPosting {
  id: string;
  jobId: string;
  companyId: string;
  isInternalOnly: boolean;
  minTenureMonths: number;
  notifyEmployees: boolean;
  internalNotes: string | null;
  createdAt: string;
  jobTitle: string;
  department: string;
  location: string;
  applicationsCount: number;
}

interface MyApplication {
  id: string;
  jobId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  jobTitle: string;
  department: string;
  location: string;
  minTenureMonths: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  MANAGER_APPROVED: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  INTERVIEW: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0',
  OFFERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  HIRED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-0',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending Approval',
  MANAGER_APPROVED: 'Manager Approved',
  INTERVIEW: 'Interview Stage',
  OFFERED: 'Offer Extended',
  HIRED: 'Hired',
  REJECTED: 'Not Selected',
};

const departmentColors: Record<string, string> = {
  Engineering: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  Marketing: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Sales: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0',
  Product: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Design: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0',
};

// Mock data
const mockPostings: InternalJobPosting[] = [
  { id: 'ij-1', jobId: 'job-1', companyId: 'comp-1', isInternalOnly: true, minTenureMonths: 12, notifyEmployees: true, internalNotes: 'Priority for current engineering team', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), jobTitle: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', applicationsCount: 3 },
  { id: 'ij-2', jobId: 'job-2', companyId: 'comp-1', isInternalOnly: true, minTenureMonths: 6, notifyEmployees: true, internalNotes: null, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), jobTitle: 'Product Marketing Manager', department: 'Marketing', location: 'New York, NY', applicationsCount: 2 },
  { id: 'ij-3', jobId: 'job-3', companyId: 'comp-1', isInternalOnly: false, minTenureMonths: 18, notifyEmployees: false, internalNotes: null, createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), jobTitle: 'Sales Team Lead', department: 'Sales', location: 'San Francisco, CA', applicationsCount: 1 },
  { id: 'ij-4', jobId: 'job-4', companyId: 'comp-1', isInternalOnly: true, minTenureMonths: 6, notifyEmployees: true, internalNotes: null, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), jobTitle: 'Product Manager', department: 'Product', location: 'Austin, TX', applicationsCount: 2 },
  { id: 'ij-5', jobId: 'job-5', companyId: 'comp-1', isInternalOnly: true, minTenureMonths: 3, notifyEmployees: true, internalNotes: 'Great opportunity for junior designers', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), jobTitle: 'UX Designer', department: 'Design', location: 'Remote', applicationsCount: 0 },
];

const mockMyApplications: MyApplication[] = [
  { id: 'ia-1', jobId: 'job-1', status: 'MANAGER_APPROVED', notes: 'Strong candidate', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), jobTitle: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', minTenureMonths: 12 },
  { id: 'ia-4', jobId: 'job-2', status: 'INTERVIEW', notes: '', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), jobTitle: 'Product Marketing Manager', department: 'Marketing', location: 'New York, NY', minTenureMonths: 6 },
];

// Simulated user tenure (months at company)
const USER_TENURE_MONTHS = 14;

export default function CandidateInternalJobsContent() {
  const { t } = useI18n();
  const it = t.internalJobs as Record<string, string>;

  const [postings] = useState<InternalJobPosting[]>(mockPostings);
  const [myApplications, setMyApplications] = useState<MyApplication[]>(mockMyApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<InternalJobPosting | null>(null);
  const [motivationLetter, setMotivationLetter] = useState('');
  const [confirmManager, setConfirmManager] = useState(false);
  const [tab, setTab] = useState<'board' | 'applications'>('board');

  const departments = [...new Set(postings.map(p => p.department))];

  const filteredPostings = useMemo(() => {
    return postings.filter(p => {
      if (filterDept !== 'all' && p.department !== filterDept) return false;
      if (searchQuery && !p.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [postings, filterDept, searchQuery]);

  const appliedJobIds = useMemo(() => new Set(myApplications.map(a => a.jobId)), [myApplications]);

  const checkTenure = (minMonths: number) => USER_TENURE_MONTHS >= minMonths;

  const handleApply = () => {
    if (!selectedJob) return;
    if (!motivationLetter.trim()) {
      toast.error(it.motivationLetter);
      return;
    }
    if (!confirmManager) {
      toast.error(it.confirmManagerNotification);
      return;
    }

    const newApp: MyApplication = {
      id: `ia-${Date.now()}`,
      jobId: selectedJob.jobId,
      status: 'PENDING',
      notes: motivationLetter,
      createdAt: new Date().toISOString(),
      jobTitle: selectedJob.jobTitle,
      department: selectedJob.department,
      location: selectedJob.location,
      minTenureMonths: selectedJob.minTenureMonths,
    };
    setMyApplications(prev => [newApp, ...prev]);
    toast.success(it.applicationSubmitted);
    setApplyOpen(false);
    setMotivationLetter('');
    setConfirmManager(false);
    setSelectedJob(null);
  };

  const openApply = (job: InternalJobPosting) => {
    setSelectedJob(job);
    setApplyOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{it.title}</h1>
            <p className="text-sm text-muted-foreground">{it.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'board' ? 'bg-background text-teal-700 dark:text-teal-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTab('board')}
        >
          <Building2 className="h-4 w-4 inline me-1" />
          {it.browseOpenings}
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'applications' ? 'bg-background text-teal-700 dark:text-teal-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTab('applications')}
        >
          <FileText className="h-4 w-4 inline me-1" />
          {it.myApplications}
        </button>
      </div>

      {tab === 'board' && (
        <>
          {/* Eligibility Banner */}
          <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{it.eligibility}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.currentRole}: Frontend Developer • {USER_TENURE_MONTHS} {it.tenureMonths}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/50"
              />
            </div>
          </div>

          {/* Job Board Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPostings.map((posting) => {
              const tenureMet = checkTenure(posting.minTenureMonths);
              const alreadyApplied = appliedJobIds.has(posting.jobId);
              const daysAgo = Math.floor((Date.now() - new Date(posting.createdAt).getTime()) / 86400000);

              return (
                <Card key={posting.id} className="border-border/50 card-hover-lift">
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
                        <span>{it.minTenure}: {posting.minTenureMonths} {it.tenureMonths}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{daysAgo} {it.daysAgo}</span>
                      </div>

                      {/* Tenure indicator */}
                      <div className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                        tenureMet
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                      )}>
                        {tenureMet ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {tenureMet ? it.tenureMet : it.tenureNotMet}
                      </div>

                      {/* Apply button */}
                      {alreadyApplied ? (
                        <Button variant="outline" size="sm" className="w-full text-xs opacity-60" disabled>
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          Applied
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className={cn(
                            'w-full text-xs',
                            tenureMet
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          )}
                          disabled={!tenureMet}
                          onClick={() => openApply(posting)}
                        >
                          <ArrowRightLeft className="h-3 w-3 me-1" />
                          {it.applyInternally}
                        </Button>
                      )}
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
        </>
      )}

      {tab === 'applications' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              {it.myApplications}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {myApplications.length > 0 ? (
              <div className="space-y-3">
                {myApplications.map(app => (
                  <Card key={app.id} className="border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{app.jobTitle}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {app.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge className={cn('text-[10px]', statusColors[app.status] || '')}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </div>
                      {app.notes && (
                        <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                          {app.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{it.noApplications}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-teal-600" />
              {it.applyInternally}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-2">
              {/* Job Info */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="font-semibold">{selectedJob.jobTitle}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{selectedJob.department}</span>
                    <span>{selectedJob.location}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Current Role */}
              <div>
                <label className="text-sm font-medium">{it.currentRole}</label>
                <div className="mt-1 p-2 rounded-md bg-muted/50 text-sm text-muted-foreground">
                  Frontend Developer
                </div>
              </div>

              {/* Tenure Check */}
              <div className={cn(
                'flex items-center gap-2 p-2 rounded-md text-sm',
                checkTenure(selectedJob.minTenureMonths)
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
              )}>
                {checkTenure(selectedJob.minTenureMonths) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {checkTenure(selectedJob.minTenureMonths)
                  ? `${it.tenureMet} (${USER_TENURE_MONTHS} ${it.tenureMonths})`
                  : `${it.tenureNotMet} (${USER_TENURE_MONTHS}/${selectedJob.minTenureMonths} ${it.tenureMonths})`
                }
              </div>

              {/* Motivation Letter */}
              <div>
                <label className="text-sm font-medium">{it.motivationLetter}</label>
                <Textarea
                  value={motivationLetter}
                  onChange={(e) => setMotivationLetter(e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder={it.motivationLetterPlaceholder}
                />
              </div>

              {/* Manager Notification Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirmManager"
                  checked={confirmManager}
                  onChange={(e) => setConfirmManager(e.target.checked)}
                  className="mt-1 accent-teal-600"
                />
                <label htmlFor="confirmManager" className="text-sm text-muted-foreground">
                  {it.confirmManagerNotification}
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                <AlertCircle className="h-3.5 w-3.5" />
                {it.managerNotified}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
              onClick={handleApply}
            >
              <Send className="h-3.5 w-3.5 me-1" />
              {it.submitApplication}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
