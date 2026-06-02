// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Send, BarChart3, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmailsSent: number;
  avgOpenRate: number;
}

export default function StatsCards({ totalCampaigns, activeCampaigns, totalEmailsSent, avgOpenRate }: StatsCardsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      <Card className="border-border/50 card-relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.bulkEmail.totalCampaigns}</p>
              <p className="text-xl font-bold">{totalCampaigns}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.bulkEmail.activeCampaigns}</p>
              <p className="text-xl font-bold">{activeCampaigns}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-700 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-blue-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.bulkEmail.emailsSent}</p>
              <p className="text-xl font-bold">{totalEmailsSent.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 card-relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 opacity-[0.06]" />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.bulkEmail.avgOpenRate}</p>
              <p className="text-xl font-bold">{avgOpenRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
