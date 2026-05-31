// @ts-nocheck
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  FileText,
  Video,
  UserCheck,
  TrendingUp,
  Plus,
  Calendar,
  GitBranch,
  ArrowUpRight,
  Clock,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';


interface DashboardData {
  stats: {
    activeJobs: number;
    totalApplications: number;
    interviewsToday: number;
    hiredThisMonth: number;
  };
  trend: { date: string; applications: number }[];
  funnel: { stage: string; count: number }[];
  recentApplications: Array<{
    id: string;
    status: string;
    matchScore: number | null;
    appliedAt: string;
    candidate: {
      user: { name: string; email: string };
    };
    job: { title: string };
  }>;
  jobsByStatus: Array<{ status: string; _count: number }>;
}

const defaultData: DashboardData = {
  stats: { activeJobs: 0, totalApplications: 0, interviewsToday: 0, hiredThisMonth: 0 },
  trend: [],
  funnel: [],
  recentApplications: [],
  jobsByStatus: [],
};

const funnelColors = ['#2563eb', '#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981'];

const statusColors: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-sky-100 text-sky-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFERED: 'bg-violet-100 text-violet-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const hiringTimelineData: { week: string; hired: number; interviews: number }[] = [];

const upcomingInterviews: { id: string; candidate: string; role: string; date: string; time: string; interviewer: string; type: string }[] = [];

const teamMembers: { id: string; name: string; initials: string; hiresThisMonth: number; openPositions: number; target: number }[] = [];

const interviewTypeColors: Record<string, string> = {
  Technical: 'bg-blue-100 text-blue-700',
  Cultural: 'bg-violet-100 text-violet-700',
  Final: 'bg-emerald-100 text-emerald-700',
};

function SimpleAreaChart({ data, height = 260, gradientId = 'areaGrad' }: { data: number[]; height?: number; gradientId?: string }) {
  const width = 100;
  const padding = { top: 10, right: 5, bottom: 25, left: 5 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `${padding.left},${padding.top + chartH} ${points} ${padding.left + chartW},${padding.top + chartH}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(37, 99, 235)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="rgb(37, 99, 235)" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />;
      })}
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke="rgb(37, 99, 235)" strokeWidth={0.8} />
    </svg>
  );
}

function SimpleGroupedBarChart({ data, labels, series, height = 220 }: { data: Record<string, number>[]; labels: string[]; series: { key: string; color: string }[]; height?: number }) {
  const width = 100;
  const padding = { top: 10, right: 5, bottom: 20, left: 5 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const allValues = data.flatMap(d => series.map(s => d[s.key]));
  const max = Math.max(...allValues, 1);
  const groupWidth = chartW / data.length;
  const barWidth = groupWidth * 0.6 / series.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />;
      })}
      {data.map((d, i) => {
        const groupX = padding.left + i * groupWidth;
        return series.map((s, si) => {
          const barH = (d[s.key] / max) * chartH;
          const x = groupX + groupWidth * 0.2 + si * barWidth;
          return (
            <rect key={`${i}-${si}`} x={x} y={padding.top + chartH - barH} width={barWidth} height={barH}
              rx="0.5" fill={s.color} opacity="0.85" />
          );
        });
      })}
      {labels.map((label, i) => {
        const x = padding.left + (i + 0.5) * groupWidth;
        return (
          <text key={i} x={x} y={height - 5} textAnchor="middle" fontSize="3" fill="currentColor" opacity={0.5}>{label}</text>
        );
      })}
    </svg>
  );
}

const iconBgColors: { bg: string; text: string }[] = [
  { bg: 'bg-blue-600', text: 'text-white' },
  { bg: 'bg-sky-600', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      const seedData = await seedRes.json();
      const companyId = seedData.companyId;

      if (companyId) {
        const res = await fetch(`/api/dashboard?companyId=${companyId}`);
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  const statCards = [
    {
      title: t.dashboard.activeJobs,
      value: data.stats.activeJobs,
      icon: Briefcase,
      trend: '+2',
      trendPercent: 12.5,
      trendLabel: t.admin.fromLastMonth,
      iconStyle: iconBgColors[0],
    },
    {
      title: t.dashboard.totalApplications,
      value: data.stats.totalApplications,
      icon: FileText,
      trend: '+12',
      trendPercent: 18.2,
      trendLabel: t.admin.fromLastMonth,
      iconStyle: iconBgColors[1],
    },
    {
      title: t.dashboard.interviewsToday,
      value: data.stats.interviewsToday,
      icon: Video,
      trend: '+1',
      trendPercent: 8.3,
      trendLabel: t.admin.fromLastMonth,
      iconStyle: iconBgColors[2],
    },
    {
      title: t.dashboard.hiredThisMonth,
      value: data.stats.hiredThisMonth,
      icon: UserCheck,
      trend: '+1',
      trendPercent: 25.0,
      trendLabel: t.admin.fromLastMonth,
      iconStyle: iconBgColors[3],
    },
  ];

  const maxFunnel = Math.max(...data.funnel.map(f => f.count), 1);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.dashboard.welcome} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">{t.dashboard.overview}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="h-3 w-3" />
            <span>{t.dashboardEnhanced?.lastUpdated || 'Last updated'}: {lastUpdated.toLocaleTimeString()}</span>
            <RefreshCw className={`h-3 w-3 cursor-pointer hover:text-blue-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} onClick={handleRefresh} />
          </div>
          <Link href="/company/jobs/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
              <Plus className="w-4 h-4 me-2" />
              {t.dashboard.postJob}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const sparklines = [
            'M0,20 L5,16 L10,18 L15,12 L20,14 L25,8 L30,10 L35,4 L40,6',
            'M0,18 L5,14 L10,16 L15,10 L20,12 L25,6 L30,8 L35,2 L40,4',
            'M0,22 L5,18 L10,20 L15,14 L20,16 L25,10 L30,12 L35,8 L40,6',
            'M0,16 L5,12 L10,14 L15,8 L20,6 L25,10 L30,4 L35,6 L40,2',
          ];
          return (
            <Card key={i} className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in">
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">↑ {card.trendPercent}%</span>
                      <span className="text-xs text-slate-400">{card.trendLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.iconStyle.bg, card.iconStyle.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <svg width="60" height="24" viewBox="0 0 40 24" className="opacity-50 transition-opacity">
                      <path d={sparklines[i]} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Application Trend */}
        <Card className="lg:col-span-2 border border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">{t.dashboard.applicationTrend}</CardTitle>
                <CardDescription className="text-xs">Last 7 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px] w-full">
              <SimpleAreaChart
                data={data.trend.map(d => d.applications)}
                height={260}
                gradientId="companyAppsGrad"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hiring Funnel */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">{t.dashboard.hiringFunnel}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {data.funnel.map((item, index) => {
                const percentage = maxFunnel > 0 ? (item.count / maxFunnel) * 100 : 0;
                const conversionFromPrev = index > 0 && data.funnel[index - 1].count > 0
                  ? Math.round((item.count / data.funnel[index - 1].count) * 100)
                  : 100;
                const stageLabels: Record<string, string> = {
                  APPLIED: t.applications.applied,
                  SCREENING: t.applications.screening,
                  INTERVIEW: t.applications.interview,
                  OFFERED: t.applications.offered,
                  HIRED: t.applications.hired,
                };
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">{stageLabels[item.stage] || item.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{conversionFromPrev}%</span>
                        <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: funnelColors[index] || '#2563eb',
                        }}
                      />
                    </div>
                    {index < data.funnel.length - 1 && (
                      <div className="flex justify-center">
                        <div className="w-0.5 h-2 bg-gradient-to-b from-slate-300/40 to-transparent" />
                      </div>
                    )}
                  </div>
                );
              })}
              {data.funnel.length >= 2 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Conversion Rate</span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {data.funnel[0]?.count > 0
                        ? Math.round((data.funnel[data.funnel.length - 1]?.count / data.funnel[0].count) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Interviews */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">{t.dashboardEnhanced?.upcomingInterviews || 'Upcoming Interviews'}</CardTitle>
                <CardDescription className="text-xs">{t.dashboardEnhanced?.upcomingInterviewsDesc || 'Scheduled interviews this week'}</CardDescription>
              </div>
              <Link href="/company/interviews">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  {t.common.viewAll}
                  <ArrowUpRight className="w-3 h-3 ms-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {upcomingInterviews.map((interview, idx) => (
                <div
                  key={interview.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors animate-fade-in"
                >
                  <Avatar className="h-9 w-9 shrink-0 rounded-lg">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold rounded-lg">
                      {interview.candidate.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{interview.candidate}</p>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${interviewTypeColors[interview.type] || ''}`}>
                        {interview.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{interview.role}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {interview.date}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {interview.time}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {interview.interviewer}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">{t.dashboardEnhanced?.teamPerformance || 'Team Performance'}</CardTitle>
                <CardDescription className="text-xs">{t.dashboardEnhanced?.teamPerformanceDesc || 'Hiring progress by team member'}</CardDescription>
              </div>
              <Link href="/company/team">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  {t.common.viewAll}
                  <ArrowUpRight className="w-3 h-3 ms-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {teamMembers.map((member, idx) => {
                const progressPercent = Math.round((member.hiresThisMonth / member.target) * 100);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors animate-fade-in"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <UserCheck className="h-3 w-3 text-emerald-500" />
                            {member.hiresThisMonth} {t.dashboardEnhanced?.hires || 'hires'}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Briefcase className="h-3 w-3 text-blue-500" />
                            {member.openPositions} {t.dashboard.openPositions}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={progressPercent} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{progressPercent}% of target</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Applications */}
        <Card className="lg:col-span-2 border border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">{t.dashboard.recentActivity}</CardTitle>
              <Link href="/company/applications">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  {t.common.viewAll}
                  <ArrowUpRight className="w-3 h-3 ms-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors animate-fade-in"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {app.candidate.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{app.candidate.user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{app.job.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.matchScore && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                        <span className="text-xs font-medium text-blue-700">{app.matchScore}%</span>
                      </div>
                    )}
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusColors[app.status])}>
                      {app.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/company/applications" className="block mt-3">
              <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">
                {t.dashboardEnhanced?.viewAllApplications || 'View All Applications'} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Hiring Timeline */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Hiring Timeline</CardTitle>
            <CardDescription className="text-xs">Weekly hiring & interview activity</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              <SimpleGroupedBarChart
                data={hiringTimelineData}
                labels={hiringTimelineData.map(d => d.week)}
                series={[
                  { key: 'interviews', color: '#2563eb' },
                  { key: 'hired', color: '#10b981' },
                ]}
                height={220}
              />
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span className="text-xs text-slate-500">Interviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-slate-500">Hired</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/company/jobs/create" className="block">
          <Card className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer border border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.postJob}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/pipeline" className="block">
          <Card className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer border border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
                <GitBranch className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.viewPipeline}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/interviews" className="block">
          <Card className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer border border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.scheduleInterview}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/team" className="block">
          <Card className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer border border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.inviteTeam}</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
