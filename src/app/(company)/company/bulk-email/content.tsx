// @ts-nocheck
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Plus, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import type { Campaign, CampaignStatus, Recipient } from './components/types';
import { createCampaignAction, applySendResults, applyResendResults, sendApiRequest } from './components/campaign-actions';
import StatsCards from './components/StatsCards';
import CampaignsTable from './components/CampaignsTable';
import OpenRatesCard from './components/OpenRatesCard';
import CreateCampaignDialog from './components/CreateCampaignDialog';
import CampaignDetailDialog from './components/CampaignDetailDialog';
import SendConfirmDialog from './components/SendConfirmDialog';

const ALL_RECIPIENTS: Recipient[] = [];
const VARIABLES = [
  { key: 'candidate_name', labelKey: 'variableCandidateName' as const, sample: '' },
  { key: 'job_title', labelKey: 'variableJobTitle' as const, sample: '' },
  { key: 'company_name', labelKey: 'variableCompanyName' as const, sample: '' },
  { key: 'interview_date', labelKey: 'variableInterviewDate' as const, sample: '' },
  { key: 'interview_time', labelKey: 'variableInterviewTime' as const, sample: '' },
];
const TEMPLATES: { id: string; name: string }[] = [];
const INITIAL_CAMPAIGNS: Campaign[] = [];

function replaceVariables(text: string): string {
  let result = text;
  for (const v of VARIABLES) {
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.sample);
  }
  return result;
}

export default function BulkEmailContent() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>(TEMPLATES);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToSend, setCampaignToSend] = useState<Campaign | null>(null);

  const [step, setStep] = useState(1);
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formEmailMode, setFormEmailMode] = useState<'template' | 'custom'>('template');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formSelectedRecipients, setFormSelectedRecipients] = useState<Set<string>>(new Set());
  const [formFilterJob, setFormFilterJob] = useState('all');
  const [formFilterStatus, setFormFilterStatus] = useState('all');
  const [formFilterStage, setFormFilterStage] = useState('all');
  const [formSearchRecipients, setFormSearchRecipients] = useState('');
  const [formSendMode, setFormSendMode] = useState<'now' | 'later'>('now');
  const [formScheduleDate, setFormScheduleDate] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/bulk-email');
        if (res.ok) { const data = await res.json(); setTemplates(data.templates || []); }
      } catch { /* empty */ }
    }
    fetchTemplates();
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
  const totalEmailsSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((acc, c) => acc + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) / sentCampaigns.length : 0;

  const getStatusLabel = useCallback((s: CampaignStatus) => ({ draft: t.bulkEmail.draft, scheduled: t.bulkEmail.scheduled, sending: t.bulkEmail.sending, sent: t.bulkEmail.sentStatus, failed: t.bulkEmail.failed }[s]), [t]);
  const getEmailStatusLabel = useCallback((s: string) => ({ pending: t.bulkEmail.pending, sent: t.bulkEmail.sent, opened: t.bulkEmail.opened, clicked: t.bulkEmail.clicked, bounced: t.bulkEmail.bounced, failed: t.bulkEmail.failed }[s] || s), [t]);

  const uniqueJobs = useMemo(() => [...new Set(ALL_RECIPIENTS.map(r => r.job))], []);
  const uniqueStages = useMemo(() => [...new Set(ALL_RECIPIENTS.map(r => r.stage))], []);
  const filteredRecipients = useMemo(() => ALL_RECIPIENTS.filter(r => {
    if (formFilterJob !== 'all' && r.job !== formFilterJob) return false;
    if (formFilterStatus !== 'all' && r.status !== formFilterStatus) return false;
    if (formFilterStage !== 'all' && r.stage !== formFilterStage) return false;
    if (formSearchRecipients) { const q = formSearchRecipients.toLowerCase(); if (!r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false; }
    return true;
  }), [formFilterJob, formFilterStatus, formFilterStage, formSearchRecipients]);

  const toggleRecipient = (id: string) => setFormSelectedRecipients(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAllVisible = () => setFormSelectedRecipients(prev => { const n = new Set(prev); filteredRecipients.forEach(r => n.add(r.id)); return n; });
  const deselectAllVisible = () => setFormSelectedRecipients(prev => { const n = new Set(prev); filteredRecipients.forEach(r => n.delete(r.id)); return n; });
  const insertVariable = (k: string) => setFormBody(prev => prev + `{{${k}}}`);
  const resetForm = () => { setStep(1); setFormName(''); setFormSubject(''); setFormEmailMode('template'); setFormTemplateId(''); setFormBody(''); setFormSelectedRecipients(new Set()); setFormFilterJob('all'); setFormFilterStatus('all'); setFormFilterStage('all'); setFormSearchRecipients(''); setFormSendMode('now'); setFormScheduleDate(''); };
  const openCreateDialog = () => { resetForm(); setCreateDialogOpen(true); };
  const openDetailDialog = (c: Campaign) => { setSelectedCampaign(c); setDetailDialogOpen(true); };
  const canGoNext = () => { if (step === 1) return formName.trim() && formSubject.trim() && (formEmailMode === 'template' ? formTemplateId : formBody.trim()); if (step === 2) return formBody.trim(); if (step === 3) return formSelectedRecipients.size > 0; return true; };
  const previewEmail = useMemo(() => replaceVariables(formBody || 'No content'), [formBody]);

  const handleCreateCampaign = async () => {
    if (!formName || !formSubject || !formBody) { toast.error(t.common.error); return; }
    const newCamp = createCampaignAction({ formName, formSubject, formBody, formSendMode, formEmailMode, formTemplateId, formScheduleDate, formSelectedRecipients, ALL_RECIPIENTS, campaignsLength: campaigns.length });
    setCampaigns(prev => [newCamp, ...prev]);
    setCreateDialogOpen(false);
    toast.success(t.bulkEmail.campaignCreated);
    if (formSendMode === 'now') {
      setIsSending(true);
      try { await sendApiRequest(newCamp.id); setCampaigns(prev => applySendResults(prev, newCamp.id, newCamp.recipients.length)); toast.success(t.bulkEmail.campaignSent); }
      catch { toast.error(t.common.error); } finally { setIsSending(false); }
    }
  };

  const handleSendCampaign = (campaign: Campaign) => { setCampaignToSend(campaign); setSendConfirmOpen(true); };
  const confirmSendCampaign = async () => {
    if (!campaignToSend) return;
    setIsSending(true);
    try { await sendApiRequest(campaignToSend.id); setCampaigns(prev => applySendResults(prev, campaignToSend.id, campaignToSend.recipients.length)); toast.success(t.bulkEmail.campaignSent); }
    catch { toast.error(t.common.error); } finally { setIsSending(false); setSendConfirmOpen(false); setCampaignToSend(null); }
  };
  const handleResendFailed = async (campaign: Campaign) => {
    setIsSending(true);
    try { await sendApiRequest(campaign.id); setCampaigns(prev => applyResendResults(prev, campaign.id)); toast.success(t.bulkEmail.campaignSent); }
    catch { toast.error(t.common.error); } finally { setIsSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Megaphone className="h-5 w-5" /></div>
          <div><h1 className="text-2xl font-bold tracking-tight ">{t.bulkEmail.title}</h1><p className="text-sm text-muted-foreground">{t.bulkEmail.subtitle}</p></div>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
          <Plus className="h-4 w-4 me-2" />{t.bulkEmail.createCampaign}
        </Button>
      </div>
      <StatsCards totalCampaigns={totalCampaigns} activeCampaigns={activeCampaigns} totalEmailsSent={totalEmailsSent} avgOpenRate={avgOpenRate} />
      <CampaignsTable campaigns={campaigns} getStatusLabel={getStatusLabel} onOpenDetail={openDetailDialog} onSendCampaign={handleSendCampaign} />
      <OpenRatesCard campaigns={campaigns} />
      <CreateCampaignDialog
        open={createDialogOpen} onOpenChange={setCreateDialogOpen} step={step} setStep={setStep}
        formName={formName} setFormName={setFormName} formSubject={formSubject} setFormSubject={setFormSubject}
        formEmailMode={formEmailMode} setFormEmailMode={setFormEmailMode} formTemplateId={formTemplateId}
        formBody={formBody} setFormBody={setFormBody} formSelectedRecipients={formSelectedRecipients}
        formSearchRecipients={formSearchRecipients} setFormSearchRecipients={setFormSearchRecipients}
        formFilterJob={formFilterJob} setFormFilterJob={setFormFilterJob} formFilterStatus={formFilterStatus}
        setFormFilterStatus={setFormFilterStatus} formFilterStage={formFilterStage} setFormFilterStage={setFormFilterStage}
        formSendMode={formSendMode} setFormSendMode={setFormSendMode} formScheduleDate={formScheduleDate}
        setFormScheduleDate={setFormScheduleDate} isSending={isSending} templates={templates}
        setFormTemplateId={setFormTemplateId} VARIABLES={VARIABLES} ALL_RECIPIENTS={ALL_RECIPIENTS}
        uniqueJobs={uniqueJobs} uniqueStages={uniqueStages} canGoNext={canGoNext} previewEmail={previewEmail}
        insertVariable={insertVariable} toggleRecipient={toggleRecipient} selectAllVisible={selectAllVisible}
        deselectAllVisible={deselectAllVisible} filteredRecipients={filteredRecipients}
        replaceVariables={replaceVariables} handleCreateCampaign={handleCreateCampaign}
      />
      <CampaignDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} campaign={selectedCampaign} getStatusLabel={getStatusLabel} getEmailStatusLabel={getEmailStatusLabel} onResendFailed={handleResendFailed} isSending={isSending} />
      <SendConfirmDialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen} onConfirm={confirmSendCampaign} isSending={isSending} />
    </div>
  );
}
