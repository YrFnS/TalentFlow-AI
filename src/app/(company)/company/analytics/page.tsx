// @ts-nocheck
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Target,
  Briefcase,
  FileText,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


interface AnalyticsData {
  overview: {
    totalApplications: number;
    totalInterviews: number;
    totalHired: number;
    timeToHire: number;
    conversionRate: number;
    avgMatchScore: number;
  };
  applicationsTrend: Array<{
    date: string;
    applications: number;
    interviews: number;
    hired: number;
  }>;
  hiringFunnel: Array<{
    stage: string;
    count: number;
  }>;
  sourceBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topJobs: Array<{
    title: string;
    applications: number;
    interviews: number;
    hired: number;
    avgMatch: number;
  }>;
}

const defaultData: AnalyticsData = {
  overview: {
    totalApplications: 0,
    totalInterviews: 0,
    totalHired: 0,
    timeToHire: 0,
    conversionRate: 0,
    avgMatchScore: 0,
  },
  applicationsTrend: [],
  hiringFunnel: [],
  sourceBreakdown: [],
  topJobs: [],
};

function SimpleMultiAreaChart({ series, labels, height = 300 }: { series: { data: number[]; color: string; gradientId: string }[]; labels: string[]; height?: number }) {
  const width = 100;
  const padding = { top: 10, right: 5, bottom: 25, left: 5 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const allValues = series.flatMap(s => s.data);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        {series.map(s => (
          <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
          </linearGradient>
        ))}
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />;
      })}
      {/* Areas and lines */}
      {series.map(s => {
        const points = s.data.map((v, i) => {
          const x = padding.left + (i / (s.data.length - 1)) * chartW;
          const y = padding.top + chartH - ((v - min) / range) * chartH;
          return { x, y };
        });
        const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
        const areaPoints = `${padding.left},${padding.top + chartH} ${linePoints} ${padding.left + chartW},${padding.top + chartH}`;
        return (
          <g key={s.gradientId}>
            <polygon points={areaPoints} fill={`url(#${s.gradientId})`} />
            <polyline points={linePoints} fill="none" stroke={s.color} strokeWidth={0.8} />
          </g>
        );
      })}
      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 5} textAnchor="middle" fontSize="3" fill="currentColor" opacity={0.5}>{label}</text>
        );
      })}
    </svg>
  );
}

function SimpleHorizontalBarChart({ data, height = 280 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const width = 100;
  const padding = { top: 5, right: 10, bottom: 5, left: 25 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const barHeight = Math.min(chartH / data.length * 0.65, 8);
  const gap = chartH / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const x = padding.left + frac * chartW;
        return <line key={i} x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />;
      })}
      {data.map((d, i) => {
        const y = padding.top + i * gap + (gap - barHeight) / 2;
        const barW = (d.value / max) * chartW;
        return (
          <g key={i}>
            <text x={padding.left - 1} y={y + barHeight / 2} textAnchor="end" dominantBaseline="middle" fontSize="3" fill="currentColor" opacity={0.6}>{d.label}</text>
            <rect x={padding.left} y={y} width={barW} height={barHeight} rx="0.5" fill={d.color} opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

function SimpleDonutChart({ segments, centerLabel }: { segments: { value: number; color: string; label: string }[]; centerLabel?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 40;
  const cx = 50;
  const cy = 50;
  const innerRadius = radius * 0.6;
  const angles = segments.reduce<Array<{ start: number; end: number }>>((acc, seg) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const angle = (seg.value / total) * 360;
    acc.push({ start: prev, end: prev + angle });
    return acc;
  }, []);

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[220px] mx-auto">
      {segments.map((seg, i) => {
        const startAngle = angles[i].start;
        const endAngle = angles[i].end;
        const angle = endAngle - startAngle;

        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const largeArc = angle > 180 ? 1 : 0;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const ix1 = cx + innerRadius * Math.cos(startRad);
        const iy1 = cy + innerRadius * Math.sin(startRad);
        const ix2 = cx + innerRadius * Math.cos(endRad);
        const iy2 = cy + innerRadius * Math.sin(endRad);

        const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

        return <path key={i} d={d} fill={seg.color} />;
      })}
      {centerLabel && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold" fill="currentColor">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const funnelColors = ['#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#10b981'];
  const maxFunnel = Math.max(...data.hiringFunnel.map(f => f.count), 1);

  const overviewCards = [
    {
      title: t.dashboard.totalApplications,
      value: data.overview.totalApplications,
      icon: FileText,
      trend: '+12%',
      trendUp: true,
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      title: t.dashboard.interviewsToday,
      value: data.overview.totalInterviews,
      icon: Users,
      trend: '+8%',
      trendUp: true,
      gradient: 'from-cyan-500 to-teal-600',
    },
    {
      title: t.dashboard.hiredThisMonth,
      value: data.overview.totalHired,
      icon: UserCheck,
      trend: '+15%',
      trendUp: true,
      gradient: 'from-emerald-500 to-cyan-600',
    },
    {
      title: t.dashboard.timeToHire,
      value: `${data.overview.timeToHire}d`,
      icon: Clock,
      trend: '-3d',
      trendUp: true,
      gradient: 'from-teal-600 to-emerald-700',
      subtitle: 'average',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-teal-500" />
            {t.nav.analytics}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.dashboard.overview}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          {t.common.poweredBy}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="relative overflow-hidden border-0 shadow-sm">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.06]`} />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                    <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                    <div className="flex items-center gap-1">
                      {card.trendUp ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${card.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {card.trend}
                      </span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1: Applications Over Time + Hiring Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.dashboard.applicationsOverTime}</CardTitle>
                <CardDescription className="text-xs">Monthly application, interview & hiring trends</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">8 months</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] w-full">
              <SimpleMultiAreaChart
                series={[
                  { data: data.applicationsTrend.map(d => d.applications), color: '#14b8a6', gradientId: 'analyticsAppsGrad' },
                  { data: data.applicationsTrend.map(d => d.interviews), color: '#06b6d4', gradientId: 'analyticsInterviewsGrad' },
                  { data: data.applicationsTrend.map(d => d.hired), color: '#10b981', gradientId: 'analyticsHiredGrad' },
                ]}
                labels={data.applicationsTrend.map(d => d.date)}
                height={300}
              />
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-xs text-muted-foreground">Applications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-xs text-muted-foreground">Interviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Hired</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hiring Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.dashboard.hiringFunnel}</CardTitle>
                <CardDescription className="text-xs">Conversion through stages</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <SimpleHorizontalBarChart
                data={data.hiringFunnel.map((f, i) => ({
                  label: f.stage,
                  value: f.count,
                  color: funnelColors[i] || '#14b8a6',
                }))}
                height={280}
              />
            </div>
            <div className="pt-3 border-t mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Conversion Rate</span>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {data.hiringFunnel[0]?.count > 0
                    ? Math.round((data.hiringFunnel[data.hiringFunnel.length - 1]?.count / data.hiringFunnel[0].count) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Source Breakdown + Top Performing Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.dashboard.sourceBreakdown}</CardTitle>
                <CardDescription className="text-xs">Where candidates come from</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px] flex items-center justify-center">
              <SimpleDonutChart
                segments={data.sourceBreakdown.map(d => ({ value: d.value, color: d.color, label: d.name }))}
                centerLabel={`${data.sourceBreakdown.reduce((s, d) => s + d.value, 0)}%`}
              />
            </div>

            {/* Source Detail Cards */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {data.sourceBreakdown.map((source) => (
                <div key={source.name} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{source.name}</p>
                    <p className="text-xs font-semibold">{source.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.dashboard.topPerformingJobs}</CardTitle>
                <CardDescription className="text-xs">Jobs with the most engagement</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">Top 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Job Title</TableHead>
                  <TableHead className="text-xs text-center">Applications</TableHead>
                  <TableHead className="text-xs text-center">Interviews</TableHead>
                  <TableHead className="text-xs text-center">Hired</TableHead>
                  <TableHead className="text-xs text-center">Avg Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topJobs.map((job, i) => (
                  <TableRow key={i} className="hover:bg-accent/30">
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <span className="truncate">{job.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px]">{job.applications}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px]">{job.interviews}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">{job.hired}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-3 w-3 text-teal-500" />
                        <span className="text-xs font-medium text-teal-700 dark:text-teal-400">{job.avgMatch}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary Row */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 text-teal-500" />
                  <span>{data.topJobs.reduce((sum, j) => sum + j.applications, 0)} total applications</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{data.topJobs.reduce((sum, j) => sum + j.hired, 0)} total hired</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
                <span className="font-medium text-teal-700 dark:text-teal-400">
                  {Math.round(data.topJobs.reduce((sum, j) => sum + j.avgMatch, 0) / data.topJobs.length)}% avg match
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
