// @ts-nocheck
'use client'

import React, { useState, useMemo, useEffect } from 'react';
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
  Withdraw,
  List,
  GitBranch,
  LayoutGrid,
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
import { cn } from '@/lib/utils';

type AppStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedAt: string;
  status: AppStatus;
  matchScore: number;
  timeline: { status: AppStatus; date: string; note?: string }[];
}



const statusConfig: Record<AppStatus, { label: string; color: string; bgColor: string; icon: React.ElementType; timelineColor: string }> = {
  APPLIED: { label: 'Applied', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-950', icon: Send, timelineColor: 'bg-gray-400' },
  SCREENING: { label: 'Screening', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-950', icon: Eye, timelineColor: 'bg-amber-500' },
  INTERVIEW: { label: 'Interview', color: 'text-blue-700', bgColor: 'bg-teal-100 dark:bg-teal-950', icon: Calendar, timelineColor: 'bg-slate-500' },
  OFFERED: { label: 'Offered', color: 'text-emerald-700', bgColor: 'bg-emerald-100 dark:bg-emerald-950', icon: CheckCircle2, timelineColor: 'bg-emerald-500' },
  HIRED: { label: 'Hired', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950', icon: CheckCircle2, timelineColor: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-950', icon: XCircle, timelineColor: 'bg-red-500' },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-950', icon: AlertCircle, timelineColor: 'bg-gray-400' },
};

const kanbanColumns: AppStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'REJECTED'];

type ViewMode = 'list' | 'timeline' | 'kanban';

export default function MyApplicationsPage() {
  const { t } = useI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [withdrawDialog, setWithdrawDialog] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/candidate/applications');
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchApplications();
  }, []);

  const filteredApps = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [statusFilter, applications]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleWithdraw = (appId: string) => {
    setWithdrawDialog(null);
  };

  // Timeline View
  const renderTimelineView = () => (
    <div className="relative">
      {/* Vertical gradient line */}
      <div className="absolute start-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-emerald-400 to-cyan-300 opacity-30" />
      
      <div className="space-y-6">
        {filteredApps.map((app, index) => {
          const config = statusConfig[app.status];
          const canWithdraw = !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(app.status);
          
          return (
            <div key={app.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* Timeline Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center timeline-dot shadow-sm',
                  config.bgColor
                )}>
                  <config.icon className={cn('w-4 h-4', config.color)} />
                </div>
              </div>
              
              {/* Content */}
              <Card className="flex-1 border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-7 w-7 shrink-0 rounded-md bg-emerald-50 dark:bg-emerald-950">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-semibold rounded-md">
                            {app.company.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm">{app.jobTitle}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {app.company}
                        <span className="mx-1">•</span>
                        <MapPin className="h-3 w-3" />
                        {app.location}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          Applied {app.appliedAt}
                        </span>
                        <span className="flex items-center gap-0.5 font-medium text-emerald-600">
                          {app.matchScore}% match
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn('border-0 text-xs font-medium', config.bgColor, config.color)}>
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{app.timeline[app.timeline.length - 1]?.date}</span>
                    </div>
                  </div>
                  
                  {/* Mini Timeline */}
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t">
                    {app.timeline.map((event, i) => {
                      const eConfig = statusConfig[event.status];
                      return (
                        <React.Fragment key={i}>
                          {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground/30" />}
                          <div className={cn('w-2 h-2 rounded-full', eConfig.timelineColor)} title={eConfig.label} />
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  {canWithdraw && (
                    <div className="mt-3 pt-2 border-t flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWithdrawDialog(app.id);
                        }}
                      >
                        {t.candidate.withdraw}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Kanban View
  const renderKanbanView = () => (
    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
      {kanbanColumns.map((status) => {
        const config = statusConfig[status];
        const columnApps = filteredApps.filter(app => app.status === status);
        
        return (
          <div key={status} className="min-w-[260px] w-[260px] flex-shrink-0">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={cn('w-3 h-3 rounded-full', config.timelineColor)} />
              <h3 className="text-sm font-semibold flex-1">{config.label}</h3>
              <Badge className="text-[10px] px-2 py-0 h-5 font-semibold" style={{ backgroundColor: config.timelineColor, color: 'white' }}>
                {columnApps.length}
              </Badge>
            </div>
            
            {/* Cards */}
            <div className="space-y-2 min-h-[120px] p-2 rounded-lg bg-muted/30 border-2 border-dashed border-slate-200/40/40">
              {columnApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/50 gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300/50/50 flex items-center justify-center">
                    <FileText className="w-3 h-3 text-blue-400/60" />
                  </div>
                  <p className="text-[10px] font-medium text-blue-600/60/60">{t.appView?.noApps || 'No applications'}</p>
                </div>
              ) : (
                columnApps.map((app) => (
                  <div key={app.id} className="p-3 rounded-lg border border-border/50 bg-card hover:shadow-md transition-all animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="w-7 h-7 shrink-0 rounded-md">
                        <AvatarFallback className={cn('text-[9px] font-semibold rounded-md', config.bgColor, config.color)}>
                          {app.company.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{app.jobTitle}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{app.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        {app.appliedAt}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-600">
                        {app.matchScore}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // List View
  const renderListView = () => (
    <div className="space-y-3">
      {filteredApps.map((app) => {
        const config = statusConfig[app.status];
        const isExpanded = expandedApp === app.id;
        const canWithdraw = !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(app.status);

        return (
          <Card key={app.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {/* Main Row */}
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
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      Applied {app.appliedAt}
                    </span>
                    <span className="flex items-center gap-0.5 font-medium text-emerald-600">
                      {app.matchScore}% match
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded Timeline */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t">
                  <h4 className="font-medium text-sm mt-4 mb-3">{t.candidate.timeline}</h4>
                  <div className="relative pl-6">
                    {app.timeline.map((event, index) => {
                      const eventConfig = statusConfig[event.status];
                      const isLast = index === app.timeline.length - 1;
                      return (
                        <div key={index} className="relative pb-4 last:pb-0">
                          {/* Line */}
                          {!isLast && (
                            <div className="absolute left-[-18px] top-2 bottom-0 w-px bg-border" />
                          )}
                          {/* Dot */}
                          <div className={`absolute left-[-22px] top-1 h-3 w-3 rounded-full border-2 ${eventConfig.bgColor} border-background timeline-dot`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${eventConfig.color}`}>
                                {eventConfig.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{event.date}</span>
                            </div>
                            {event.note && (
                              <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>
                            )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setWithdrawDialog(app.id);
                        }}
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
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.candidate.myApplications}</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your job applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder={t.candidate.filterByStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t.candidate.allStatuses} ({statusCounts.all || 0})
              </SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label} ({statusCounts[key] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 rounded-e-none gap-1.5 text-xs"
            onClick={() => setViewMode('list')}
          >
            <List className="w-3.5 h-3.5" />
            {t.appView?.list || 'List'}
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 rounded-none gap-1.5 text-xs"
            onClick={() => setViewMode('timeline')}
          >
            <Clock className="w-3.5 h-3.5" />
            {t.appView?.timeline || 'Timeline'}
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 rounded-s-none gap-1.5 text-xs"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t.appView?.kanban || 'Kanban'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
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

      {/* Content */}
      {filteredApps.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">{t.candidate.noApplications}</h3>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <a href="/candidate/jobs">{t.candidate.searchJobs}</a>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        renderTimelineView()
      ) : viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        renderListView()
      )}

      {/* Withdraw Dialog */}
      <Dialog open={!!withdrawDialog} onOpenChange={() => setWithdrawDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.candidate.withdraw}</DialogTitle>
            <DialogDescription>
              {t.candidate.withdrawConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => withdrawDialog && handleWithdraw(withdrawDialog)}
            >
              {t.candidate.withdraw}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
