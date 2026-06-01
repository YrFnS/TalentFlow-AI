// @ts-nocheck
'use client';

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
  Sparkles,
  Clock,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';


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

const emptyData: DashboardData = {
  stats: { activeJobs: 0, totalApplications: 0, interviewsToday: 0, hiredThisMonth: 0 },
  trend: [],
  funnel: [],
  recentApplications: [],
  jobsByStatus: [],
};

const funnelColors = ['#2563eb', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

const statusColors: Record<string, string> = {
  APPLIED: 'bg-slate-100 text-slate-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFERED: 'bg-violet-100 text-violet-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const hiringTimelineData: { week: string; hired: number; interviews: number }[] = [];

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
          <stop offset="0%" stopColor="rgb(37, 99, 235)" stopOpacity={0.15} />
          <stop offset="100%" stopColor="rgb(37, 99, 235)" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
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
      {/* Grid lines */}
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
      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + (i + 0.5) * groupWidth;
        return (
          <text key={i} x={x} y={height - 5} textAnchor="middle" fontSize="3" fill="currentColor" opacity={0.5}>{label}</text>
        );
      })}
    </svg>
  );
}

const statCardConfigs = [
  { icon: Briefcase, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: FileText, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: Video, bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
  { icon: UserCheck, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
];

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

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

  const statCards = [
    {
      title: t.dashboard.activeJobs,
      value: data.stats.activeJobs,
      icon: Briefcase,
      trend: '',
      trendLabel: '',
      config: statCardConfigs[0],
    },
    {
      title: t.dashboard.totalApplications,
      value: data.stats.totalApplications,
      icon: FileText,
      trend: '',
      trendLabel: '',
      config: statCardConfigs[1],
    },
    {
      title: t.dashboard.interviewsToday,
      value: data.stats.interviewsToday,
      icon: Video,
      trend: '',
      trendLabel: '',
      config: statCardConfigs[2],
    },
    {
      title: t.dashboard.hiredThisMonth,
      value: data.stats.hiredThisMonth,
      icon: UserCheck,
      trend: '',
      trendLabel: '',
      config: statCardConfigs[3],
    },
  ];

  const maxFunnel = Math.max(...data.funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.dashboard.welcome}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.dashboard.overview}</p>
        </div>
        <div className="flex items-center gap-2">
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
          return (
            <Card key={i} className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
                    {card.trend && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">{card.trend}</span>
                        <span className="text-xs text-slate-500">{card.trendLabel}</span>
                      </div>
                    )}
                  </div>
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.config.bgColor)}>
                    <Icon className={cn('w-5 h-5', card.config.iconColor)} />
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
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">{t.dashboard.applicationTrend}</CardTitle>
                <CardDescription className="text-xs text-slate-500">Last 7 days</CardDescription>
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
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">{t.dashboard.hiringFunnel}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
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
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">{stageLabels[item.stage] || item.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{conversionFromPrev}%</span>
                        <span className="text-xs font-semibold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: funnelColors[index] || '#2563eb',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {data.funnel.length >= 2 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Conversion Rate</span>
                    <span className="text-xs font-semibold text-blue-600">
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Applications */}
        <Card className="lg:col-span-2 border-slate-200">
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
              {data.recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="mt-4 text-slate-500">No recent applications</p>
                  <p className="text-sm text-slate-400 mt-1">Applications will appear here when candidates apply</p>
                </div>
              ) : (
                data.recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hiring Timeline */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Hiring Timeline</CardTitle>
            <CardDescription className="text-xs text-slate-500">Weekly hiring & interview activity</CardDescription>
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
          <Card className="h-full hover:shadow-md transition-colors cursor-pointer border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.postJob}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/pipeline" className="block">
          <Card className="h-full hover:shadow-md transition-colors cursor-pointer border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <GitBranch className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.viewPipeline}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/interviews" className="block">
          <Card className="h-full hover:shadow-md transition-colors cursor-pointer border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700">{t.dashboard.scheduleInterview}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/team" className="block">
          <Card className="h-full hover:shadow-md transition-colors cursor-pointer border-dashed border-slate-300">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
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
