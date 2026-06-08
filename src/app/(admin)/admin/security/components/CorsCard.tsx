// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function CorsCard({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('cors')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <Globe className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold">{t.security.corsConfiguration}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{data?.corsConfig.environment ?? '—'}</Badge>
            {expandedSections.cors ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expandedSections.cors && (
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.corsAllowedOrigins}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.corsConfig.allowedOrigins ?? []).length > 0 ? (
                      data!.corsConfig.allowedOrigins.map((origin) => (
                        <Badge key={origin} variant="secondary" className="text-xs font-mono bg-slate-50 text-blue-700 border-0">
                          {origin}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None configured</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.corsAllowCredentials}</span>
                  <Badge className={data?.corsConfig.allowCredentials ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}>
                    {data?.corsConfig.allowCredentials ? t.security.yes : t.security.no}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.corsAllowedMethods}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.corsConfig.allowedMethods ?? []).map((method) => (
                      <Badge key={method} variant="secondary" className="text-xs font-mono bg-emerald-50 text-emerald-700 border-0">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.corsMaxAge}</span>
                  <Badge variant="secondary" className="text-xs">{data?.corsConfig.maxAge ?? '—'}s</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.corsEnvironment}</span>
                  <Badge variant="secondary" className="text-xs">{data?.corsConfig.environment ?? '—'}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
