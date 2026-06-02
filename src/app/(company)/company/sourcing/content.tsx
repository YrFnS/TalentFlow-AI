// @ts-nocheck
'use client';

import { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { PastCandidate } from './components/types';
import RediscoveryTab from './components/rediscovery-tab';
import CampaignsTab from './components/campaigns-tab';
import EngagementTab from './components/engagement-tab';

export default function SourcingContent() {
  const { t } = useI18n();
  const tr = t.talentRediscovery as Record<string, string>;
  const ts = t.sourcing as Record<string, string>;
  const [activeTab, setActiveTab] = useState('rediscovery');

  const handleReEngage = (candidate: PastCandidate) => {
    toast.success(tr.reEngageSuccess);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvailabilityBadge = (availability: PastCandidate['availability']) => {
    switch (availability) {
      case 'available': return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0 text-[10px]">{tr.available}</Badge>;
      case 'open_to_work': return <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 text-[10px]">{tr.openToWork}</Badge>;
      case 'not_available': return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 text-[10px]">{tr.notAvailable}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{tr.title}</h1>
            <p className="text-sm text-muted-foreground">{tr.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rediscovery" className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            {tr.rediscoveryTab}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            {tr.campaignsTab}
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            {tr.engagementTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rediscovery">
          <RediscoveryTab
            tr={tr}
            formatDate={formatDate}
            getAvailabilityBadge={getAvailabilityBadge}
            onReEngage={handleReEngage}
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
