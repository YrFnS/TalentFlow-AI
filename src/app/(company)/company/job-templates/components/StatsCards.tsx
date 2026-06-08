// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import type { JobTemplate } from './constants';

interface StatsCardsProps {
  templates: JobTemplate[];
}

export default function StatsCards({ templates }: StatsCardsProps) {
  const { t } = useI18n();

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.active).length;
  const mostUsedTemplate = templates.reduce((max, t) => (t.usageCount > (max?.usageCount ?? 0) ? t : max), templates[0]);
  const createdThisMonth = templates.filter((t) => {
    const created = new Date(t.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTemplates}</p>
              <p className="text-xs text-muted-foreground">{t.jobTemplates.totalTemplates}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeTemplates}</p>
              <p className="text-xs text-muted-foreground">{t.jobTemplates.activeTemplates}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{mostUsedTemplate?.title || '-'}</p>
              <p className="text-xs text-muted-foreground">{t.jobTemplates.mostUsed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{createdThisMonth}</p>
              <p className="text-xs text-muted-foreground">{t.jobTemplates.createdThisMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
