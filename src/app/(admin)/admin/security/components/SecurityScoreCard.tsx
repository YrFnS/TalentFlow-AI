// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, LogIn, AlertTriangle, Lock, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData, CircularScore, StatusBadge, Skeleton } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function SecurityScoreCard({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Security Score Card */}
      <Card className="lg:col-span-1 border-0 shadow-md animate-fade-in-up">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[280px]">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-40 w-40 bg-muted animate-pulse rounded-full" />
              <Skeleton />
            </div>
          ) : (
            <>
              <CircularScore score={data?.securityScore ?? 0} />
              <p className="text-xs text-muted-foreground mt-3">
                {new Date().toLocaleTimeString()}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Score Breakdown + Auth Stats Quick View */}
      <div className="lg:col-span-4 space-y-4">
        {/* Score Breakdown */}
        <Card className="border-0 shadow-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('scoreBreakdown')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold">{t.security.scoreBreakdown}</CardTitle>
              </div>
              {expandedSections.scoreBreakdown ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          {expandedSections.scoreBreakdown && (
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(data?.scoreBreakdown ?? []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        <span className="text-sm font-medium">{item.feature}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <Progress value={(item.points / item.maxPoints) * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-bold text-muted-foreground w-14 text-end">
                          {item.points}/{item.maxPoints}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Auth Stats Quick View */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-slate-50 opacity-60" />
            <CardContent className="relative p-5">
              {loading ? <Skeleton /> : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                      <LogIn className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.security.loginSuccess}</span>
                  </div>
                  <p className="text-2xl font-bold">{data?.authStats.loginSuccess24h ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 opacity-60" />
            <CardContent className="relative p-5">
              {loading ? <Skeleton /> : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.security.loginFailures}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{data?.authStats.loginFailures24h ?? 0}</p>
                    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs">
                      {data?.authStats.failureRate ?? 0}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 opacity-60" />
            <CardContent className="relative p-5">
              {loading ? <Skeleton /> : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.security.accountLockouts}</span>
                  </div>
                  <p className="text-2xl font-bold">{data?.authStats.accountLockouts24h ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-md card-animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 opacity-60" />
            <CardContent className="relative p-5">
              {loading ? <Skeleton /> : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <ShieldAlert className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.security.suspiciousActivity24h}</span>
                  </div>
                  <p className="text-2xl font-bold">{data?.authStats.suspiciousActivity24h ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.security.last24h}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
