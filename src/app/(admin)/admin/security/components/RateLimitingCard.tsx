// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function RateLimitingCard({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('rateLimiting')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <Server className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{t.security.rateLimitingStatus}</CardTitle>
              <CardDescription className="text-xs">{t.security.keyStrategy}: {data?.rateLimiting.keyStrategy ?? '—'}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs">
              {data?.rateLimiting.enabled ? t.security.enabled : t.security.disabled}
            </Badge>
            {expandedSections.rateLimiting ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expandedSections.rateLimiting && (
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.rateLimiting.limiters ?? []).map((limiter) => (
                <div key={limiter.name} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">{limiter.name}</span>
                      <Badge variant="secondary" className="text-xs">{limiter.windowHuman}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t.security.totalKeys}: <strong className="text-foreground">{limiter.totalKeys}</strong></span>
                      <span>{t.security.totalRequests}: <strong className="text-foreground">{limiter.totalRequests}</strong></span>
                      <span>{t.security.maxRequests}: <strong className="text-foreground">{limiter.maxRequests}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={parseFloat(limiter.utilization)} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-muted-foreground w-12 text-end">{limiter.utilization}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
