// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  Building2,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  FileText,
  Activity,
  RefreshCw,
  Eye,
  ScrollText,
  Sparkles,
  Plus,
  Brain,
  Loader2,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';

import Link from 'next/link';

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  totalJobSeekers: number;
  monthlyRevenue: number;
  companyGrowth: number;
  userGrowth: number;
  jobSeekerGrowth: number;
  revenueGrowth: number;
  pendingVerifications: number;
  totalJobs: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'company' | 'user' | 'job' | 'system';
}

interface VerificationRequest {
  id: string;
  name: string;
  industry: string;
  location: string;
  members: number;
  submittedAt: string;
}

interface UserGrowthPoint {
  month: string;
  users: number;
  companies: number;
}

interface RoleDistribution {
  name: string;
  value: number;
  color: string;
}

const gradientColors = [
  'bg-blue-600',
  'from-cyan-500 to-teal-600',
  'from-emerald-500 to-cyan-600',
  'from-amber-500 to-orange-600',
];

function SimpleMultiAreaChart({ series, labels, height = 280 }: { series: { data: number[]; color: string; gradientId: string }[]; labels: string[]; height?: number }) {
  if (labels.length === 0 || series.every(s => s.data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Inbox className="h-8 w-8 mb-2" />
      </div>
    );
  }
  const width = 100;
  const padding = { top: 10, right: 5, bottom: 25, left: 5 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const allValues = series.flatMap(s => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
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
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.3} />;
      })}
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
      {labels.filter((_, i) => i % 2 === 0 || labels.length <= 8).map((label, i) => {
        const idx = labels.length <= 8 ? i : i * 2;
        const x = padding.left + (idx / (labels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 5} textAnchor="middle" fontSize="3" fill="currentColor" opacity={0.5}>{label}</text>
        );
      })}
    </svg>
  );
}

function SimpleDonutChart({ segments, centerLabel }: { segments: { value: number; color: string; label: string }[]; centerLabel?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <Inbox className="h-8 w-8" />
      </div>
    );
  }
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

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const map = {
    company: <Building2 className="h-4 w-4" />,
    user: <UserPlus className="h-4 w-4" />,
    job: <FileText className="h-4 w-4" />,
    system: <Activity className="h-4 w-4" />,
  };
  const colorMap = {
    company: 'bg-teal-100 text-blue-600 dark:bg-teal-950',
    user: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950',
    job: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950',
    system: 'bg-amber-100 text-amber-600 dark:bg-amber-950',
  };
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorMap[type]}`}>
      {map[type]}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthPoint[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalCompanies: data.totalCompanies || 0,
          totalUsers: data.totalUsers || 0,
          totalJobSeekers: data.totalJobSeekers || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          companyGrowth: data.companyGrowth || 0,
          userGrowth: data.userGrowth || 0,
          jobSeekerGrowth: data.jobSeekerGrowth || 0,
          revenueGrowth: data.revenueGrowth || 0,
          pendingVerifications: data.pendingVerifications || 0,
          totalJobs: data.totalJobs || 0,
        });
        setUserGrowthData(data.userGrowthData || []);
        setRoleDistribution(data.roleDistribution || []);
        setRecentActivities(data.recentActivities || []);
        setVerificationRequests(data.verificationRequests || []);
      }
    } catch {
      // Show empty states
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const displayStats = stats;

  const statCards = displayStats ? [
    { title: t.dashboard.totalCompanies, value: displayStats.totalCompanies.toLocaleString(), growth: displayStats.companyGrowth, icon: Building2, gradient: gradientColors[0] },
    { title: t.dashboard.totalUsers, value: displayStats.totalUsers.toLocaleString(), growth: displayStats.userGrowth, icon: Users, gradient: gradientColors[1] },
    { title: t.dashboard.totalJobSeekers, value: displayStats.totalJobSeekers.toLocaleString(), growth: displayStats.jobSeekerGrowth, icon: UserCheck, gradient: gradientColors[2] },
    { title: t.dashboard.monthlyRevenue, value: `$${displayStats.monthlyRevenue.toLocaleString()}`, growth: displayStats.revenueGrowth, icon: DollarSign, gradient: gradientColors[3] },
  ] : [];

  const quickActions = [
    { icon: Building2, label: t.admin.manageCompanies, href: '/admin/companies', color: 'text-blue-600 bg-slate-50 hover:border-slate-300' },
    { icon: Users, label: t.admin.manageUsers, href: '/admin/users', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 hover:border-cyan-300 dark:hover:border-cyan-700' },
    { icon: ScrollText, label: t.nav.auditLogs, href: '/admin/audit-logs', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 hover:border-amber-300 dark:hover:border-amber-700' },
    { icon: Brain, label: t.nav.aiSettings, href: '/admin/ai-settings', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with dot grid */}
      <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-teal-50/80 to-emerald-50/60 dark:from-teal-950/20 dark:to-emerald-950/20">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.admin.platformOverview}</h1>
            <p className="text-muted-foreground text-sm">{t.dashboard.welcome}, Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-slate-300 text-blue-700 hover:bg-slate-50" onClick={fetchAllData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t.admin.refreshData}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-slate-300 text-blue-700 hover:bg-slate-50">
              <FileText className="h-4 w-4" />
              {t.admin.exportData}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards with Consistent Styling & Sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="relative overflow-hidden border-0 shadow-sm group gradient-border-animated card-animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="absolute inset-0 bg-slate-50" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {card.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={card.growth >= 0 ? 'text-xs text-emerald-600' : 'text-xs text-red-600'}>
                        {card.growth >= 0 ? '+' : ''}{card.growth}%
                      </span>
                      <span className="text-xs text-muted-foreground">{t.admin.fromLastMonth}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* User Growth Chart */}
        <Card className="lg:col-span-4 ">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.admin.userGrowth}</CardTitle>
                <CardDescription>{t.admin.newThisMonth}</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {t.common.poweredBy}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userGrowthData.length > 0 ? (
                <SimpleMultiAreaChart
                  series={[
                    { data: userGrowthData.map(d => d.users), color: '#10b981', gradientId: 'adminUsersGrad' },
                    { data: userGrowthData.map(d => d.companies), color: '#14b8a6', gradientId: 'adminCompaniesGrad' },
                  ]}
                  labels={userGrowthData.map(d => d.month)}
                  height={300}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No user growth data available yet</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-500" />
                <span className="text-xs text-muted-foreground">Companies</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution Donut Chart */}
        <Card className="lg:col-span-3 ">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : roleDistribution.length > 0 && roleDistribution.some(d => d.value > 0) ? (
                <SimpleDonutChart
                  segments={roleDistribution.map(d => ({ value: d.value, color: d.color, label: d.name }))}
                  centerLabel={roleDistribution.reduce((s, d) => s + d.value, 0).toLocaleString()}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No role data available</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {roleDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Requests & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Verification Requests */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>{t.admin.verificationRequests}</CardTitle>
                <Badge className="bg-teal-100 text-blue-700 hover:bg-teal-100 dark:bg-teal-950">
                  {displayStats?.pendingVerifications || 0}
                </Badge>
              </div>
              <Link href="/admin/companies">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  {t.common.viewAll}
                  <ArrowUpRight className="h-3 w-3 ms-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : verificationRequests.length > 0 ? (
              <div className="space-y-3">
                {verificationRequests.map((req, idx) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gradient-border-start animate-fade-in"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarFallback className="bg-blue-600 text-white text-xs rounded-lg">
                          {getInitials(req.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{req.name}</p>
                        <p className="text-xs text-muted-foreground">{req.industry} · {req.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{req.members} {t.admin.members}</Badge>
                      <span className="text-[10px] text-muted-foreground">{req.submittedAt}</span>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-white">
                        <ShieldCheck className="h-3 w-3 me-1" />
                        {t.admin.approve}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No pending verification requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.dashboard.recentActivity}</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                {t.common.viewAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-2">
                      <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin">
                {recentActivities.map((activity, idx) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors animate-slide-in-right" style={{ animationDelay: `${idx * 0.06}s` }}>
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="font-medium truncate">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="h-full hover:shadow-md transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer border-dashed ">
              <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
