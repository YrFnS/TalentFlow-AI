// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  MessageSquare,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type AppStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedAt: string;
  status: AppStatus;
  matchScore: number;
  timeline: { status: string; date: string; note?: string }[];
}

const statusConfig: Record<AppStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  APPLIED: { label: 'Applied', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-950', icon: Send },
  SCREENING: { label: 'Screening', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950', icon: Eye },
  INTERVIEW: { label: 'Interview', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950', icon: Calendar },
  OFFERED: { label: 'Offered', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-950', icon: CheckCircle2 },
  HIRED: { label: 'Hired', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-950', icon: AlertCircle },
};

export default function MyApplicationsPage() {
  const { t } = useI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [withdrawDialog, setWithdrawDialog] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/candidate/applications');
        if (res.ok) {
          const data = await res.json();
          setApplications(data.map((app: any) => ({
            id: app.id,
            jobTitle: app.jobTitle || app.job?.title || '',
            company: app.company || app.job?.company?.name || '',
            location: app.location || app.job?.location || '',
            appliedAt: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '',
            status: app.status as AppStatus,
            matchScore: app.matchScore || 0,
            timeline: app.timeline || [{ status: 'APPLIED', date: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '', note: 'Application submitted' }],
          })));
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter((app) => app.status === statusFilter);

  const statusCounts = applications.reduce((counts, app) => {
    counts[app.status] = (counts[app.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const handleWithdraw = (appId: string) => {
    setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'WITHDRAWN' as AppStatus } : app));
    setWithdrawDialog(null);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.candidate.myApplications}</h1>
          <p className="text-muted-foreground mt-1">Track and manage your job applications</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder={t.candidate.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.candidate.allStatuses} ({applications.length})</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label} ({statusCounts[key] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Overview */}
      {applications.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {Object.entries(statusConfig).slice(0, 6).map(([key, config]) => {
            const count = applications.filter(a => a.status === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                  statusFilter === key
                    ? `${config.bgColor} border-current ${config.color}`
                    : 'border-border hover:border-muted-foreground/30 bg-card'
                }`}
              >
                <span className={`text-lg font-bold ${config.color}`}>{count}</span>
                <span className="text-[10px] font-medium text-muted-foreground">{config.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">{applications.length === 0 ? 'No applications yet' : t.candidate.noApplications}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {applications.length === 0 ? 'Start applying to jobs to track your progress here.' : 'No applications match this filter.'}
            </p>
            {applications.length === 0 && (
              <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href="/candidate/jobs">{t.candidate.searchJobs}</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const config = statusConfig[app.status];
            const isExpanded = expandedApp === app.id;
            const canWithdraw = !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(app.status);

            return (
              <Card key={app.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <button
                    className="w-full p-5 text-left flex items-start gap-4"
                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                  >
                    <Avatar className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded-lg">
                        {app.company.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">{app.jobTitle}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {app.company}
                            <span className="mx-1">•</span>
                            <MapPin className="h-3 w-3" />
                            {app.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`${config.bgColor} ${config.color} border-0 text-xs font-medium`}>
                            {config.label}
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          Applied {app.appliedAt}
                        </span>
                        {app.matchScore > 0 && (
                          <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                            {app.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && app.timeline.length > 0 && (
                    <div className="px-5 pb-5 border-t">
                      <h4 className="font-medium text-sm mt-4 mb-3">{t.candidate.timeline}</h4>
                      <div className="relative pl-6">
                        {app.timeline.map((event, index) => {
                          const eventConfig = statusConfig[event.status as AppStatus] || statusConfig.APPLIED;
                          const isLast = index === app.timeline.length - 1;
                          return (
                            <div key={index} className="relative pb-4 last:pb-0">
                              {!isLast && <div className="absolute left-[-18px] top-2 bottom-0 w-px bg-border" />}
                              <div className={`absolute left-[-22px] top-1 h-3 w-3 rounded-full border-2 ${eventConfig.bgColor} border-background`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${eventConfig.color}`}>{eventConfig.label}</span>
                                  <span className="text-xs text-muted-foreground">{event.date}</span>
                                </div>
                                {event.note && <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {canWithdraw && (
                        <div className="mt-4 pt-3 border-t flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setWithdrawDialog(app.id); }}
                          >
                            {t.candidate.withdraw}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={!!withdrawDialog} onOpenChange={() => setWithdrawDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.candidate.withdraw}</DialogTitle>
            <DialogDescription>{t.candidate.withdrawConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => withdrawDialog && handleWithdraw(withdrawDialog)}>{t.candidate.withdraw}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
