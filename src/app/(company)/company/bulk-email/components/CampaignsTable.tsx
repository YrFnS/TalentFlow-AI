// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Send, FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignStatus } from './types';
import { statusColors } from './types';

const statusIcons: Record<CampaignStatus, React.ReactNode> = {
  draft: <FileText className="h-3 w-3" />,
  scheduled: <Clock className="h-3 w-3" />,
  sending: <Loader2 className="h-3 w-3 animate-spin" />,
  sent: <CheckCircle2 className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
};

interface CampaignsTableProps {
  campaigns: Campaign[];
  getStatusLabel: (status: CampaignStatus) => string;
  onOpenDetail: (campaign: Campaign) => void;
  onSendCampaign: (campaign: Campaign) => void;
}

export default function CampaignsTable({ campaigns, getStatusLabel, onOpenDetail, onSendCampaign }: CampaignsTableProps) {
  const { t } = useI18n();

  if (campaigns.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t.bulkEmail.noCampaigns}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 animate-fade-in-up">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.bulkEmail.campaignName}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{t.bulkEmail.subject}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.bulkEmail.status}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{t.bulkEmail.recipients}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t.bulkEmail.sent}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t.bulkEmail.opened}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t.bulkEmail.clicked}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t.bulkEmail.bounced}</th>
                <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{t.bulkEmail.openRate}</th>
                <th className="text-end text-xs font-medium text-muted-foreground p-3">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={campaign.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors table-row-accent">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{campaign.subject}</p>
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px] gap-1', statusColors[campaign.status])}>
                        {statusIcons[campaign.status]}
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm">{campaign.recipients.length}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm">{campaign.sent}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm text-emerald-600">{campaign.opened}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm">{campaign.clicked}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-sm text-amber-600">{campaign.bounced}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-blue-600">{openRate}%</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenDetail(campaign)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:bg-slate-50 dark:hover:bg-teal-950"
                            onClick={() => onSendCampaign(campaign)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
