// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Users,
  Clock,
  AlertTriangle,
  Server,
  Database,
  Brain,
  Mail,
  HardDrive,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  MemoryStick,
  Disc,
  Wifi,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HealthData {
  uptime: string;
  activeUsers: number;
  apiResponseTime: string;
  errorRate: string;
  services: { name: string; status: string }[];
  incidents: { description: string; time: string; severity: string }[];
  serverMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  chartData: number[];
}

const serviceIconMap: Record<string, React.ElementType> = {
  'Web Server': Server,
  'Database': Database,
  'AI Service': Brain,
  'Email Service': Mail,
  'File Storage': HardDrive,
  'Cache Layer': Layers,
};

export default function AdminHealthPage() {
  const { t } = useI18n();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Will show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const statCards = data ? [
    { title: t.health.systemUptime, value: data.uptime, icon: Activity, gradient: 'from-teal-500 to-emerald-600', change: '' },
    { title: t.health.activeUsers, value: String(data.activeUsers), icon: Users, gradient: 'from-emerald-500 to-teal-600', change: '' },
    { title: t.health.apiResponseTime, value: data.apiResponseTime, icon: Clock, gradient: 'from-cyan-500 to-teal-600', change: '' },
    { title: t.health.errorRate, value: data.errorRate, icon: AlertTriangle, gradient: 'from-teal-600 to-emerald-700', change: '' },
  ] : [];

  const serverMetrics = data ? [
    { label: t.health.cpuUsage, value: data.serverMetrics.cpuUsage, icon: Cpu, color: 'bg-teal-500' },
    { label: t.health.memoryUsage, value: data.serverMetrics.memoryUsage, icon: MemoryStick, color: 'bg-emerald-500' },
    { label: t.health.diskUsage, value: data.serverMetrics.diskUsage, icon: Disc, color: 'bg-cyan-500' },
    { label: t.health.networkIO, value: data.serverMetrics.networkIO, icon: Wifi, color: 'bg-teal-600' },
  ] : [];

  // Chart rendering
  const chartData = data?.chartData || [];
  const chartMin = chartData.length > 0 ? Math.min(...chartData) - 10 : 0;
  const chartMax = chartData.length > 0 ? Math.max(...chartData) + 10 : 100;
  const chartWidth = 600;
  const chartHeight = 200;
  const chartPadding = 30;

  const getX = (i: number) => chartPadding + (i / (Math.max(chartData.length - 1, 1))) * (chartWidth - 2 * chartPadding);
  const getY = (v: number) => chartHeight - chartPadding - ((v - chartMin) / (chartMax - chartMin || 1)) * (chartHeight - 2 * chartPadding);

  const linePath = chartData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
  const areaPath = chartData.length > 0 ? `${linePath} L ${getX(chartData.length - 1)} ${chartHeight - chartPadding} L ${getX(0)} ${chartHeight - chartPadding} Z` : '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            {t.health.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.health.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted animate-pulse rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden border-0 shadow-md">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t.health.serviceStatus}</CardTitle>
            <CardDescription>Real-time status of all platform services</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (data?.services || []).length > 0 ? (
              <div className="space-y-3">
                {(data?.services || []).map((service) => {
                  const ServiceIcon = serviceIconMap[service.name] || Server;
                  return (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          service.status === 'operational'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          <ServiceIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-3.5 w-3.5 rounded-full ${
                          service.status === 'operational' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                        }`} />
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            service.status === 'operational'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0'
                          }`}
                        >
                          {service.status === 'operational' ? t.health.operational : t.health.degradedPerformance}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No service status data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t.health.performanceChart}</CardTitle>
            <CardDescription>API response time in milliseconds over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length > 0 ? (
              <>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                  <text x={5} y={chartHeight / 2} textAnchor="middle" className="fill-muted-foreground text-[9px]" transform={`rotate(-90, 5, ${chartHeight / 2})`}>Response (ms)</text>
                  <text x={chartWidth / 2} y={chartHeight - 2} textAnchor="middle" className="fill-muted-foreground text-[9px]">Time (24h)</text>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartPadding + ratio * (chartHeight - 2 * chartPadding);
                    const val = Math.round(chartMax - ratio * (chartMax - chartMin));
                    return (
                      <g key={ratio}>
                        <line x1={chartPadding} y1={y} x2={chartWidth - chartPadding} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                        <text x={chartPadding - 5} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{val}</text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#chartGradient)" fillOpacity="0.3" />
                  <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.map((v, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#14b8a6" stroke="white" strokeWidth="1.5" className="opacity-0 hover:opacity-100 transition-opacity" />
                  ))}
                </svg>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-8">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No performance data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t.health.recentIncidents}</CardTitle>
            <CardDescription>Latest system events and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.incidents || []).length > 0 ? (
              <div className="relative space-y-0">
                <div className="absolute start-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-300 via-teal-300 to-emerald-300 dark:from-amber-600 dark:via-teal-600 dark:to-emerald-600" />
                {data!.incidents.map((incident, i) => (
                  <div key={i} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background z-10 ${
                      incident.severity === 'warning'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                        : incident.severity === 'info'
                        ? 'bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}>
                      {incident.severity === 'warning' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : incident.severity === 'info' ? (
                        <Activity className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-medium">{incident.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{incident.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No incidents reported</p>
                <p className="text-xs mt-1">All systems running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server Metrics */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t.health.serverMetrics}</CardTitle>
            <CardDescription>Current server resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-3 bg-muted animate-pulse rounded-full" />
                </div>
              ))
            ) : serverMetrics.length > 0 ? (
              serverMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{metric.value}%</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute inset-y-0 start-0 rounded-full bg-gradient-to-r ${metric.color} to-emerald-400 transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">0%</span>
                    <span className={`text-[10px] font-medium ${
                      metric.value > 70 ? 'text-amber-500' : metric.value > 50 ? 'text-teal-500' : 'text-emerald-500'
                    }`}>
                      {metric.value > 70 ? 'High' : metric.value > 50 ? 'Moderate' : metric.value > 0 ? 'Low' : 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">100%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Cpu className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Server metrics not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
