// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  Settings,
  Play,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Types
interface AuditRecord {
  id: string;
  companyId: string;
  auditType: string;
  dateRange: string;
  totalCandidates: number;
  metrics: string;
  adverseImpact: string;
  recommendations: string;
  status: string;
  complianceScore: number;
  createdAt: string;
}

interface FairHiringConfigData {
  id: string;
  companyId: string;
  biasDetectionEnabled: boolean;
  protectedAttributes: string;
  autoFlagThreshold: number;
  auditFrequency: string;
  lastAuditAt: string | null;
}

// Color helpers
function getImpactColor(rate: number, threshold: number): string {
  if (rate >= threshold) return 'text-emerald-700';
  if (rate >= threshold * 0.7) return 'text-amber-700';
  return 'text-red-700';
}

function getImpactBg(rate: number, threshold: number): string {
  if (rate >= threshold) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (rate >= threshold * 0.7) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function getStatusBadge(status: string, t: ReturnType<typeof useI18n>['t']) {
  if (status === 'COMPLETED') {
    return (
      <Badge variant="outline" className="text-xs px-2 py-0.5 border-0 bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3 me-1" />
        {t.fairHiring.completed}
      </Badge>
    );
  }
  if (status === 'FLAGGED') {
    return (
      <Badge variant="outline" className="text-xs px-2 py-0.5 border-0 bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3 me-1" />
        {t.fairHiring.flagged}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs px-2 py-0.5 border-0 bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3 me-1" />
      {t.fairHiring.pending}
    </Badge>
  );
}

function getAuditTypeLabel(type: string, t: ReturnType<typeof useI18n>['t']): string {
  const map: Record<string, string> = {
    SCREENING: t.fairHiring.screening,
    MATCH_SCORING: t.fairHiring.matchScoring,
    RISK_ANALYSIS: t.fairHiring.riskAnalysis,
    OVERALL: t.fairHiring.overall,
  };
  return map[type] || type;
}

export default function FairHiringContent() {
  const { t } = useI18n();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [config, setConfig] = useState<FairHiringConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // New audit form
  const [auditType, setAuditType] = useState('OVERALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Config form
  const [biasEnabled, setBiasEnabled] = useState(true);
  const [threshold, setThreshold] = useState(0.8);
  const [frequency, setFrequency] = useState('MONTHLY');
  const [protectedAttrs, setProtectedAttrs] = useState<string[]>(['gender', 'ethnicity', 'veteranStatus', 'disabilityStatus']);

  // Use a default company ID for demo purposes
  const companyId = 'demo-company-1';

  // Fetch audits and config on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [auditsRes, configRes] = await Promise.all([
          fetch(`/api/ai/bias-audit?companyId=${companyId}`),
          fetch(`/api/companies/fair-hiring-config?companyId=${companyId}`),
        ]);

        if (auditsRes.ok) {
          const auditsData = await auditsRes.json();
          setAudits(auditsData.audits || []);
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          const cfg = configData.config;
          setConfig(cfg);
          if (cfg) {
            setBiasEnabled(cfg.biasDetectionEnabled);
            setThreshold(cfg.autoFlagThreshold);
            setFrequency(cfg.auditFrequency);
            try {
              const attrs = JSON.parse(cfg.protectedAttributes);
              if (Array.isArray(attrs)) setProtectedAttrs(attrs);
            } catch { /* keep defaults */ }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  // Compute stats
  const totalAudits = audits.length;
  const lastAuditStatus = audits.length > 0 ? audits[0].status : '—';
  const adverseImpactFlags = audits.filter((a) => a.status === 'FLAGGED').length;
  const complianceScore = audits.length > 0 ? audits[0].complianceScore : 100;

  // Run new audit
  const handleRunAudit = useCallback(async () => {
    setRunningAudit(true);
    try {
      const res = await fetch('/api/ai/bias-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          auditType,
          dateRange: fromDate || toDate ? { from: fromDate || undefined, to: toDate || undefined } : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to run audit');
      }

      const data = await res.json();
      setAudits((prev) => [data.audit, ...prev]);
      toast.success(t.fairHiring.auditComplete);
      setNewAuditOpen(false);
      setAuditType('OVERALL');
      setFromDate('');
      setToDate('');
    } catch (error) {
      console.error('Error running audit:', error);
      toast.error(t.fairHiring.auditError);
    } finally {
      setRunningAudit(false);
    }
  }, [companyId, auditType, fromDate, toDate, t]);

  // Save config
  const handleSaveConfig = useCallback(async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/companies/fair-hiring-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          biasDetectionEnabled: biasEnabled,
          protectedAttributes: protectedAttrs,
          autoFlagThreshold: threshold,
          auditFrequency: frequency,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save config');
      }

      const data = await res.json();
      setConfig(data.config);
      toast.success(t.fairHiring.configSaved);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  }, [companyId, biasEnabled, protectedAttrs, threshold, frequency, t]);

  // View audit detail
  const handleViewDetail = useCallback((audit: AuditRecord) => {
    setSelectedAudit(audit);
    setDetailOpen(true);
  }, []);

  // Parse audit detail data
  const parseAuditDetail = (audit: AuditRecord) => {
    let metrics = {};
    let adverseImpact = { hasAnyAdverseImpact: false, fourFifthsRule: {} as Record<string, unknown> };
    let recommendations: string[] = [];

    try { metrics = JSON.parse(audit.metrics as string); } catch { /* empty */ }
    try { adverseImpact = JSON.parse(audit.adverseImpact as string); } catch { /* empty */ }
    try { recommendations = JSON.parse(audit.recommendations as string); } catch { /* empty */ }

    return { metrics, adverseImpact, recommendations };
  };

  // Toggle protected attribute
  const toggleProtectedAttr = (attr: string) => {
    setProtectedAttrs((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  // Stat card config
  const statCards = [
    {
      title: t.fairHiring.totalAudits,
      value: totalAudits,
      icon: FileText,
      bgColor: 'bg-slate-50',
      iconColor: 'text-blue-600',
    },
    {
      title: t.fairHiring.lastAudit,
      value: lastAuditStatus === '—' ? '—' : '',
      icon: Clock,
      bgColor: lastAuditStatus === 'FLAGGED'
        ? 'bg-red-50 dark:bg-red-950/30'
        : 'bg-emerald-50',
      iconColor: lastAuditStatus === 'FLAGGED'
        ? 'text-red-600'
        : 'text-emerald-600',
      badge: lastAuditStatus !== '—' ? lastAuditStatus : undefined,
    },
    {
      title: t.fairHiring.adverseImpactFlags,
      value: adverseImpactFlags,
      icon: ShieldAlert,
      bgColor: adverseImpactFlags > 0
        ? 'bg-red-50 dark:bg-red-950/30'
        : 'bg-emerald-50',
      iconColor: adverseImpactFlags > 0
        ? 'text-red-600'
        : 'text-emerald-600',
    },
    {
      title: t.fairHiring.complianceScore,
      value: `${complianceScore}%`,
      icon: ShieldCheck,
      bgColor: complianceScore >= 80
        ? 'bg-emerald-50'
        : complianceScore >= 50
          ? 'bg-amber-50 dark:bg-amber-950/30'
          : 'bg-red-50 dark:bg-red-950/30',
      iconColor: complianceScore >= 80
        ? 'text-emerald-600'
        : complianceScore >= 50
          ? 'text-amber-600'
          : 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-muted-foreground">{t.common.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            {t.fairHiring.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.fairHiring.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {t.common.poweredBy}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setNewAuditOpen(true)}
          >
            <Play className="w-4 h-4 me-1.5" />
            {t.fairHiring.runNewAudit}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="card-animate-fade-in-up relative overflow-hidden border-0 shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 dark:from-teal-950/20 dark:to-emerald-950/20" />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {card.badge ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs px-2 py-0.5 border-0',
                            card.badge === 'FLAGGED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          {card.badge}
                        </Badge>
                      ) : (
                        card.value
                      )}
                    </p>
                  </div>
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.bgColor)}>
                    <Icon className={cn('w-5 h-5', card.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Status Banner */}
      <Card className={cn(
        'animate-fade-in-up border-0 shadow-sm overflow-hidden',
      )} style={{ animationDelay: '0.15s' }}>
        <div className={cn(
          'absolute inset-0',
          complianceScore >= 80
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
            : complianceScore >= 50
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
              : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
        )} />
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {complianceScore >= 80 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : complianceScore >= 50 ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="text-sm font-semibold">{t.fairHiring.complianceStatus}</p>
                <p className="text-xs text-muted-foreground">
                  {complianceScore >= 80
                    ? 'Your hiring process meets EU AI Act requirements'
                    : complianceScore >= 50
                      ? 'Some areas need attention for full compliance'
                      : 'Immediate action required to meet EU AI Act standards'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    complianceScore >= 80
                      ? 'bg-emerald-500'
                      : complianceScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
              <span className="text-sm font-bold">{complianceScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit History - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="animate-fade-in-up border-0 shadow-sm" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {t.fairHiring.auditHistory}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {audits.length === 0 ? (
                <div className="py-12 text-center">
                  <ShieldCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">{t.fairHiring.noAudits}</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fairHiring.auditType}</th>
                        <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fairHiring.totalCandidates}</th>
                        <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fairHiring.adverseImpact}</th>
                        <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fairHiring.status}</th>
                        <th className="text-start p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.common.status}</th>
                        <th className="text-end p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.fairHiring.viewDetails}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((audit) => {
                        let hasAdverse = false;
                        try {
                          const imp = JSON.parse(audit.adverseImpact as string);
                          hasAdverse = imp?.hasAnyAdverseImpact || false;
                        } catch { /* empty */ }
                        return (
                          <tr
                            key={audit.id}
                            className="border-b border-border/30 hover:bg-accent/20 transition-colors cursor-pointer"
                            onClick={() => handleViewDetail(audit)}
                          >
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs px-2 py-0.5 border-0 bg-teal-100 text-blue-700">
                                {getAuditTypeLabel(audit.auditType, t)}
                              </Badge>
                            </td>
                            <td className="p-3 font-medium">{audit.totalCandidates}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs px-2 py-0.5 border-0',
                                  hasAdverse
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700',
                                )}
                              >
                                {hasAdverse ? t.fairHiring.detected : t.fairHiring.notDetected}
                              </Badge>
                            </td>
                            <td className="p-3">{getStatusBadge(audit.status, t)}</td>
                            <td className="p-3 text-xs text-muted-foreground">
                              {new Date(audit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="p-3 text-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4 me-1" />
                                {t.fairHiring.viewDetails}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Config Panel - 1 col */}
        <div className="space-y-4">
          <Card className="animate-fade-in-up border-0 shadow-sm" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                {t.fairHiring.config}
              </CardTitle>
              <CardDescription className="text-xs">{t.fairHiring.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {/* Bias Detection Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t.fairHiring.biasDetection}</Label>
                  <p className="text-xs text-muted-foreground">
                    {biasEnabled ? t.fairHiring.enabled : t.fairHiring.disabled}
                  </p>
                </div>
                <Switch
                  checked={biasEnabled}
                  onCheckedChange={setBiasEnabled}
                />
              </div>

              <Separator />

              {/* Auto-Flag Threshold */}
              <div>
                <Label className="text-sm font-medium">{t.fairHiring.autoFlagThreshold}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {(threshold * 100).toFixed(0)}% (4/5ths rule)
                </p>
                <Slider
                  value={[threshold]}
                  onValueChange={([v]) => setThreshold(v)}
                  min={0.5}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <Separator />

              {/* Protected Attributes */}
              <div>
                <Label className="text-sm font-medium">{t.fairHiring.protectedAttributes}</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { key: 'gender', label: t.fairHiring.gender },
                    { key: 'ethnicity', label: t.fairHiring.ethnicity },
                    { key: 'veteranStatus', label: t.fairHiring.veteranStatus },
                    { key: 'disabilityStatus', label: t.fairHiring.disabilityStatus },
                  ].map((attr) => (
                    <div key={attr.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`attr-${attr.key}`}
                        checked={protectedAttrs.includes(attr.key)}
                        onCheckedChange={() => toggleProtectedAttr(attr.key)}
                      />
                      <Label htmlFor={`attr-${attr.key}`} className="text-sm font-normal cursor-pointer">
                        {attr.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Audit Frequency */}
              <div>
                <Label className="text-sm font-medium">{t.fairHiring.auditFrequency}</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-full h-9 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">{t.fairHiring.weekly}</SelectItem>
                    <SelectItem value="MONTHLY">{t.fairHiring.monthly}</SelectItem>
                    <SelectItem value="QUARTERLY">{t.fairHiring.quarterly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSaveConfig}
                disabled={savingConfig}
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  t.fairHiring.saveConfig
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Audit Dialog */}
      <Dialog open={newAuditOpen} onOpenChange={setNewAuditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              {t.fairHiring.runNewAudit}
            </DialogTitle>
            <DialogDescription>{t.fairHiring.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Audit Type */}
            <div>
              <Label className="text-sm font-medium">{t.fairHiring.auditType}</Label>
              <Select value={auditType} onValueChange={setAuditType}>
                <SelectTrigger className="w-full h-9 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCREENING">{t.fairHiring.screening}</SelectItem>
                  <SelectItem value="MATCH_SCORING">{t.fairHiring.matchScoring}</SelectItem>
                  <SelectItem value="RISK_ANALYSIS">{t.fairHiring.riskAnalysis}</SelectItem>
                  <SelectItem value="OVERALL">{t.fairHiring.overall}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium">{t.fairHiring.dateRange}</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <div>
                  <Label className="text-xs text-muted-foreground">{t.fairHiring.fromDate}</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t.fairHiring.toDate}</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setNewAuditOpen(false)}
              disabled={runningAudit}
            >
              {t.common.cancel}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleRunAudit}
              disabled={runningAudit}
            >
              {runningAudit ? (
                <>
                  <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                  {t.fairHiring.auditRunning}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 me-1.5" />
                  {t.fairHiring.runNewAudit}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto dialog-content-glow">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {t.fairHiring.viewDetails}
            </DialogTitle>
            <DialogDescription>
              {selectedAudit ? getAuditTypeLabel(selectedAudit.auditType, t) : ''} — {selectedAudit ? new Date(selectedAudit.createdAt).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedAudit && (() => {
            const { adverseImpact: impact, recommendations: recs } = parseAuditDetail(selectedAudit);
            const fourFifthsRule = (impact?.fourFifthsRule || {}) as Record<string, { hasAdverseImpact: boolean; details: Array<{ group: string; applied: number; hired: number; selectionRate: number; fourFifthsThreshold: number; passes: boolean }> }>;
            const hasAny = impact?.hasAnyAdverseImpact || false;

            // Build demographic group label map
            const attrLabels: Record<string, string> = {
              gender: t.fairHiring.gender,
              ethnicity: t.fairHiring.ethnicity,
              veteran: t.fairHiring.veteranStatus,
              disability: t.fairHiring.disabilityStatus,
            };

            return (
              <div className="space-y-6 mt-4">
                {/* Compliance Status */}
                <div className={cn(
                  'flex items-center justify-between p-4 rounded-xl border',
                  !hasAny
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30',
                )}>
                  <div className="flex items-center gap-3">
                    {!hasAny ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{t.fairHiring.complianceStatus}</p>
                      <p className="text-xs text-muted-foreground">
                        {!hasAny ? 'All groups pass the 4/5ths rule' : 'Adverse impact detected in one or more groups'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-3 py-1 border-0',
                      !hasAny
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {selectedAudit.complianceScore}%
                  </Badge>
                </div>

                <Separator />

                {/* 4/5ths Rule Analysis per Demographic Group */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    {t.fairHiring.fourFifthsRule}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(fourFifthsRule).map(([attrKey, attrData]) => {
                      const label = attrLabels[attrKey] || attrKey;
                      const details = attrData?.details || [];
                      if (details.length === 0) return null;
                      const maxRate = Math.max(...details.map((d) => d.selectionRate), 0);
                      const thresholdVal = maxRate * 0.8;

                      return (
                        <div key={attrKey} className="rounded-lg border border-border/50 overflow-hidden">
                          <div className={cn(
                            'px-4 py-2 text-sm font-medium flex items-center justify-between',
                            attrData?.hasAdverseImpact
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : 'bg-emerald-50 dark:bg-emerald-950/20',
                          )}>
                            <span className="flex items-center gap-2">
                              {attrData?.hasAdverseImpact ? (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              {label}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0 border-0',
                                attrData?.hasAdverseImpact
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700',
                              )}
                            >
                              {attrData?.hasAdverseImpact ? t.fairHiring.failed : t.fairHiring.passed}
                            </Badge>
                          </div>
                          <div className="p-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border/30">
                                  <th className="text-start p-2 text-xs font-semibold text-muted-foreground">{t.fairHiring.demographicGroup}</th>
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">Applied</th>
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">Hired</th>
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">{t.fairHiring.selectionRate}</th>
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">4/5ths</th>
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">{t.common.status}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.map((d) => (
                                  <tr key={d.group} className="border-b border-border/20">
                                    <td className="p-2 font-medium text-xs">{d.group}</td>
                                    <td className="p-2 text-center text-xs">{d.applied}</td>
                                    <td className="p-2 text-center text-xs">{d.hired}</td>
                                    <td className="p-2 text-center">
                                      <span className={cn('text-xs font-semibold', getImpactColor(d.selectionRate, thresholdVal))}>
                                        {d.selectionRate}%
                                      </span>
                                    </td>
                                    <td className="p-2 text-center text-xs text-muted-foreground">{thresholdVal.toFixed(1)}%</td>
                                    <td className="p-2 text-center">
                                      <Badge
                                        variant="outline"
                                        className={cn('text-[10px] px-1.5 py-0 border-0', getImpactBg(d.selectionRate, thresholdVal), getImpactColor(d.selectionRate, thresholdVal))}
                                      >
                                        {d.passes ? t.fairHiring.passed : t.fairHiring.failed}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* AI Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    {t.fairHiring.recommendations}
                  </h4>
                  {recs.length > 0 ? (
                    <div className="space-y-2">
                      {recs.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-blue-700 text-xs font-bold">
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-border/50 bg-emerald-50/50 dark:bg-emerald-950/10 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.fairHiring.noRecommendations}</p>
                    </div>
                  )}
                </div>

                {/* Audit Summary */}
                <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.fairHiring.auditType}</p>
                      <p className="text-sm font-semibold">{getAuditTypeLabel(selectedAudit.auditType, t)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.fairHiring.totalCandidates}</p>
                      <p className="text-sm font-semibold">{selectedAudit.totalCandidates}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.fairHiring.adverseImpact}</p>
                      <p className="text-sm font-semibold">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs px-2 py-0.5 border-0',
                            hasAny
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          {hasAny ? t.fairHiring.detected : t.fairHiring.notDetected}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
