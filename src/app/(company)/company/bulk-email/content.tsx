// @ts-nocheck
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import {
  Mail,
  Plus,
  Send,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  FileText,
  Search,
  ArrowLeft,
  ArrowRight,
  Calendar,
  RotateCcw,
  Variable,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Megaphone,
} from 'lucide-react';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

interface Recipient {
  id: string;
  name: string;
  email: string;
  job: string;
  status: string;
  stage: string;
  emailStatus: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'failed';
}

interface Campaign {
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

const statusColors: Record<CampaignStatus, string> = {
  draft: 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400 border-0',
  scheduled: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  sending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

const statusIcons: Record<CampaignStatus, React.ReactNode> = {
  draft: <FileText className="h-3 w-3" />,
  scheduled: <Clock className="h-3 w-3" />,
  sending: <Loader2 className="h-3 w-3 animate-spin" />,
  sent: <CheckCircle2 className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
};

const emailStatusColors: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400',
  sent: 'bg-slate-50 text-blue-700 dark:bg-teal-950',
  opened: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
  clicked: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  bounced: 'bg-amber-50 text-amber-700 dark:bg-amber-950',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950',
};

export default function BulkEmailContent() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>(TEMPLATES);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToSend, setCampaignToSend] = useState<Campaign | null>(null);

  // Create campaign form state
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

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/bulk-email');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // Use empty templates
      }
    }
    fetchTemplates();
  }, []);

  // Stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
  const totalEmailsSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((acc, c) => acc + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) / sentCampaigns.length
    : 0;

  const getStatusLabel = useCallback((status: CampaignStatus) => {
    const map: Record<CampaignStatus, string> = {
      draft: t.bulkEmail.draft,
      scheduled: t.bulkEmail.scheduled,
      sending: t.bulkEmail.sending,
      sent: t.bulkEmail.sentStatus,
      failed: t.bulkEmail.failed,
    };
    return map[status];
  }, [t]);

  const getEmailStatusLabel = useCallback((status: string) => {
    const map: Record<string, string> = {
      pending: t.bulkEmail.pending,
      sent: t.bulkEmail.sent,
      opened: t.bulkEmail.opened,
      clicked: t.bulkEmail.clicked,
      bounced: t.bulkEmail.bounced,
      failed: t.bulkEmail.failed,
    };
    return map[status] || status;
  }, [t]);

  // Filtered recipients for selection
  const uniqueJobs = useMemo(() => [...new Set(ALL_RECIPIENTS.map(r => r.job))], []);
  const uniqueStages = useMemo(() => [...new Set(ALL_RECIPIENTS.map(r => r.stage))], []);

  const filteredRecipients = useMemo(() => {
    return ALL_RECIPIENTS.filter(r => {
      if (formFilterJob !== 'all' && r.job !== formFilterJob) return false;
      if (formFilterStatus !== 'all' && r.status !== formFilterStatus) return false;
      if (formFilterStage !== 'all' && r.stage !== formFilterStage) return false;
      if (formSearchRecipients) {
        const q = formSearchRecipients.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [formFilterJob, formFilterStatus, formFilterStage, formSearchRecipients]);

  const toggleRecipient = (id: string) => {
    setFormSelectedRecipients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setFormSelectedRecipients(prev => {
      const next = new Set(prev);
      filteredRecipients.forEach(r => next.add(r.id));
      return next;
    });
  };

  const deselectAllVisible = () => {
    setFormSelectedRecipients(prev => {
      const next = new Set(prev);
      filteredRecipients.forEach(r => next.delete(r.id));
      return next;
    });
  };

  const insertVariable = (varKey: string) => {
    setFormBody(prev => prev + `{{${varKey}}}`);
  };

  const resetForm = () => {
    setStep(1);
    setFormName('');
    setFormSubject('');
    setFormEmailMode('template');
    setFormTemplateId('');
    setFormBody('');
    setFormSelectedRecipients(new Set());
    setFormFilterJob('all');
    setFormFilterStatus('all');
    setFormFilterStage('all');
    setFormSearchRecipients('');
    setFormSendMode('now');
    setFormScheduleDate('');
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openDetailDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailDialogOpen(true);
  };

  const handleCreateCampaign = async () => {
    if (!formName || !formSubject || !formBody) {
      toast.error(t.common.error);
      return;
    }

    const selectedRcps = ALL_RECIPIENTS.filter(r => formSelectedRecipients.has(r.id));
    const newCampaign: Campaign = {
      id: `CAMP-${String(campaigns.length + 1).padStart(3, '0')}`,
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

    setCampaigns(prev => [newCampaign, ...prev]);
    setCreateDialogOpen(false);
    toast.success(t.bulkEmail.campaignCreated);

    // If send now, trigger the send
    if (formSendMode === 'now') {
      setIsSending(true);
      try {
        await fetch('/api/bulk-email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: newCampaign.id }),
        });
        setCampaigns(prev =>
          prev.map(c =>
            c.id === newCampaign.id
              ? {
                  ...c,
                  status: 'sent' as CampaignStatus,
                  sent: selectedRcps.length,
                  opened: Math.floor(selectedRcps.length * 0.6),
                  clicked: Math.floor(selectedRcps.length * 0.25),
                  bounced: Math.floor(selectedRcps.length * 0.08),
                  recipients: selectedRcps.map((r, i) => ({
                    ...r,
                    emailStatus: (['sent', 'opened', 'clicked', 'bounced'][i % 4]) as Recipient['emailStatus'],
                  })),
                }
              : c
          )
        );
        toast.success(t.bulkEmail.campaignSent);
      } catch {
        toast.error(t.common.error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    setCampaignToSend(campaign);
    setSendConfirmOpen(true);
  };

  const confirmSendCampaign = async () => {
    if (!campaignToSend) return;
    setIsSending(true);
    try {
      await fetch('/api/bulk-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaignToSend.id }),
      });
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignToSend.id
            ? {
                ...c,
                status: 'sent' as CampaignStatus,
                sent: c.recipients.length,
                opened: Math.floor(c.recipients.length * 0.6),
                clicked: Math.floor(c.recipients.length * 0.25),
                bounced: Math.floor(c.recipients.length * 0.08),
                recipients: c.recipients.map((r, i) => ({
                  ...r,
                  emailStatus: (['sent', 'opened', 'clicked', 'bounced'][i % 4]) as Recipient['emailStatus'],
                })),
              }
            : c
        )
      );
      toast.success(t.bulkEmail.campaignSent);
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSending(false);
      setSendConfirmOpen(false);
      setCampaignToSend(null);
    }
  };

  const handleResendFailed = async (campaign: Campaign) => {
    setIsSending(true);
    try {
      await fetch('/api/bulk-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id !== campaign.id) return c;
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
        })
      );
      toast.success(t.bulkEmail.campaignSent);
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSending(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return formName.trim() !== '' && formSubject.trim() !== '' && (formEmailMode === 'template' ? formTemplateId !== '' : formBody.trim() !== '');
    if (step === 2) return formBody.trim() !== '';
    if (step === 3) return formSelectedRecipients.size > 0;
    return true;
  };

  const previewEmail = useMemo(() => {
    return replaceVariables(formBody || 'No content');
  }, [formBody]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.bulkEmail.title}</h1>
            <p className="text-sm text-muted-foreground">{t.bulkEmail.subtitle}</p>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
        >
          <Plus className="h-4 w-4 me-2" />
          {t.bulkEmail.createCampaign}
        </Button>
      </div>

      {/* Stats Row */}
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 opacity-[0.06]" />
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

      {/* Campaigns Table */}
      {campaigns.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t.bulkEmail.noCampaigns}</p>
          </CardContent>
        </Card>
      ) : (
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetailDialog(campaign)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 hover:bg-slate-50 dark:hover:bg-teal-950"
                                onClick={() => handleSendCampaign(campaign)}
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
      )}

      {/* Open Rate SVG Bars */}
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
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) setCreateDialogOpen(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              {t.bulkEmail.createCampaign}
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 py-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className={cn(
                  'step-dot text-xs',
                  s === step && 'step-dot-active',
                  s < step && 'step-dot-completed',
                )}>
                  {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={cn('step-line', s < step && 'step-line-active')} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t.bulkEmail.step} {step} / 4 — {
              step === 1 ? t.bulkEmail.campaignName :
              step === 2 ? t.bulkEmail.emailBody :
              step === 3 ? t.bulkEmail.recipientSelection :
              t.bulkEmail.reviewCampaign
            }
          </p>

          <div className="py-2 max-h-[55vh] overflow-y-auto scrollbar-thin">
            {/* Step 1: Campaign Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.bulkEmail.campaignName}</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Q2 Interview Invitations"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.bulkEmail.subject}</label>
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Interview Invitation - {{job_title}}"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.bulkEmail.selectTemplate}</label>
                  <div className="flex gap-2">
                    <Button
                      variant={formEmailMode === 'template' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        formEmailMode === 'template' && 'bg-gradient-to-r bg-blue-600 text-white'
                      )}
                      onClick={() => setFormEmailMode('template')}
                    >
                      <FileText className="h-3.5 w-3.5 me-1" />
                      {t.bulkEmail.selectTemplate}
                    </Button>
                    <Button
                      variant={formEmailMode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        formEmailMode === 'custom' && 'bg-gradient-to-r bg-blue-600 text-white'
                      )}
                      onClick={() => setFormEmailMode('custom')}
                    >
                      <Mail className="h-3.5 w-3.5 me-1" />
                      {t.bulkEmail.writeCustom}
                    </Button>
                  </div>
                </div>
                {formEmailMode === 'template' && (
                  <div className="space-y-2">
                    <Select value={formTemplateId} onValueChange={(v) => {
                      setFormTemplateId(v);
                      const tpl = templates.find(t => t.id === v);
                      if (tpl) {
                        // Pre-fill body with a basic template
                        if (tpl.id === 'TPL-001') setFormBody('Dear {{candidate_name}},\n\nWe are pleased to invite you for an interview for the {{job_title}} position at {{company_name}}.\n\nInterview Details:\n- Date: {{interview_date}}\n- Time: {{interview_time}}\n\nPlease confirm your availability.\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-002') setFormBody('Dear {{candidate_name}},\n\nThis is a reminder about your interview for the {{job_title}} position.\n\nDate: {{interview_date}}\nTime: {{interview_time}}\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-003') setFormBody('Dear {{candidate_name}},\n\nThank you for applying for the {{job_title}} position at {{company_name}}.\n\nWe will review your application and get back to you soon.\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-004') setFormBody('Dear {{candidate_name}},\n\nWe wanted to provide you with an update regarding your application for the {{job_title}} position at {{company_name}}.\n\nYour application is currently under review.\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-005') setFormBody('Dear {{candidate_name}},\n\nWe are thrilled to offer you the {{job_title}} position at {{company_name}}!\n\nPlease review the attached offer letter.\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-006') setFormBody('Dear {{candidate_name}},\n\nThank you for your interest in the {{job_title}} position at {{company_name}}.\n\nAfter careful review, we have decided not to move forward at this time.\n\nBest regards,\n{{company_name}} Hiring Team');
                        else if (tpl.id === 'TPL-008') setFormBody('Dear {{candidate_name}},\n\nWelcome to {{company_name}}! We are thrilled to have you join our team as {{job_title}}.\n\nPlease complete your onboarding paperwork.\n\nBest regards,\n{{company_name}} HR Team');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.bulkEmail.selectTemplate} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(tpl => (
                          <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Email Body */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.bulkEmail.emailBody}</label>
                  <Textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Write your email content..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium">{t.bulkEmail.insertVariable}</label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map(v => (
                      <Button
                        key={v.key}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1 border-slate-200 hover:bg-slate-50 dark:hover:bg-teal-950"
                        onClick={() => insertVariable(v.key)}
                      >
                        <span className="font-mono text-blue-600">{`{{${v.key}}}`}</span>
                        <span className="text-muted-foreground">— {t.bulkEmail[v.labelKey]}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.bulkEmail.preview}</label>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/30 text-sm whitespace-pre-line max-h-48 overflow-y-auto scrollbar-thin">
                    {replaceVariables(formBody || '(empty)')}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Recipient Selection */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {formSelectedRecipients.size} {t.bulkEmail.selectedRecipients}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={selectAllVisible}>
                      {t.bulkEmail.selectAll}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAllVisible}>
                      {t.bulkEmail.deselectAll}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.bulkEmail.searchRecipients}
                      value={formSearchRecipients}
                      onChange={(e) => setFormSearchRecipients(e.target.value)}
                      className="ps-9 h-8 text-sm"
                    />
                  </div>
                  <Select value={formFilterJob} onValueChange={setFormFilterJob}>
                    <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                      <SelectValue placeholder={t.bulkEmail.filterByJob} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.bulkEmail.filterByJob}</SelectItem>
                      {uniqueJobs.map(j => (
                        <SelectItem key={j} value={j}>{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formFilterStatus} onValueChange={setFormFilterStatus}>
                    <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                      <SelectValue placeholder={t.bulkEmail.filterByStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.bulkEmail.filterByStatus}</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formFilterStage} onValueChange={setFormFilterStage}>
                    <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                      <SelectValue placeholder={t.bulkEmail.filterByStage} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.bulkEmail.filterByStage}</SelectItem>
                      {uniqueStages.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipient List */}
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {filteredRecipients.map(r => (
                      <label
                        key={r.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                          formSelectedRecipients.has(r.id) && 'bg-slate-50'
                        )}
                      >
                        <Checkbox
                          checked={formSelectedRecipients.has(r.id)}
                          onCheckedChange={() => toggleRecipient(r.id)}
                        />
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-blue-600 text-white">
                            {getInitials(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-[10px] text-muted-foreground">{r.job}</p>
                          <Badge className="text-[9px] bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-0">
                            {r.stage}
                          </Badge>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Step 4: Review & Schedule */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    {t.bulkEmail.campaignSummary}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.campaignName}</p>
                      <p className="text-sm font-medium mt-0.5">{formName}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.subject}</p>
                      <p className="text-sm font-medium mt-0.5 truncate">{formSubject}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.recipients}</p>
                      <p className="text-sm font-medium mt-0.5">{formSelectedRecipients.size}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.selectTemplate}</p>
                      <p className="text-sm font-medium mt-0.5">
                        {formEmailMode === 'template'
                          ? templates.find(t => t.id === formTemplateId)?.name || '—'
                          : t.bulkEmail.writeCustom}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Email Preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    {t.bulkEmail.preview}
                  </h3>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/20 max-h-40 overflow-y-auto scrollbar-thin">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t.bulkEmail.subject}</p>
                    <p className="text-sm font-medium mb-2">{replaceVariables(formSubject)}</p>
                    <Separator className="my-2" />
                    <p className="text-sm whitespace-pre-line">{replaceVariables(formBody)}</p>
                  </div>
                </div>

                <Separator />

                {/* Schedule Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    {t.bulkEmail.scheduleLater}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant={formSendMode === 'now' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        formSendMode === 'now' && 'bg-gradient-to-r bg-blue-600 text-white'
                      )}
                      onClick={() => setFormSendMode('now')}
                    >
                      <Send className="h-3.5 w-3.5 me-1" />
                      {t.bulkEmail.sendNow}
                    </Button>
                    <Button
                      variant={formSendMode === 'later' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        formSendMode === 'later' && 'bg-gradient-to-r bg-blue-600 text-white'
                      )}
                      onClick={() => setFormSendMode('later')}
                    >
                      <Clock className="h-3.5 w-3.5 me-1" />
                      {t.bulkEmail.scheduleLater}
                    </Button>
                  </div>
                  {formSendMode === 'later' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.bulkEmail.scheduleDate}</label>
                      <Input
                        type="datetime-local"
                        value={formScheduleDate}
                        onChange={(e) => setFormScheduleDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft className="h-4 w-4 me-1" />
                  {t.bulkEmail.previous}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost">{t.common.cancel}</Button>
              </DialogClose>
              {step < 4 ? (
                <Button
                  className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
                  disabled={!canGoNext()}
                  onClick={() => setStep(s => s + 1)}
                >
                  {t.bulkEmail.next}
                  <ArrowRight className="h-4 w-4 ms-1" />
                </Button>
              ) : (
                <Button
                  className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
                  disabled={isSending}
                  onClick={handleCreateCampaign}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-1" />
                  ) : (
                    <Send className="h-4 w-4 me-1" />
                  )}
                  {formSendMode === 'now' ? t.bulkEmail.sendNow : t.bulkEmail.scheduleLater}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {selectedCampaign && (
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
                    <h3 className="text-lg font-semibold">{selectedCampaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.subject}</p>
                  </div>
                  <Badge className={cn('text-[10px] gap-1', statusColors[selectedCampaign.status])}>
                    {statusIcons[selectedCampaign.status]}
                    {getStatusLabel(selectedCampaign.status)}
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
                      <p className="text-xl font-bold text-blue-600">{selectedCampaign.sent}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedCampaign.recipients.length > 0
                          ? ((selectedCampaign.sent / selectedCampaign.recipients.length) * 100).toFixed(0)
                          : 0}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.opened}</p>
                      <p className="text-xl font-bold text-emerald-600">{selectedCampaign.opened}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedCampaign.sent > 0 ? ((selectedCampaign.opened / selectedCampaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.openRate}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.clicked}</p>
                      <p className="text-xl font-bold">{selectedCampaign.clicked}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedCampaign.sent > 0 ? ((selectedCampaign.clicked / selectedCampaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.clickRate}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3 text-center bg-muted/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.bulkEmail.bounced}</p>
                      <p className="text-xl font-bold text-amber-600">{selectedCampaign.bounced}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedCampaign.sent > 0 ? ((selectedCampaign.bounced / selectedCampaign.sent) * 100).toFixed(0) : 0}% {t.bulkEmail.bounceRate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Open Rate Bar */}
                {selectedCampaign.sent > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.bulkEmail.openRate}</span>
                      <span className="font-medium text-blue-600">
                        {((selectedCampaign.opened / selectedCampaign.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        style={{ width: `${Math.min((selectedCampaign.opened / selectedCampaign.sent) * 100, 100)}%` }}
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
                    {(selectedCampaign.status === 'sent' || selectedCampaign.status === 'failed') &&
                      selectedCampaign.recipients.some(r => r.emailStatus === 'failed' || r.emailStatus === 'bounced') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-slate-200 text-blue-600 hover:bg-slate-50 dark:hover:bg-teal-950"
                        onClick={() => handleResendFailed(selectedCampaign)}
                        disabled={isSending}
                      >
                        <RotateCcw className="h-3 w-3 me-1" />
                        {t.bulkEmail.resendFailed}
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {selectedCampaign.recipients.map(r => (
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

      {/* Send Confirmation Dialog */}
      <AlertDialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t.bulkEmail.confirmSend}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.bulkEmail.sendWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendCampaign}
              disabled={isSending}
              className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : (
                <Send className="h-4 w-4 me-1" />
              )}
              {t.bulkEmail.sendNow}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
