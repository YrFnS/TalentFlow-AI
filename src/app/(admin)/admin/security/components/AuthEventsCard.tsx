// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { SecurityDashboardData, ActionBadge } from './types';

interface Props {
  data: SecurityDashboardData | null;
  loading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export default function AuthEventsCard({ data, loading, expandedSections, toggleSection }: Props) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('authStats')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold">{t.security.authStats}</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t.security.registration24h}: <strong className="text-foreground">{data?.authStats.registrations24h ?? 0}</strong></span>
            <span>{t.security.socialLogins}: <strong className="text-foreground">{data?.authStats.socialLogins24h ?? 0}</strong></span>
            {expandedSections.authStats ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expandedSections.authStats && (
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (data?.authStats.recentEvents ?? []).length > 0 ? (
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-start pb-2 font-medium">{t.security.action}</th>
                    <th className="text-start pb-2 font-medium">{t.security.email}</th>
                    <th className="text-start pb-2 font-medium">{t.security.ipAddress}</th>
                    <th className="text-start pb-2 font-medium">{t.security.timestamp}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.authStats.recentEvents ?? []).slice(0, 15).map((event) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 pe-4">
                        <ActionBadge action={event.action} />
                      </td>
                      <td className="py-3 pe-4">
                        <span className="text-sm truncate max-w-[180px] block">{event.email}</span>
                      </td>
                      <td className="py-3 pe-4">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{event.ip}</code>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">{t.security.noRecommendations}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
