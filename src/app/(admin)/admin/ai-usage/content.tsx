// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Zap,
  Calculator,
  Key,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

interface AIUsageData {
  totalCost: string;
  totalCalls: number;
  avgCostPerCall: string;
  activeKeys: number;
  dailyCosts: number[];
  featureUsage: { name: string; percentage: number; count: number }[];
  topUsers: { name: string; email: string; calls: number; cost: string; lastActive: string }[];
  apiKeys: { name: string; provider: string; calls: number; cost: string; status: string }[];
}

const featureColors = ['bg-slate-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-teal-400', 'bg-emerald-400', 'bg-cyan-400', 'bg-amber-500'];

export default function AIUsagePage() {
  const { t } = useI18n();
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-usage');
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
    fetchData();
  }, []);

  const dailyCosts = data?.dailyCosts || [];
  const maxCost = dailyCosts.length > 0 ? Math.max(...dailyCosts) : 1;
  const features = data?.featureUsage || [];
  const topUsers = data?.topUsers || [];
  const apiKeys = data?.apiKeys || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.aiUsage.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.aiUsage.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted animate-pulse rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { title: t.aiUsage.totalCost, value: data?.totalCost || '—', icon: DollarSign, gradient: 'bg-blue-600' },
            { title: t.aiUsage.apiCalls, value: (data?.totalCalls || 0).toLocaleString(), icon: Zap, gradient: 'from-cyan-500 to-blue-600' },
            { title: t.aiUsage.avgCostPerCall, value: data?.avgCostPerCall || '—', icon: Calculator, gradient: 'from-emerald-500 to-teal-600' },
            { title: t.aiUsage.activeKeys, value: String(data?.activeKeys || 0), icon: Key, gradient: 'from-purple-500 to-pink-600' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <Card key={i} className="border-border/50 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br text-white" style={{ backgroundImage: `linear-gradient(to br, var(--tw-gradient-stops))` }}>
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t.aiUsage.costTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : dailyCosts.length > 0 ? (
              <div className="flex items-end gap-2 h-48">
                {dailyCosts.map((cost, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">${cost}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-teal-500 to-emerald-400 min-h-[4px] transition-all duration-300 hover:from-teal-600 hover:to-emerald-500"
                      style={{ height: `${maxCost > 0 ? (cost / maxCost) * 140 : 0}px` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No cost trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage by Feature */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t.aiUsage.usageByFeature}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-2.5 bg-muted animate-pulse rounded-full" />
                </div>
              ))
            ) : features.length > 0 ? (
              features.map((feature, i) => (
                <div key={feature.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-muted-foreground">{feature.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${featureColors[i % featureColors.length]} transition-all duration-500`}
                      style={{ width: `${feature.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No feature usage data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Users Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t.aiUsage.topUsers}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : topUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.aiUsage.user}</TableHead>
                    <TableHead>{t.aiUsage.calls}</TableHead>
                    <TableHead className="text-end">{t.aiUsage.cost}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user) => (
                    <TableRow key={user.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-sm">{user.name}</span>
                            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{user.calls.toLocaleString()}</TableCell>
                      <TableCell className="text-end text-sm font-medium">{user.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No AI usage data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key Usage */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{t.aiUsage.keyUsage}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : apiKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.aiUsage.keyName}</TableHead>
                    <TableHead>{t.aiUsage.provider}</TableHead>
                    <TableHead className="text-end">{t.aiUsage.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{key.name}</code>
                      </TableCell>
                      <TableCell className="text-sm">{key.provider}</TableCell>
                      <TableCell className="text-end">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] border-0 ${
                            key.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                              : 'bg-red-50 text-red-700 dark:bg-red-950'
                          }`}
                        >
                          {key.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 me-1" />
                          ) : (
                            <XCircle className="w-3 h-3 me-1" />
                          )}
                          {key.status === 'active' ? t.aiUsage.active : t.aiUsage.expired}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Key className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No API keys configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
