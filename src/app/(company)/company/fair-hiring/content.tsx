'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Scale,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImpactDetail {
  group: string;
  applied: number;
  selected: number;
  selectionRate: number;
  thresholdRate: number;
  ratio: number;
  passes: boolean;
}

interface AttributeImpact {
  hasAdverseImpact: boolean;
  referenceRate: number;
  thresholdRatio: number;
  details: ImpactDetail[];
}

interface AuditRecord {
  id: string;
  auditType: string;
  dateRange: { from?: string; to?: string };
  totalCandidates: number;
  metrics: Record<string, unknown>;
  adverseImpact: {
    selectionRateRule?: Record<string, AttributeImpact>;
    hasAnyAdverseImpact?: boolean;
    disclaimer?: string;
  };
  recommendations: string[];
  status: 'PENDING' | 'COMPLETED' | 'FLAGGED';
  complianceScore: number;
  createdAt: string;
}

interface FairHiringConfigData {
  id: string;
  biasDetectionEnabled: boolean;
  protectedAttributes: string[];
  autoFlagThreshold: number;
  auditFrequency: string;
  lastAuditAt: string | null;
}

const ATTRIBUTES = [
  { id: 'gender', label: 'Gender' },
  { id: 'ethnicity', label: 'Ethnicity' },
  { id: 'veteranStatus', label: 'Veteran status' },
  { id: 'disabilityStatus', label: 'Disability status' },
] as const;

const editorRoles = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
];
const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_ADMIN'];

function attributeLabel(value: string): string {
  return ATTRIBUTES.find((attribute) => attribute.id === value)?.label || value;
}

export default function FairHiringContent() {
  const { user, validateSession } = useAuth();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [config, setConfig] = useState<FairHiringConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditType, setAuditType] = useState('OVERALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [biasEnabled, setBiasEnabled] = useState(true);
  const [threshold, setThreshold] = useState('0.8');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [protectedAttributes, setProtectedAttributes] = useState<string[]>([
    'gender',
    'ethnicity',
    'veteranStatus',
    'disabilityStatus',
  ]);
  const [savingConfig, setSavingConfig] = useState(false);

  const canRunAudit = editorRoles.includes(user?.role || '');
  const canManageConfig = adminRoles.includes(user?.role || '');

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [auditsResponse, configResponse] = await Promise.all([
        fetch('/api/ai/bias-audit', { cache: 'no-store' }),
        fetch('/api/companies/fair-hiring-config', { cache: 'no-store' }),
      ]);
      if (!auditsResponse.ok) {
        throw new Error(
          await getApiErrorMessage(auditsResponse, 'Unable to load audits'),
        );
      }
      if (!configResponse.ok) {
        throw new Error(
          await getApiErrorMessage(configResponse, 'Unable to load settings'),
        );
      }

      const auditData = await auditsResponse.json();
      const configData = await configResponse.json();
      const nextConfig = configData.config as FairHiringConfigData;
      setAudits(Array.isArray(auditData.audits) ? auditData.audits : []);
      setConfig(nextConfig);
      setBiasEnabled(nextConfig.biasDetectionEnabled);
      setThreshold(String(nextConfig.autoFlagThreshold));
      setFrequency(nextConfig.auditFrequency);
      setProtectedAttributes(
        Array.isArray(nextConfig.protectedAttributes) &&
          nextConfig.protectedAttributes.length > 0
          ? nextConfig.protectedAttributes
          : ['gender'],
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load fair-hiring data',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void validateSession();
    void load();
  }, [validateSession]);

  const stats = useMemo(
    () => ({
      total: audits.length,
      flagged: audits.filter((audit) => audit.status === 'FLAGGED').length,
      candidates: audits.reduce(
        (sum, audit) => sum + audit.totalCandidates,
        0,
      ),
      latestScore: audits[0]?.complianceScore ?? null,
    }),
    [audits],
  );

  async function runAudit() {
    if (!canRunAudit) {
      toast.error('Your role cannot run fair-hiring audits');
      return;
    }
    setRunningAudit(true);
    try {
      const response = await apiFetch('/api/ai/bias-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditType,
          dateRange:
            fromDate || toDate
              ? {
                  from: fromDate || undefined,
                  to: toDate || undefined,
                }
              : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to run audit'),
        );
      }
      const data = await response.json();
      setAudits((current) => [data.audit, ...current]);
      setNewAuditOpen(false);
      setAuditType('OVERALL');
      setFromDate('');
      setToDate('');
      toast.success('Fair-hiring audit completed');
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to run audit',
      );
    } finally {
      setRunningAudit(false);
    }
  }

  async function saveConfig() {
    if (!canManageConfig) {
      toast.error('Only company administrators can change these settings');
      return;
    }
    const numericThreshold = Number(threshold);
    if (
      !Number.isFinite(numericThreshold) ||
      numericThreshold < 0.5 ||
      numericThreshold > 1
    ) {
      toast.error('The selection-rate threshold must be between 0.5 and 1');
      return;
    }
    if (protectedAttributes.length === 0) {
      toast.error('Select at least one protected attribute');
      return;
    }

    setSavingConfig(true);
    try {
      const response = await apiFetch('/api/companies/fair-hiring-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biasDetectionEnabled: biasEnabled,
          protectedAttributes,
          autoFlagThreshold: numericThreshold,
          auditFrequency: frequency,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to save settings'),
        );
      }
      const data = await response.json();
      setConfig(data.config);
      toast.success('Fair-hiring settings saved');
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to save settings',
      );
    } finally {
      setSavingConfig(false);
    }
  }

  function toggleAttribute(attribute: string, checked: boolean) {
    setProtectedAttributes((current) =>
      checked
        ? [...new Set([...current, attribute])]
        : current.filter((item) => item !== attribute),
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
        <Card className="h-72 animate-pulse bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Fair hiring</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor selection-rate differences using real applications from
              your company.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setNewAuditOpen(true)}
            disabled={!canRunAudit || !config?.biasDetectionEnabled}
          >
            <BarChart3 className="me-2 h-4 w-4" />
            Run audit
          </Button>
        </div>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Statistical monitoring, not legal advice</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The audit compares observed selection rates. Small samples can be
              unstable, and a flag is not a legal finding or compliance
              certification. Qualified HR and legal professionals should review
              material employment decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Audits', value: stats.total, icon: FileText },
          { label: 'Flagged audits', value: stats.flagged, icon: AlertTriangle },
          {
            label: 'Applications analyzed',
            value: stats.candidates,
            icon: BarChart3,
          },
          {
            label: 'Latest score',
            value:
              stats.latestScore === null ? '—' : `${stats.latestScore}%`,
            icon: ShieldCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit history</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Scale className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-3 font-medium">No audits yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run an audit after your company has enough application data to
                  compare selection rates.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-end">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium">
                          {audit.auditType.replaceAll('_', ' ')}
                        </TableCell>
                        <TableCell>{audit.totalCandidates}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              audit.status === 'FLAGGED'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            }
                          >
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{audit.complianceScore}%</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAudit(audit)}
                          >
                            <Eye className="me-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-primary" />
              Audit settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Enable audits</p>
                <p className="text-xs text-muted-foreground">
                  Prevents new audits when disabled.
                </p>
              </div>
              <Switch
                checked={biasEnabled}
                onCheckedChange={setBiasEnabled}
                disabled={!canManageConfig}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit-threshold">Selection-rate ratio</Label>
              <Input
                id="audit-threshold"
                type="number"
                min="0.5"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                disabled={!canManageConfig}
              />
              <p className="text-xs text-muted-foreground">
                Default 0.80. A group below this ratio to the highest observed
                rate is flagged for review.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Review frequency</Label>
              <Select
                value={frequency}
                onValueChange={setFrequency}
                disabled={!canManageConfig}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Protected attributes</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {ATTRIBUTES.map((attribute) => (
                  <label
                    key={attribute.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={protectedAttributes.includes(attribute.id)}
                      onCheckedChange={(checked) =>
                        toggleAttribute(attribute.id, checked === true)
                      }
                      disabled={!canManageConfig}
                    />
                    {attribute.label}
                  </label>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => void saveConfig()}
              disabled={!canManageConfig || savingConfig}
            >
              {savingConfig ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {canManageConfig ? 'Save settings' : 'Admin access required'}
            </Button>

            {config?.lastAuditAt && (
              <p className="text-center text-xs text-muted-foreground">
                Last audit {new Date(config.lastAuditAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={newAuditOpen} onOpenChange={setNewAuditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run fair-hiring audit</DialogTitle>
            <DialogDescription>
              The audit analyzes only application records belonging to the
              authenticated company. Voluntary EEO responses marked as declined
              are excluded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Audit type</Label>
              <Select value={auditType} onValueChange={setAuditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERALL">Overall</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="MATCH_SCORING">Match scoring</SelectItem>
                  <SelectItem value="RISK_ANALYSIS">Risk analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audit-from">From</Label>
                <Input
                  id="audit-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-to">To</Label>
                <Input
                  id="audit-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewAuditOpen(false)}
              disabled={runningAudit}
            >
              Cancel
            </Button>
            <Button onClick={() => void runAudit()} disabled={runningAudit}>
              {runningAudit ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="me-2 h-4 w-4" />
              )}
              Run audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedAudit)}
        onOpenChange={(open) => !open && setSelectedAudit(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit details</DialogTitle>
            <DialogDescription>
              {selectedAudit
                ? `${selectedAudit.auditType.replaceAll('_', ' ')} · ${new Date(
                    selectedAudit.createdAt,
                  ).toLocaleString()}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedAudit && (
            <div className="space-y-5 py-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Applications</p>
                  <p className="mt-1 text-2xl font-bold">
                    {selectedAudit.totalCandidates}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="mt-1 text-2xl font-bold">
                    {selectedAudit.complianceScore}%
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={
                      selectedAudit.status === 'FLAGGED'
                        ? 'mt-2 bg-destructive/10 text-destructive'
                        : 'mt-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    }
                  >
                    {selectedAudit.status}
                  </Badge>
                </div>
              </div>

              {Object.entries(
                selectedAudit.adverseImpact.selectionRateRule || {},
              ).map(([attribute, impact]) => (
                <Card key={attribute}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{attributeLabel(attribute)}</span>
                      <Badge
                        variant={
                          impact.hasAdverseImpact ? 'destructive' : 'outline'
                        }
                      >
                        {impact.hasAdverseImpact ? 'Review needed' : 'No flag'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {impact.details.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Fewer than two reportable groups were available.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Group</TableHead>
                              <TableHead>Applied</TableHead>
                              <TableHead>Selected</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Ratio</TableHead>
                              <TableHead>Result</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {impact.details.map((detail) => (
                              <TableRow key={detail.group}>
                                <TableCell>{detail.group}</TableCell>
                                <TableCell>{detail.applied}</TableCell>
                                <TableCell>{detail.selected}</TableCell>
                                <TableCell>{detail.selectionRate}%</TableCell>
                                <TableCell>{detail.ratio.toFixed(2)}</TableCell>
                                <TableCell>
                                  {detail.passes ? (
                                    <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Pass
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs text-destructive">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      Review
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                    {selectedAudit.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {selectedAudit.adverseImpact.disclaimer ||
                  'This report is a statistical monitoring aid and not a legal determination.'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
