// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react';
import { SecurityDashboardData } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function SecurityHeadersCard({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('headers')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold">{t.security.securityHeaders}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={data?.headersConfig.applied ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs' : 'bg-red-50 text-red-700 dark:bg-red-950 border-0 text-xs'}>
              {data?.headersConfig.applied ? t.security.enabled : t.security.disabled}
            </Badge>
            {expandedSections.headers ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expandedSections.headers && (
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Nonce CSP Info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-teal-100 dark:border-teal-900">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{t.security.nonceBasedCSP}</span>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-xs">
                  {data?.headersConfig.nonceBasedCSP.enabled ? t.security.enabled : t.security.disabled}
                </Badge>
              </div>

              {/* Headers Table */}
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-start pb-2 font-medium">{t.security.headerName}</th>
                      <th className="text-start pb-2 font-medium">{t.security.headerValue}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.headersConfig.headers ?? []).map((header, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 pe-4">
                          <code className="text-xs font-mono text-blue-600">{header.name}</code>
                        </td>
                        <td className="py-2.5">
                          <code className="text-xs font-mono text-muted-foreground break-all">{header.value}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
