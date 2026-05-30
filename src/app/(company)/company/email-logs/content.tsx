// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Mail,
  MailCheck,
  Send,
  Search,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Filter,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  status: string;
  templateId: string | null;
  provider: string | null;
  sentAt: string | null;
  createdAt: string;
  error: string | null;
  body?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  SENT: {
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
    icon: CheckCircle2,
  },
  FAILED: {
    color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
    icon: XCircle,
  },
  BOUNCED: {
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
    icon: AlertTriangle,
  },
  PENDING: {
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-0',
    icon: Clock,
  },
};

export default function EmailLogsContent() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchRecipient, setSearchRecipient] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewLog, setPreviewLog] = useState<EmailLogEntry | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Send email dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchRecipient) params.set('recipient', searchRecipient);

      const res = await fetch(`/api/emails/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchRecipient]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/email-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/emails/logs?limit=1000');
      if (res.ok) {
        const data = await res.json();
        const allLogs: EmailLogEntry[] = data.logs || [];
        setStats({
          totalSent: allLogs.length,
          delivered: allLogs.filter((l) => l.status === 'SENT').length,
          failed: allLogs.filter((l) => l.status === 'FAILED').length,
          bounced: allLogs.filter((l) => l.status === 'BOUNCED').length,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handlePreview = async (log: EmailLogEntry) => {
    setPreviewLog(log);
    setPreviewDialogOpen(true);
    if (!log.body) {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/emails/${log.id}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewLog(data.emailLog);
        }
      } catch {
        // silently fail
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleSendEmail = async () => {
    if (!sendTo || !sendSubject || !sendBody) {
      toast.error(t.emailLogs.sendFailed);
      return;
    }
    setSending(true);
    try {
      const body: Record<string, unknown> = {
        to: sendTo,
        subject: sendSubject,
        body: sendBody,
      };
      if (selectedTemplateId) {
        body.templateId = selectedTemplateId;
        body.variables = templateVariables;
      }

      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(t.emailLogs.sendSuccess);
        setSendDialogOpen(false);
        resetSendForm();
        fetchLogs();
        fetchStats();
      } else {
        toast.error(t.emailLogs.sendFailed);
      }
    } catch {
      toast.error(t.emailLogs.sendFailed);
    } finally {
      setSending(false);
    }
  };

  const resetSendForm = () => {
    setSendTo('');
    setSendSubject('');
    setSendBody('');
    setSelectedTemplateId('');
    setTemplateVariables({});
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setTemplateVariables({});
      return;
    }
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setSendSubject(tpl.subject);
      setSendBody(tpl.body);
      // Parse variables from template
      try {
        const vars = tpl.variables ? JSON.parse(tpl.variables) : [];
        const varMap: Record<string, string> = {};
        if (Array.isArray(vars)) {
          vars.forEach((v: string) => {
            varMap[v] = '';
          });
        }
        setTemplateVariables(varMap);
      } catch {
        setTemplateVariables({});
      }
    }
  };

  const handleResend = async (log: EmailLogEntry) => {
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: log.to,
          subject: log.subject,
          body: 'Resent email',
          templateId: log.templateId || undefined,
        }),
      });
      if (res.ok) {
        toast.success(t.emailLogs.sendSuccess);
        fetchLogs();
        fetchStats();
      } else {
        toast.error(t.emailLogs.sendFailed);
      }
    } catch {
      toast.error(t.emailLogs.sendFailed);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    const label = status === 'SENT'
      ? t.emailLogs.sent
      : status === 'FAILED'
        ? t.emailLogs.failed
        : status === 'BOUNCED'
          ? t.emailLogs.bounced
          : t.emailLogs.pending;

    return (
      <Badge className={cn('text-[10px] gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedTemplate = useMemo(() => {
    return templates.find((tpl) => tpl.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const templateVarKeys = useMemo(() => {
    return Object.keys(templateVariables);
  }, [templateVariables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.emailLogs.title}</h1>
            <p className="text-sm text-muted-foreground">{t.emailLogs.subtitle}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetSendForm();
            setSendDialogOpen(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
        >
          <Send className="h-4 w-4 me-2" />
          {t.emailLogs.sendEmail}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailLogs.totalSent}</p>
                <p className="text-xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailLogs.delivered}</p>
                <p className="text-xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailLogs.failed}</p>
                <p className="text-xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailLogs.bounced}</p>
                <p className="text-xl font-bold">{stats.bounced}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.emailLogs.searchRecipient}
            value={searchRecipient}
            onChange={(e) => {
              setSearchRecipient(e.target.value);
              setPage(1);
            }}
            className="ps-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder={t.emailLogs.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.emailLogs.filterAll}</SelectItem>
              <SelectItem value="SENT">{t.emailLogs.sent}</SelectItem>
              <SelectItem value="FAILED">{t.emailLogs.failed}</SelectItem>
              <SelectItem value="BOUNCED">{t.emailLogs.bounced}</SelectItem>
              <SelectItem value="PENDING">{t.emailLogs.pending}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { fetchLogs(); fetchStats(); }}
          className="ms-auto h-8"
        >
          <RefreshCw className="h-3.5 w-3.5 me-1" />
        </Button>
      </div>

      {/* Email Logs Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{t.emailLogs.noLogs}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">
                      <div className="flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3" />
                        {t.emailLogs.to}
                      </div>
                    </th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{t.emailLogs.subject}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.emailLogs.status}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{t.emailLogs.template}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{t.emailLogs.sentAt}</th>
                    <th className="text-end text-xs font-medium text-muted-foreground p-3">{t.emailLogs.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => handlePreview(log)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium truncate max-w-[180px]">{log.to}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{log.subject}</p>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {log.templateId ? (
                          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-[10px]">
                            <FileText className="h-2.5 w-2.5 me-0.5" />
                            {t.emailLogs.template}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t.emailLogs.noTemplate}</span>
                        )}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(log.sentAt || log.createdAt)}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(log)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.emailLogs.preview}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleResend(log)}
                                  disabled={log.status === 'PENDING'}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.emailLogs.resend}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total} {t.emailLogs.totalSent.toLowerCase()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8"
            >
              ‹
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8"
            >
              ›
            </Button>
          </div>
        </div>
      )}

      {/* Email Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              {t.emailLogs.emailPreview}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : previewLog ? (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {/* Email Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.from}</p>
                  <p className="text-sm">{previewLog.from}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.to}</p>
                  <p className="text-sm">{previewLog.to}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.subject}</p>
                  <p className="text-sm font-medium">{previewLog.subject}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.status}</p>
                  {getStatusBadge(previewLog.status)}
                </div>
                {previewLog.templateId && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.template}</p>
                    <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-[10px]">
                      <FileText className="h-2.5 w-2.5 me-0.5" />
                      {t.emailLogs.template}
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.sentAt}</p>
                  <p className="text-sm">{formatDate(previewLog.sentAt || previewLog.createdAt)}</p>
                </div>
                {previewLog.provider && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.provider}</p>
                    <p className="text-sm">{previewLog.provider}</p>
                  </div>
                )}
                {previewLog.error && (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.error}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{previewLog.error}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email Body Preview */}
              {previewLog.body && (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailLogs.body}</p>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <iframe
                      srcDoc={previewLog.body}
                      className="w-full min-h-[300px] bg-white"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.emailLogs.close}</Button>
            </DialogClose>
            {previewLog && previewLog.status !== 'PENDING' && (
              <Button
                onClick={() => {
                  handleResend(previewLog);
                  setPreviewDialogOpen(false);
                }}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              >
                <RefreshCw className="h-4 w-4 me-2" />
                {t.emailLogs.resend}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              {t.emailLogs.sendNewEmail}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailLogs.selectTemplate}</label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t.emailLogs.selectTemplate} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.emailLogs.noTemplate}</SelectItem>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Variables */}
            {templateVarKeys.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <label className="text-sm font-medium">{t.emailLogs.variables}</label>
                </div>
                <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30">
                  <CardContent className="p-3 space-y-2">
                    {templateVarKeys.map((varKey) => (
                      <div key={varKey} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-teal-600 dark:text-teal-400 min-w-[140px]">
                          {`{{${varKey}}}`}
                        </span>
                        <Input
                          value={templateVariables[varKey]}
                          onChange={(e) =>
                            setTemplateVariables((prev) => ({
                              ...prev,
                              [varKey]: e.target.value,
                            }))
                          }
                          placeholder={varKey}
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            <Separator />

            {/* To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailLogs.to}</label>
              <Input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="candidate@example.com"
                type="email"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailLogs.subject}</label>
              <Input
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
                placeholder={t.emailLogs.subject}
                disabled={!!selectedTemplateId}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailLogs.body}</label>
              <Textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                placeholder={t.emailLogs.body}
                className="min-h-[200px] font-mono text-sm"
                disabled={!!selectedTemplateId}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetSendForm}>{t.common.cancel}</Button>
            </DialogClose>
            <Button
              onClick={handleSendEmail}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              disabled={!sendTo || !sendSubject || !sendBody || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t.emailLogs.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 me-2" />
                  {t.emailLogs.sendEmail}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
