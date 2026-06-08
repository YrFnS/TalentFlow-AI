// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LockKeyhole, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function CsrfCspCards({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CSRF Protection */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('csrf')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{t.security.csrfProtection}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={data?.securityConfig.csrf.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs'}>
                {data?.securityConfig.csrf.enabled ? t.security.enabled : t.security.disabled}
              </Badge>
              {expandedSections.csrf ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.csrf && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.csrfCookie}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{data?.securityConfig.csrf.cookieName ?? '—'}</code>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.csrfHeader}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{data?.securityConfig.csrf.headerName ?? '—'}</code>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.csrfExemptPaths}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(data?.securityConfig.csrf.exemptPaths ?? []).map((path) => (
                      <Badge key={path} variant="secondary" className="text-xs font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/30 border-0">
                        {path}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* CSP Configuration */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('csp')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                <LockKeyhole className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{t.security.cspConfiguration}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={data?.securityConfig.csp.nonceBased ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0 text-xs'}>
                {data?.securityConfig.csp.nonceBased ? t.security.nonceBasedCSP : 'unsafe-inline'}
              </Badge>
              {expandedSections.csp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {expandedSections.csp && (
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.cspNonceBased}</span>
                  <Badge className={data?.securityConfig.csp.nonceBased ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0'}>
                    {data?.securityConfig.csp.nonceBased ? t.security.yes : t.security.no}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">{t.security.cspRotationInterval}</span>
                  <Badge variant="secondary" className="text-xs">{data?.securityConfig.csp.rotationIntervalHuman ?? '—'}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground block mb-2">{t.security.cspDirectives}</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {Object.entries(data?.securityConfig.csp.directives ?? {}).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-blue-600 shrink-0">{key}:</span>
                        <span className="font-mono text-muted-foreground break-all">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
