// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { Campaign } from './types';

interface OpenRatesCardProps {
  campaigns: Campaign[];
}

export default function OpenRatesCard({ campaigns }: OpenRatesCardProps) {
  const { t } = useI18n();

  return (
    <Card className="border-border/50 animate-fade-in-up">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          {t.bulkEmail.openRate}
        </h3>
        <div className="space-y-3">
          {campaigns.filter(c => c.status === 'sent' || c.status === 'sending').map((campaign) => {
            const rate = campaign.sent > 0 ? (campaign.opened / campaign.sent) * 100 : 0;
            return (
              <div key={campaign.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[200px]">{campaign.name}</span>
                  <span className="font-medium text-blue-600">{rate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
