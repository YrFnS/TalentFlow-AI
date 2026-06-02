// @ts-nocheck
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  job: string;
  status: string;
  stage: string;
  emailStatus: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'failed';
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  body: string;
  templateId: string | null;
  recipients: Recipient[];
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  scheduledAt: string | null;
  createdAt: string;
}

export const statusColors: Record<CampaignStatus, string> = {
  draft: 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400 border-0',
  scheduled: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  sending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

export const emailStatusColors: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400',
  sent: 'bg-slate-50 text-blue-700 dark:bg-teal-950',
  opened: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
  clicked: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  bounced: 'bg-amber-50 text-amber-700 dark:bg-amber-950',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950',
};
