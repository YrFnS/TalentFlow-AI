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

const gradientConfigs = [
  { gradient: 'from-teal-500 to-emerald-600', icon: Send, key: 'applicationsSent', value: 0, trend: 0, trendDir: 'up' as const },
  { gradient: 'from-emerald-500 to-cyan-600', icon: Calendar, key: 'interviewsScheduled', value: 0, trend: 0, trendDir: 'up' as const },
  { gradient: 'from-amber-500 to-orange-600', icon: Bookmark, key: 'savedJobs', value: 0, trend: 0, trendDir: 'down' as const },
  { gradient: 'from-cyan-500 to-teal-600', icon: Eye, key: 'profileViews', value: 0, trend: 0, trendDir: 'up' as const },
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

const applicationPipeline: { statusKey: string; count: number; gradient: string }[] = [];

const recentActivity: { type: string; title: string; company: string; time: string; icon: typeof Send; color: string }[] = [];

const profileSteps: { label: string; done: boolean }[] = [];

const applicationTimeline: { id: string; date: string; title: string; status: string; description: string }[] = [];

const timelineStatusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  applied: { color: 'bg-teal-500', icon: Send, label: 'Applied' },
  screening: { color: 'bg-cyan-500', icon: FileText, label: 'Screening' },
  interview: { color: 'bg-amber-500', icon: Calendar, label: 'Interview' },
  offered: { color: 'bg-emerald-500', icon: Award, label: 'Offered' },
  rejected: { color: 'bg-red-500', icon: XIcon, label: 'Rejected' },
  viewed: { color: 'bg-violet-500', icon: Eye, label: 'Viewed' },
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
  High: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
        stroke="url(#skillGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="skillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
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

  // Auto-refresh timestamp every 30 seconds
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight heading-glow">
            {t.candidate.welcomeBack} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">
              {t.candidate.recentActivity} — {t.dashboard.overview}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{t.dashboardEnhanced?.lastUpdated || 'Last updated'}: {lastUpdated.toLocaleTimeString()}</span>
              <RefreshCw className={`h-3 w-3 cursor-pointer hover:text-teal-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} onClick={handleRefresh} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30">
            <Link href="/candidate/profile">
              <User className="h-4 w-4" />
              {t.candidate.updateProfile}
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
            <Link href="/candidate/jobs">
              <Search className="h-4 w-4" />
              {t.candidate.searchJobs}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards with Trend Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {gradientConfigs.map((stat, i) => {
          const Icon = stat.icon;
          const sparklines = [
            'M0,20 L5,16 L10,18 L15,12 L20,14 L25,8 L30,10 L35,4 L40,6',
            'M0,18 L5,14 L10,16 L15,10 L20,12 L25,6 L30,8 L35,2 L40,4',
            'M0,22 L5,18 L10,20 L15,14 L20,16 L25,10 L30,12 L35,8 L40,6',
            'M0,16 L5,12 L10,14 L15,8 L20,6 L25,10 L30,4 L35,6 L40,2',
          ];
          return (
            <Card key={stat.key} className="card-tilt card-click-ripple relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group gradient-border-animated stat-card-shine animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {statLabelMap[stat.key]}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="mt-1.5 flex items-center gap-1 trend-indicator">
                      {stat.trendDir === 'up' ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">↑ {stat.trend}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">↓ {Math.abs(stat.trend)}%</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">{t.admin.fromLastMonth}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <svg width="60" height="24" viewBox="0 0 40 24" className="opacity-50 group-hover:opacity-80 transition-opacity">
                      <path d={sparklines[i]} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t.dashboardEnhanced?.applicationTimeline || 'Application Timeline'}</CardTitle>
                  <CardDescription className="text-xs">{t.dashboardEnhanced?.applicationTimelineDesc || 'Track your application journey'}</CardDescription>
                </div>
                <Link href="/candidate/applications">
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 text-xs">
                    {t.common.viewAll}
                    <ArrowRight className="h-3 w-3 ms-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute start-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-teal-500 via-emerald-500 to-muted" />
                <div className="space-y-4">
                  {applicationTimeline.map((item, idx) => {
                    const statusCfg = timelineStatusConfig[item.status] || timelineStatusConfig.applied;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <div
                        key={item.id}
                        className="relative flex items-start gap-4 ms-1 animate-fade-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {/* Timeline dot */}
                        <div className={`timeline-dot relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${statusCfg.color} text-white shadow-md`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.title}</p>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusCfg.color === 'bg-teal-500' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : statusCfg.color === 'bg-amber-500' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : statusCfg.color === 'bg-cyan-500' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : statusCfg.color === 'bg-emerald-500' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : statusCfg.color === 'bg-violet-500' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t.candidate.recommendedJobs}</CardTitle>
                  <CardDescription className="text-xs">Based on your profile and preferences</CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 animate-shimmer-slow text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 hover-lift"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-semibold rounded-lg">
                        {job.company.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate group-hover:text-teal-600 transition-colors">{job.title}</h3>
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
                    <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-0">
                      {job.salary}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950 px-2 py-0.5">
                        <Star className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{job.match}%</span>
                      </div>
                      <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white" asChild>
                        <Link href="/candidate/jobs">{t.candidate.quickApply}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/candidate/jobs" className="block mt-2">
                <Button variant="ghost" size="sm" className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-xs">
                  {t.dashboardEnhanced?.viewAllJobs || 'View All Jobs'} →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.candidate.recentActivity}</CardTitle>
                <Link href="/candidate/applications">
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 text-xs">
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors hover-lift"
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
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/10 dark:to-emerald-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t.candidate.applicationStatus}</CardTitle>
              <CardDescription className="text-xs">Mini pipeline overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applicationPipeline.map((stage, i) => {
                  const total = applicationPipeline.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${stage.gradient}`} />
                      <span className="text-sm flex-1">{pipelineLabelMap[stage.statusKey] || stage.statusKey}</span>
                      <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {stage.count}
                      </Badge>
                    </div>
                  );
                })}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Total Active</span>
                    <span className="font-semibold">10</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Skills to Learn */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t.dashboardEnhanced?.recommendedSkills || 'Recommended Skills'}</CardTitle>
                  <CardDescription className="text-xs">{t.dashboardEnhanced?.recommendedSkillsDesc || 'Skills to boost your career'}</CardDescription>
                </div>
                <Link href="/candidate/skills">
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 text-xs">
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
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors hover-lift animate-fade-in"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="shrink-0 relative">
                      <ProgressArcSVG percent={skill.match} size={44} strokeWidth={3.5} />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-teal-600 dark:text-teal-400">
                        {skill.match}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{skill.name}</p>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${demandColors[skill.demand]}`}>
                          {skill.demand}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.dashboardEnhanced?.matchToProfile || 'Match to your profile'}</p>
                    </div>
                  </div>
                ))}
                <Link href="/candidate/skills" className="block">
                  <Button variant="outline" size="sm" className="w-full mt-2 gap-2 border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30">
                    <BookOpen className="h-4 w-4" />
                    {t.dashboardEnhanced?.startLearning || 'Start Learning'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.dashboardEnhanced?.upcomingEvents || 'Upcoming Events'}</CardTitle>
                <Link href="/candidate/interview-prep">
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 text-xs">
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
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors hover-lift animate-fade-in"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 border border-teal-200/50 dark:border-teal-800/50">
                      <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{event.title}</p>
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
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.candidate.profileCompleteness}</CardTitle>
                <div className="flex items-center gap-1 bg-teal-100 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
                  <Target className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">65%</span>
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
                      stroke="url(#profileGrad)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${65 * 3.14} ${100 * 3.14}`}
                      className="transition-all duration-1000 ease-out"
                      style={{ animationDelay: '0.5s' }}
                    />
                    <defs>
                      <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <Progress value={65} className="h-2.5" />
                <div className="space-y-2 mt-3">
                  {profileSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={step.done ? '' : 'text-muted-foreground'}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="sm" className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
                  <Link href="/candidate/profile">{t.candidate.updateProfile}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t.candidate.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-300 dark:hover:border-teal-700" size="sm">
                <Link href="/candidate/jobs">
                  <Search className="h-4 w-4 text-teal-600" />
                  <span>{t.candidate.searchJobs}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700" size="sm">
                <Link href="/candidate/profile">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>{t.candidate.updateProfile}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 dark:hover:border-cyan-700" size="sm">
                <Link href="/candidate/ai-tools">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
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
