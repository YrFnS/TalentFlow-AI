'use client';

import { useState } from 'react';
import { Search, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/store/i18n-store';
import CampaignsTab from './components/campaigns-tab';
import EngagementTab from './components/engagement-tab';
import RediscoveryTab from './components/rediscovery-tab';
import type { PastCandidate } from './components/types';

export default function SourcingContent() {
  const { t } = useI18n();
  const tr = t.talentRediscovery as Record<string, string>;
  const ts = t.sourcing as Record<string, string>;
  const [activeTab, setActiveTab] = useState('rediscovery');

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getAvailabilityBadge = (
    availability: PastCandidate['availability'],
  ) => {
    switch (availability) {
      case 'available':
        return (
          <Badge className="border-0 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400">
            {tr.available || 'Available'}
          </Badge>
        );
      case 'open_to_work':
        return (
          <Badge className="border-0 bg-primary/10 text-[10px] text-primary">
            {tr.openToWork || 'Open to work'}
          </Badge>
        );
      case 'not_available':
        return (
          <Badge variant="secondary" className="text-[10px]">
            {tr.notAvailable || 'Not available'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tr.title || 'Talent rediscovery'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and re-engage real former applicants from your company’s own
            hiring history.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rediscovery" className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            {tr.rediscoveryTab || 'Rediscovery'}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            {tr.campaignsTab || 'Campaigns'}
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            {tr.engagementTab || 'Engagement'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rediscovery">
          <RediscoveryTab
            tr={tr}
            formatDate={formatDate}
            getAvailabilityBadge={getAvailabilityBadge}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab ts={ts} commonCancel={t.common.cancel} />
        </TabsContent>

        <TabsContent value="engagement">
          <EngagementTab ts={ts} formatDateTime={formatDateTime} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
