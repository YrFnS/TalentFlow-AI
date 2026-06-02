// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import {
  Mail,
  Users,
  BarChart3,
  RotateCcw,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { Campaign, CampaignStatus } from './types';
import { statusColors, emailStatusColors } from './types';

const statusIcons: Record<CampaignStatus, React.ReactNode> = {
  draft: <FileText className="h-3 w-3" />,
  scheduled: <Clock className="h-3 w-3" />,
  sending: <Loader2 className="h-3 w-3 animate-spin" />,
  sent: <CheckCircle2 className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
};

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: Campaign | null;
  getStatusLabel: (status: CampaignStatus) => string;
  getEmailStatusLabel: (status: string) => string;
  onResendFailed: (campaign: Campaign) => void;
  isSending: boolean;
}

export default function CampaignDetailDialog({
  open,
  onOpenChange,
  campaign,
  getStatusLabel,
  getEmailStatusLabel,
  onResendFailed,
  isSending,
}: CampaignDetailDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        {campaign && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                {t.bulkEmail.campaignDetails}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 max-h-[70vh] overflow-y-auto scrollbar-thin space-y-4">
              {/* Campaign Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                </div>
                <Badge className={cn('text-[10px] gap-1', statusColors[campaign.status])}>
                  {statusIcons[campaign.status]}
                  {getStatusLabel(campaign.status)}
                </Badge>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  {t.bulkEmail.performanceMetrics}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.sent}</p>
                    <p className="text-xl font-bold text-blue-600">{campaign.sent}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {campaign.recipients.length > 0
                        ? ((campaign.sent / campaign.recipients.length) * 100).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.opened}</p>
                    <p className="text-xl font-bold text-emerald-600">{campaign.opened}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.openRate}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.clicked}</p>
                    <p className="text-xl font-bold">{campaign.clicked}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.clickRate}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.bounced}</p>
                    <p className="text-xl font-bold text-amber-600">{campaign.bounced}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {campaign.sent > 0 ? ((campaign.bounced / campaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.bounceRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Open Rate Bar */}
              {campaign.sent > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t.bulkEmail.openRate}</span>
                    <span className="font-medium text-blue-600">
                      {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min((campaign.opened / campaign.sent) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Recipient List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {t.bulkEmail.recipientList}
                  </h4>
                  {(campaign.status === 'sent' || campaign.status === 'failed') &&
                    campaign.recipients.some(r => r.emailStatus === 'failed' || r.emailStatus === 'bounced') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-slate-200 text-blue-600 hover:bg-slate-50 dark:hover:bg-teal-950"
                      onClick={() => onResendFailed(campaign)}
                      disabled={isSending}
                    >
                      <RotateCcw className="h-3 w-3 me-1" />
                      {t.bulkEmail.resendFailed}
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {campaign.recipients.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-blue-600 text-white">
                            {getInitials(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <Badge className={cn('text-[9px] border-0', emailStatusColors[r.emailStatus])}>
                          {getEmailStatusLabel(r.emailStatus)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
