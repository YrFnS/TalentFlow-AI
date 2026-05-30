'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ComplianceLevel = 'green' | 'yellow' | 'red';

interface PolicyCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  policyCount: number;
  level: ComplianceLevel;
}

interface ComplianceEvent {
  id: string;
  date: string;
  event: string;
  category: string;
  status: 'compliant' | 'warning' | 'violation';
  actionRequired: boolean;
  actionText?: string;
}

const levelConfig: Record<ComplianceLevel, { color: string; dotColor: string }> = {
  green: { color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  yellow: { color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  red: { color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
};

const eventStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  compliant: { label: 'Compliant', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0', icon: CheckCircle2 },
  warning: { label: 'Warning', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0', icon: AlertTriangle },
  violation: { label: 'Violation', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0', icon: AlertCircle },
};

const policyCategories: PolicyCategory[] = [
  { id: 'CAT-001', name: 'Data Privacy', icon: Shield, policyCount: 3, level: 'green' },
  { id: 'CAT-002', name: 'Employment Law', icon: FileText, policyCount: 4, level: 'yellow' },
  { id: 'CAT-003', name: 'Security', icon: Shield, policyCount: 3, level: 'green' },
  { id: 'CAT-004', name: 'AI Ethics', icon: Eye, policyCount: 2, level: 'red' },
];

const complianceEvents: ComplianceEvent[] = [
  { id: 'EVT-001', date: '2024-12-15', event: 'GDPR data retention policy updated', category: 'Data Privacy', status: 'compliant', actionRequired: false },
  { id: 'EVT-002', date: '2024-12-14', event: 'Employee background check lapse detected', category: 'Employment Law', status: 'warning', actionRequired: true, actionText: 'Review Now' },
  { id: 'EVT-003', date: '2024-12-13', event: 'AI bias audit overdue by 15 days', category: 'AI Ethics', status: 'violation', actionRequired: true, actionText: 'Review Now' },
  { id: 'EVT-004', date: '2024-12-12', event: 'SOC 2 Type II compliance renewed', category: 'Security', status: 'compliant', actionRequired: false },
  { id: 'EVT-005', date: '2024-12-11', event: 'Cookie consent mechanism updated', category: 'Data Privacy', status: 'compliant', actionRequired: false },
  { id: 'EVT-006', date: '2024-12-10', event: 'Equal opportunity policy review pending', category: 'Employment Law', status: 'warning', actionRequired: true, actionText: 'Review Now' },
  { id: 'EVT-007', date: '2024-12-09', event: 'Penetration test results reviewed', category: 'Security', status: 'compliant', actionRequired: false },
  { id: 'EVT-008', date: '2024-12-08', event: 'AI model transparency report overdue', category: 'AI Ethics', status: 'violation', actionRequired: true, actionText: 'Review Now' },
];

const overdueReviews = complianceEvents.filter(e => e.actionRequired);

export default function CompliancePage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEvents = complianceEvents.filter(e => {
    const catMatch = categoryFilter === 'all' || e.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || e.status === statusFilter;
    return catMatch && statusMatch;
  });

  const complianceScore = 94;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (complianceScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.compliance.title}</h1>
            <p className="text-sm text-muted-foreground">{t.compliance.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.compliance.createPolicy}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.compliance.createPolicy}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.compliance.policyName}</label>
                <Input placeholder={t.compliance.policyNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.compliance.policyCategory}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.compliance.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data-privacy">{t.compliance.dataPrivacy}</SelectItem>
                    <SelectItem value="employment-law">{t.compliance.employmentLaw}</SelectItem>
                    <SelectItem value="security">{t.compliance.security}</SelectItem>
                    <SelectItem value="ai-ethics">{t.compliance.aiEthics}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.compliance.description}</label>
                <Input placeholder={t.compliance.descriptionPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.compliance.reviewDate}</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.compliance.owner}</label>
                <Input placeholder={t.compliance.ownerPlaceholder} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.common.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.compliance.complianceScore}</p>
                <p className="text-xl font-bold">{complianceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.compliance.activePolicies}</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.compliance.overdueReviews}</p>
                <p className="text-xl font-bold">{overdueReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.compliance.auditTrails}</p>
                <p className="text-xl font-bold">1,284</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score Ring */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.compliance.scoreOverview}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(20, 184, 166)" />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                  </linearGradient>
                </defs>
                {/* Background circle */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" />
                {/* Progress circle */}
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="url(#complianceGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold gradient-text">{complianceScore}%</span>
                <span className="text-[10px] text-muted-foreground">{t.compliance.compliant}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Categories */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.compliance.policyCategories}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policyCategories.map((cat) => {
                const CatIcon = cat.icon;
                const level = levelConfig[cat.level];
                return (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-teal-200 dark:hover:border-teal-800 transition-colors bg-muted/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/30">
                      <CatIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{cat.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-2 h-2 rounded-full', level.dotColor)} />
                          <span className={cn('text-[10px] font-medium', level.color)}>
                            {cat.level === 'green' ? t.compliance.compliant : cat.level === 'yellow' ? t.compliance.warning : t.compliance.violation}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.policyCount} {t.compliance.policies}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Reviews Alert */}
      {overdueReviews.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {t.compliance.overdueAlert}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-background/40 border border-amber-200/50 dark:border-amber-900/30">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertCircle className={cn('h-4 w-4 shrink-0', review.status === 'violation' ? 'text-red-500' : 'text-amber-500')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{review.event}</p>
                    <p className="text-[10px] text-muted-foreground">{review.category} · {review.date}</p>
                  </div>
                </div>
                <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                  {t.compliance.reviewNow}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Compliance Events Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.compliance.recentEvents}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder={t.compliance.filterCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.compliance.allCategories}</SelectItem>
                  <SelectItem value="Data Privacy">{t.compliance.dataPrivacy}</SelectItem>
                  <SelectItem value="Employment Law">{t.compliance.employmentLaw}</SelectItem>
                  <SelectItem value="Security">{t.compliance.security}</SelectItem>
                  <SelectItem value="AI Ethics">{t.compliance.aiEthics}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder={t.compliance.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.compliance.allStatuses}</SelectItem>
                  <SelectItem value="compliant">{t.compliance.compliant}</SelectItem>
                  <SelectItem value="warning">{t.compliance.warning}</SelectItem>
                  <SelectItem value="violation">{t.compliance.violation}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t.compliance.date}</TableHead>
                  <TableHead className="text-xs">{t.compliance.event}</TableHead>
                  <TableHead className="text-xs">{t.compliance.category}</TableHead>
                  <TableHead className="text-xs">{t.compliance.status}</TableHead>
                  <TableHead className="text-xs">{t.compliance.actionRequired}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((evt) => {
                  const statusCfg = eventStatusConfig[evt.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <TableRow key={evt.id} className="gradient-border-start">
                      <TableCell className="text-sm py-3 text-muted-foreground">{evt.date}</TableCell>
                      <TableCell className="text-sm font-medium py-3">{evt.event}</TableCell>
                      <TableCell className="text-sm py-3">
                        <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                          {evt.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn('text-[10px]', statusCfg.color)}>
                          <StatusIcon className="h-3 w-3 me-1" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        {evt.actionRequired ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                            <AlertTriangle className="h-3 w-3" />
                            {evt.actionText || t.compliance.reviewNow}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t.compliance.none}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
