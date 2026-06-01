// @ts-nocheck
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Send,
  Calendar,
  Bookmark,
  Eye,
  Search,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  CheckCircle2,
  FileText,
  Star,
  Briefcase,
  Target,
  Award,
  RefreshCw,
  BookOpen,
  Zap,
  Users,
  GraduationCap,
  CircleDot,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const statConfigs = [
  { icon: Send, key: 'applicationsSent', value: 0, trend: 0, trendDir: 'up' as const },
  { icon: Calendar, key: 'interviewsScheduled', value: 0, trend: 0, trendDir: 'up' as const },
  { icon: Bookmark, key: 'savedJobs', value: 0, trend: 0, trendDir: 'down' as const },
  { icon: Eye, key: 'profileViews', value: 0, trend: 0, trendDir: 'up' as const },
];

const recommendedJobs: {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  match: number;
  posted: string;
  skills: string[];
}[] = [];

const applicationPipeline: { statusKey: string; count: number }[] = [];

const recentActivity: { type: string; title: string; company: string; time: string; icon: typeof Send; color: string }[] = [];

const profileSteps: { label: string; done: boolean }[] = [];

const applicationTimeline: { id: string; date: string; title: string; status: string; description: string }[] = [];

const timelineStatusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  applied: { color: 'bg-blue-500', icon: Send, label: 'Applied' },
  screening: { color: 'bg-slate-500', icon: FileText, label: 'Screening' },
  interview: { color: 'bg-amber-500', icon: Calendar, label: 'Interview' },
  offered: { color: 'bg-emerald-500', icon: Award, label: 'Offered' },
  rejected: { color: 'bg-red-500', icon: XIcon, label: 'Rejected' },
  viewed: { color: 'bg-blue-400', icon: Eye, label: 'Viewed' },
};

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

const recommendedSkills: { id: string; name: string; demand: 'High' | 'Medium' | 'Low'; match: number; color: string }[] = [];

const demandColors: Record<string, string> = {
  High: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-red-100 text-red-700',
};

const upcomingEvents: { id: string; title: string; date: string; time: string; type: string; typeColor: string }[] = [];

function ProgressArcSVG({ percent, size = 48, strokeWidth = 4 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeOpacity={0.1} strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="#2563eb"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const { t, dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const statLabelMap: Record<string, string> = {
    applicationsSent: t.candidate.applicationsSent,
    interviewsScheduled: t.candidate.interviewsScheduled,
    savedJobs: t.candidate.savedJobs,
    profileViews: t.candidate.profileViews,
  };

  const pipelineLabelMap: Record<string, string> = {
    applied: t.candidate.applied,
    screening: t.candidate.screening,
    interview: t.candidate.interview,
    offered: t.candidate.offered,
    rejected: t.candidate.rejected,
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {t.candidate.welcomeBack} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">
              {t.candidate.recentActivity} — {t.dashboard.overview}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{t.dashboardEnhanced?.lastUpdated || 'Last updated'}: {lastUpdated.toLocaleTimeString()}</span>
              <RefreshCw className={`h-3 w-3 cursor-pointer hover:text-blue-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} onClick={handleRefresh} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
            <Link href="/candidate/profile">
              <User className="h-4 w-4" />
              {t.candidate.updateProfile}
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/candidate/jobs">
              <Search className="h-4 w-4" />
              {t.candidate.searchJobs}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards with Trend Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfigs.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {statLabelMap[stat.key]}
                    </p>
                    <p className="text-2xl font-bold mt-1 text-slate-900">{stat.value}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      {stat.trendDir === 'up' ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-emerald-600 font-medium">&uarr; {stat.trend}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">&darr; {Math.abs(stat.trend)}%</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">{t.admin.fromLastMonth}</span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Timeline */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{t.dashboardEnhanced?.applicationTimeline || 'Application Timeline'}</CardTitle>
                  <CardDescription className="text-xs">{t.dashboardEnhanced?.applicationTimelineDesc || 'Track your application journey'}</CardDescription>
                </div>
                <Link href="/candidate/applications">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs">
                    {t.common.viewAll}
                    <ArrowRight className="h-3 w-3 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute start-5 top-3 bottom-3 w-0.5 bg-slate-200" />
                <div className="space-y-4">
                  {applicationTimeline.map((item, idx) => {
                    const statusCfg = timelineStatusConfig[item.status] || timelineStatusConfig.applied;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <div
                        key={item.id}
                        className="relative flex items-start gap-4 ms-1"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${statusCfg.color} text-white shadow-sm`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusCfg.color === 'bg-blue-500' ? 'bg-blue-50 text-blue-700' : statusCfg.color === 'bg-amber-500' ? 'bg-amber-50 text-amber-700' : statusCfg.color === 'bg-slate-500' ? 'bg-slate-50 text-slate-700' : statusCfg.color === 'bg-emerald-500' ? 'bg-emerald-50 text-emerald-700' : statusCfg.color === 'bg-blue-400' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.date}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Jobs */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{t.candidate.recommendedJobs}</CardTitle>
                  <CardDescription className="text-xs">Based on your profile and preferences</CardDescription>
                </div>
                <Badge className="bg-blue-600 text-white border-0 text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-card hover:bg-accent/50 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                        {job.company.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{job.type}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {job.posted}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-700 border-0">
                      {job.salary}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-slate-700">{job.match}%</span>
                      </div>
                      <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" asChild>
                        <Link href="/candidate/jobs">{t.candidate.quickApply}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/candidate/jobs" className="block mt-2">
                <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">
                  {t.dashboardEnhanced?.viewAllJobs || 'View All Jobs'} &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">{t.candidate.recentActivity}</CardTitle>
                <Link href="/candidate/applications">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs">
                    {t.common.viewAll}
                    <ArrowRight className="h-3 w-3 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.company}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Application Status Pipeline */}
          <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">{t.candidate.applicationStatus}</CardTitle>
              <CardDescription className="text-xs">Mini pipeline overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applicationPipeline.map((stage, i) => {
                  const total = applicationPipeline.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${stage.statusKey === 'rejected' ? 'bg-red-400' : 'bg-blue-500'}`} />
                      <span className="text-sm flex-1">{pipelineLabelMap[stage.statusKey] || stage.statusKey}</span>
                      <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {stage.count}
                      </Badge>
                    </div>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Total Active</span>
                    <span className="font-semibold text-slate-900">10</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Skills to Learn */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{t.dashboardEnhanced?.recommendedSkills || 'Recommended Skills'}</CardTitle>
                  <CardDescription className="text-xs">{t.dashboardEnhanced?.recommendedSkillsDesc || 'Skills to boost your career'}</CardDescription>
                </div>
                <Link href="/candidate/skills">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs">
                    {t.common.viewAll}
                    <ArrowRight className="h-3 w-3 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendedSkills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="shrink-0 relative">
                      <ProgressArcSVG percent={skill.match} size={44} strokeWidth={3.5} />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-blue-600">
                        {skill.match}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-slate-900">{skill.name}</p>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${demandColors[skill.demand]}`}>
                          {skill.demand}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.dashboardEnhanced?.matchToProfile || 'Match to your profile'}</p>
                    </div>
                  </div>
                ))}
                <Link href="/candidate/skills" className="block">
                  <Button variant="outline" size="sm" className="w-full mt-2 gap-2 border-dashed border-slate-300 text-slate-700 hover:bg-slate-50">
                    <BookOpen className="h-4 w-4" />
                    {t.dashboardEnhanced?.startLearning || 'Start Learning'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">{t.dashboardEnhanced?.upcomingEvents || 'Upcoming Events'}</CardTitle>
                <Link href="/candidate/interview-prep">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs">
                    {t.common.viewAll}
                    <ArrowRight className="h-3 w-3 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-slate-900">{event.title}</p>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${event.typeColor}`}>
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{event.date}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Completeness */}
          <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">{t.candidate.profileCompleteness}</CardTitle>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Target className="h-3 w-3 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700">65%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                    <circle cx="60" cy="60" r="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" fill="none" />
                    <circle
                      cx="60" cy="60" r="50"
                      stroke="#2563eb"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${65 * 3.14} ${100 * 3.14}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
                <Progress value={65} className="h-2.5" />
                <div className="space-y-2 mt-3">
                  {profileSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={step.done ? '' : 'text-muted-foreground'}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/candidate/profile">{t.candidate.updateProfile}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">{t.candidate.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/jobs">
                  <Search className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.searchJobs}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/profile">
                  <User className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.updateProfile}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/ai-tools">
                  <Sparkles className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.aiResumeAnalysis}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
