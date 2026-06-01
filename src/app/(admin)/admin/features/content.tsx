// @ts-nocheck
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
  Flag,
  Plus,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Server,
  Shield,
  BarChart3,
  Puzzle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FlagStatus = 'Active' | 'Inactive' | 'Scheduled';
type Environment = 'Production' | 'Staging' | 'Development';
type FlagCategory = 'Core' | 'AI' | 'Analytics' | 'Integrations';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  status: FlagStatus;
  environments: Environment[];
  defaultValue: boolean;
  targetingRules: string;
  lastModified: string;
  category: FlagCategory;
}

const categoryColors: Record<FlagCategory, string> = {
  Core: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  AI: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Analytics: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Integrations: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400 border-0',
};

const statusColors: Record<FlagStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Inactive: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0',
  Scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
};

const envColors: Record<Environment, string> = {
  Production: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
  Staging: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Development: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
};

const categoryIcons: Record<FlagCategory, React.ElementType> = {
  Core: Shield,
  AI: BarChart3,
  Analytics: BarChart3,
  Integrations: Puzzle,
};

// No mock data - feature flags come from real data only

const allCategories: FlagCategory[] = ['Core', 'AI', 'Analytics', 'Integrations'];
const allStatuses: FlagStatus[] = ['Active', 'Inactive', 'Scheduled'];

export default function FeaturesContent() {
  const { t } = useI18n();
  const [filterCategory, setFilterCategory] = useState<FlagCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FlagStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  const filteredFlags = flags.filter((f) => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => {
      if (f.id === id) {
        const newStatus: FlagStatus = f.status === 'Active' ? 'Inactive' : 'Active';
        return { ...f, status: newStatus, lastModified: new Date().toISOString().split('T')[0] };
      }
      return f;
    }));
  };

  const totalFlags = flags.length;
  const activeCount = flags.filter(f => f.status === 'Active').length;
  const inactiveCount = flags.filter(f => f.status === 'Inactive').length;
  const scheduledCount = flags.filter(f => f.status === 'Scheduled').length;

  // Group flags by category
  const groupedFlags = allCategories.reduce<Record<FlagCategory, FeatureFlag[]>>((acc, cat) => {
    acc[cat] = filteredFlags.filter(f => f.category === cat);
    return acc;
  }, {} as Record<FlagCategory, FeatureFlag[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.featureFlags.title}</h1>
            <p className="text-sm text-muted-foreground">{t.featureFlags.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.featureFlags.createFlag}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.featureFlags.createFlag}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.flagName}</label>
                <Input placeholder={t.featureFlags.flagNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.flagDescription}</label>
                <Input placeholder={t.featureFlags.flagDescPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.category}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.featureFlags.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.environments}</label>
                <div className="flex flex-wrap gap-2">
                  {(['Production', 'Staging', 'Development'] as Environment[]).map(env => (
                    <label key={env} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-xs font-medium">{env}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.defaultValue}</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                    {t.featureFlags.enabled}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    {t.featureFlags.disabled}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.featureFlags.targetingRules}</label>
                <Input placeholder={t.featureFlags.targetingRulesPlaceholder} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.common.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Flag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.featureFlags.totalFlags}</p>
                <p className="text-xl font-bold">{totalFlags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.featureFlags.active}</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.featureFlags.inactive}</p>
                <p className="text-xl font-bold">{inactiveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.featureFlags.scheduled}</p>
                <p className="text-xl font-bold">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FlagCategory | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.featureFlags.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.featureFlags.allCategories}</SelectItem>
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FlagStatus | 'all')}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder={t.featureFlags.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.featureFlags.allStatuses}</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Feature Flags grouped by Category */}
      <div className="space-y-6">
        {allCategories.map((category) => {
          const categoryFlags = groupedFlags[category];
          if (categoryFlags.length === 0) return null;
          const CategoryIcon = categoryIcons[category];
          return (
            <div key={category}>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <CategoryIcon className="h-5 w-5 text-blue-600" />
                {category}
                <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{categoryFlags.length}</Badge>
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.flagName}</th>
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.description}</th>
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.status}</th>
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.environment}</th>
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.targetingRules}</th>
                          <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.featureFlags.lastModified}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryFlags.map((flag) => (
                          <tr key={flag.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleFlag(flag.id)}
                                  className="focus:outline-none"
                                  title={flag.status === 'Active' ? t.featureFlags.deactivate : t.featureFlags.activate}
                                >
                                  {flag.status === 'Active' ? (
                                    <ToggleRight className="h-5 w-5 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                <div>
                                  <span className="text-sm font-medium font-mono">{flag.name}</span>
                                  <Badge className={cn('text-[9px] ms-1.5', categoryColors[flag.category])}>
                                    {flag.category}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate">{flag.description}</p>
                            </td>
                            <td className="p-3">
                              <Badge className={cn('text-[10px]', statusColors[flag.status])}>
                                {flag.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {flag.environments.map(env => (
                                  <Badge key={env} className={cn('text-[9px]', envColors[env])}>
                                    <Server className="h-2.5 w-2.5 me-0.5" />
                                    {env}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-xs text-muted-foreground">{flag.targetingRules}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {flag.lastModified}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {filteredFlags.length === 0 && (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-8 text-center">
            <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t.featureFlags.noFlags}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
