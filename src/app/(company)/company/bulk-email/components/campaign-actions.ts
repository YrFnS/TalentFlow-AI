// @ts-nocheck
import type { Campaign, CampaignStatus, Recipient } from './types';

export function createCampaignAction(params: {
  formName: string;
  formSubject: string;
  formBody: string;
  formSendMode: 'now' | 'later';
  formEmailMode: 'template' | 'custom';
  formTemplateId: string;
  formScheduleDate: string;
  formSelectedRecipients: Set<string>;
  ALL_RECIPIENTS: Recipient[];
  campaignsLength: number;
}): Campaign {
  const { formName, formSubject, formBody, formSendMode, formEmailMode, formTemplateId, formScheduleDate, formSelectedRecipients, ALL_RECIPIENTS, campaignsLength } = params;
  const selectedRcps = ALL_RECIPIENTS.filter(r => formSelectedRecipients.has(r.id));
  return {
    id: `CAMP-${String(campaignsLength + 1).padStart(3, '0')}`,
    name: formName,
    subject: formSubject,
    status: formSendMode === 'later' ? 'scheduled' : 'draft',
    body: formBody,
    templateId: formEmailMode === 'template' ? formTemplateId : null,
    recipients: selectedRcps.map(r => ({ ...r, emailStatus: 'pending' as const })),
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    scheduledAt: formSendMode === 'later' ? formScheduleDate : null,
    createdAt: new Date().toISOString().split('T')[0],
  };
}

export function applySendResults(
  prev: Campaign[],
  campaignId: string,
  recipientCount: number,
): Campaign[] {
  return prev.map(c =>
    c.id === campaignId
      ? {
          ...c,
          status: 'sent' as CampaignStatus,
          sent: recipientCount,
          opened: Math.floor(recipientCount * 0.6),
          clicked: Math.floor(recipientCount * 0.25),
          bounced: Math.floor(recipientCount * 0.08),
          recipients: c.recipients.map((r, i) => ({
            ...r,
            emailStatus: (['sent', 'opened', 'clicked', 'bounced'][i % 4]) as Recipient['emailStatus'],
          })),
        }
      : c
  );
}

export function applyResendResults(
  prev: Campaign[],
  campaignId: string,
): Campaign[] {
  return prev.map(c => {
    if (c.id !== campaignId) return c;
    const newRecipients = c.recipients.map(r =>
      r.emailStatus === 'failed' || r.emailStatus === 'bounced'
        ? { ...r, emailStatus: 'sent' as const }
        : r
    );
    const failedCount = c.recipients.filter(r => r.emailStatus === 'failed' || r.emailStatus === 'bounced').length;
    return {
      ...c,
      recipients: newRecipients,
      sent: c.sent + failedCount,
      bounced: Math.max(0, c.bounced - c.recipients.filter(r => r.emailStatus === 'bounced').length),
    };
  });
}

export async function sendApiRequest(campaignId: string): Promise<void> {
  await fetch('/api/bulk-email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId }),
  });
}
