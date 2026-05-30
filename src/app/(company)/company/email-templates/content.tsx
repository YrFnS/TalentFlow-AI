// @ts-nocheck
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Mail,
  Plus,
  Search,
  Eye,
  Pencil,
  Copy,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  FileText,
  CheckCircle2,
  Star,
  Tags,
  Variable,
  ToggleLeft,
  ToggleRight,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type TemplateCategory = 'Interview' | 'Rejection' | 'Offer' | 'General' | 'Follow-up';

interface EmailTemplate {
  id: string;
  name: string;
  nameKey: string;
  subject: string;
  subjectKey: string;
  category: TemplateCategory;
  isDefault: boolean;
  isActive: boolean;
  body: string;
  lastModified: string;
}

const categoryColors: Record<TemplateCategory, string> = {
  Interview: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  Rejection: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
  Offer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  General: 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400 border-0',
  'Follow-up': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
};

const categoryIcons: Record<TemplateCategory, string> = {
  Interview: '🎯',
  Rejection: '✗',
  Offer: '💼',
  General: '📝',
  'Follow-up': '🔄',
};

const VARIABLES = [
  { key: 'candidate_name', labelKey: 'varCandidateName' as const, sample: '' },
  { key: 'job_title', labelKey: 'varJobTitle' as const, sample: '' },
  { key: 'company_name', labelKey: 'varCompanyName' as const, sample: '' },
  { key: 'interview_date', labelKey: 'varInterviewDate' as const, sample: '' },
  { key: 'interview_time', labelKey: 'varInterviewTime' as const, sample: '' },
  { key: 'interviewer_name', labelKey: 'varInterviewerName' as const, sample: '' },
  { key: 'start_date', labelKey: 'varStartDate' as const, sample: '' },
  { key: 'salary', labelKey: 'varSalary' as const, sample: '' },
];

const initialTemplates: EmailTemplate[] = [];

function replaceVariables(text: string): string {
  let result = text;
  for (const v of VARIABLES) {
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.sample);
  }
  return result;
}

export default function EmailTemplatesContent() {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [previewWithSample, setPreviewWithSample] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('General');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const getCategoryLabel = useCallback((cat: TemplateCategory) => {
    const map: Record<TemplateCategory, string> = {
      Interview: t.emailTemplates.catInterview,
      Rejection: t.emailTemplates.catRejection,
      Offer: t.emailTemplates.catOffer,
      General: t.emailTemplates.catGeneral,
      'Follow-up': t.emailTemplates.catFollowUp,
    };
    return map[cat];
  }, [t]);

  const getTemplateName = useCallback((tpl: EmailTemplate) => {
    const key = tpl.nameKey as keyof typeof t.emailTemplates;
    return t.emailTemplates[key] || tpl.name;
  }, [t]);

  const getTemplateSubject = useCallback((tpl: EmailTemplate) => {
    const key = tpl.subjectKey as keyof typeof t.emailTemplates;
    return t.emailTemplates[key] || tpl.subject;
  }, [t]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (searchQuery) {
        const name = getTemplateName(tpl).toLowerCase();
        const subject = getTemplateSubject(tpl).toLowerCase();
        const query = searchQuery.toLowerCase();
        if (!name.includes(query) && !subject.includes(query)) return false;
      }
      if (filterCategory !== 'all' && tpl.category !== filterCategory) return false;
      if (filterStatus === 'active' && !tpl.isActive) return false;
      if (filterStatus === 'inactive' && tpl.isActive) return false;
      return true;
    });
  }, [templates, searchQuery, filterCategory, filterStatus, getTemplateName, getTemplateSubject]);

  const totalTemplates = templates.length;
  const activeCount = templates.filter(t => t.isActive).length;
  const defaultCount = templates.filter(t => t.isDefault).length;
  const categoryCount = new Set(templates.map(t => t.category)).size;

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCategory('General');
    setFormSubject('');
    setFormBody('');
    setFormIsDefault(false);
    setFormIsActive(true);
    setEditDialogOpen(true);
  };

  const openEditDialog = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormCategory(tpl.category);
    setFormSubject(tpl.subject);
    setFormBody(tpl.body);
    setFormIsDefault(tpl.isDefault);
    setFormIsActive(tpl.isActive);
    setEditDialogOpen(true);
  };

  const openPreviewDialog = (tpl: EmailTemplate) => {
    setPreviewTemplate(tpl);
    setPreviewWithSample(false);
    setPreviewDialogOpen(true);
  };

  const openDeleteDialog = (tpl: EmailTemplate) => {
    setDeletingTemplate(tpl);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      setTemplates(prev =>
        prev.map(tpl =>
          tpl.id === editingTemplate.id
            ? { ...tpl, name: formName, category: formCategory, subject: formSubject, body: formBody, isDefault: formIsDefault, isActive: formIsActive, lastModified: new Date().toISOString().split('T')[0] }
            : tpl
        )
      );
    } else {
      const newTemplate: EmailTemplate = {
        id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
        name: formName,
        nameKey: '',
        subject: formSubject,
        subjectKey: '',
        category: formCategory,
        isDefault: formIsDefault,
        isActive: formIsActive,
        body: formBody,
        lastModified: new Date().toISOString().split('T')[0],
      };
      setTemplates(prev => [...prev, newTemplate]);
    }
    setEditDialogOpen(false);
  };

  const handleDuplicate = (tpl: EmailTemplate) => {
    const duplicate: EmailTemplate = {
      ...tpl,
      id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
      name: `${tpl.name} (Copy)`,
      nameKey: '',
      subjectKey: '',
      isDefault: false,
      lastModified: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [...prev, duplicate]);
  };

  const handleDelete = () => {
    if (deletingTemplate) {
      setTemplates(prev => prev.filter(tpl => tpl.id !== deletingTemplate.id));
    }
    setDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const handleToggleActive = (tpl: EmailTemplate) => {
    setTemplates(prev =>
      prev.map(t => (t.id === tpl.id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const insertVariable = (varKey: string, target: 'subject' | 'body') => {
    const variable = `{{${varKey}}}`;
    if (target === 'subject') {
      setFormSubject(prev => prev + variable);
    } else {
      setFormBody(prev => prev + variable);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.emailTemplates.title}</h1>
            <p className="text-sm text-muted-foreground">{t.emailTemplates.subtitle}</p>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
        >
          <Plus className="h-4 w-4 me-2" />
          {t.emailTemplates.createTemplate}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailTemplates.totalTemplates}</p>
                <p className="text-xl font-bold">{totalTemplates}</p>
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
                <p className="text-xs text-muted-foreground">{t.emailTemplates.activeTemplates}</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailTemplates.defaultTemplates}</p>
                <p className="text-xl font-bold">{defaultCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-700 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <Tags className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.emailTemplates.categories}</p>
                <p className="text-xl font-bold">{categoryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.emailTemplates.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as TemplateCategory | 'all')}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder={t.emailTemplates.filterCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.emailTemplates.allCategories}</SelectItem>
              {(['Interview', 'Rejection', 'Offer', 'General', 'Follow-up'] as TemplateCategory[]).map(cat => (
                <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={t.emailTemplates.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.emailTemplates.allStatuses}</SelectItem>
              <SelectItem value="active">{t.emailTemplates.activeStatus}</SelectItem>
              <SelectItem value="inactive">{t.emailTemplates.inactiveStatus}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 ms-auto">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={cn('h-8 w-8', viewMode === 'grid' && 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400')}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.emailTemplates.gridView}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className={cn('h-8 w-8', viewMode === 'list' && 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400')}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.emailTemplates.listView}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t.emailTemplates.noTemplates}</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((tpl) => (
            <Card key={tpl.id} className="border-border/50 card-hover-lift relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
              <CardContent className="p-4 relative space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{getTemplateName(tpl)}</h3>
                      {tpl.isDefault && (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-[9px] shrink-0">
                          <Star className="h-2.5 w-2.5 me-0.5" />
                          {t.emailTemplates.defaultTemplate}
                        </Badge>
                      )}
                    </div>
                    <Badge className={cn('text-[10px] mt-1', categoryColors[tpl.category])}>
                      {categoryIcons[tpl.category]} {getCategoryLabel(tpl.category)}
                    </Badge>
                  </div>
                  {/* Active toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={tpl.isActive}
                      onCheckedChange={() => handleToggleActive(tpl)}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.emailTemplates.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{getTemplateSubject(tpl)}</p>
                </div>

                {/* Body preview */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t.emailTemplates.body}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{tpl.body.slice(0, 120)}...</p>
                </div>

                {/* Status & Date */}
                <div className="flex items-center justify-between">
                  <Badge className={cn(
                    'text-[10px] border-0',
                    tpl.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400'
                  )}>
                    {tpl.isActive ? t.emailTemplates.activeStatus : t.emailTemplates.inactiveStatus}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{tpl.lastModified}</span>
                </div>

                {/* Actions */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPreviewDialog(tpl)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.emailTemplates.previewTemplate}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(tpl)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.common.edit}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(tpl)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.emailTemplates.duplicateTemplate}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(tpl)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.emailTemplates.deleteTemplate}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.emailTemplates.templateName}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{t.emailTemplates.subject}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.emailTemplates.category}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.common.status}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{t.emailTemplates.defaultTemplate}</th>
                    <th className="text-end text-xs font-medium text-muted-foreground p-3">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((tpl) => (
                    <tr key={tpl.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{getTemplateName(tpl)}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{getTemplateSubject(tpl)}</p>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px]', categoryColors[tpl.category])}>
                          {categoryIcons[tpl.category]} {getCategoryLabel(tpl.category)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tpl.isActive}
                            onCheckedChange={() => handleToggleActive(tpl)}
                            className="scale-75"
                          />
                          <Badge className={cn(
                            'text-[10px] border-0',
                            tpl.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400'
                          )}>
                            {tpl.isActive ? t.emailTemplates.activeStatus : t.emailTemplates.inactiveStatus}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {tpl.isDefault ? (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-[10px]">
                            <Star className="h-2.5 w-2.5 me-0.5" />
                            {t.emailTemplates.defaultTemplate}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPreviewDialog(tpl)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.emailTemplates.previewTemplate}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(tpl)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.common.edit}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(tpl)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.emailTemplates.duplicateTemplate}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(tpl)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.emailTemplates.deleteTemplate}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              {editingTemplate ? t.emailTemplates.editTemplate : t.emailTemplates.createTemplate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailTemplates.templateName}</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.emailTemplates.templateNamePlaceholder}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.emailTemplates.category}</label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.emailTemplates.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {(['Interview', 'Rejection', 'Offer', 'General', 'Follow-up'] as TemplateCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryIcons[cat]} {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Line */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t.emailTemplates.subject}</label>
                <div className="flex items-center gap-1 flex-wrap">
                  {VARIABLES.slice(0, 3).map(v => (
                    <Button
                      key={v.key}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                      onClick={() => insertVariable(v.key, 'subject')}
                    >
                      {`{{${v.key}}}`}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder={t.emailTemplates.subjectPlaceholder}
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t.emailTemplates.body}</label>
              </div>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder={t.emailTemplates.bodyPlaceholder}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            {/* Variable Insert Buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <label className="text-sm font-medium">{t.emailTemplates.availableVariables}</label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => {
                  const labelKey = v.labelKey;
                  return (
                    <Button
                      key={v.key}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] gap-1 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950"
                      onClick={() => insertVariable(v.key, 'body')}
                    >
                      <span className="font-mono text-teal-600 dark:text-teal-400">{`{{${v.key}}}`}</span>
                      <span className="text-muted-foreground">— {t.emailTemplates[labelKey]}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Preview with Sample Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">{t.emailTemplates.previewWithSample}</label>
                <p className="text-[10px] text-muted-foreground">{t.emailTemplates.sampleData}</p>
              </div>
              <Switch
                checked={previewWithSample}
                onCheckedChange={setPreviewWithSample}
              />
            </div>

            {previewWithSample && (formSubject || formBody) && (
              <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30">
                <CardContent className="p-4 space-y-3">
                  {formSubject && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.emailTemplates.previewSubject}</p>
                      <p className="text-sm font-medium">{replaceVariables(formSubject)}</p>
                    </div>
                  )}
                  {formBody && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.emailTemplates.previewBody}</p>
                      <p className="text-sm whitespace-pre-line">{replaceVariables(formBody)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Default & Active Toggles */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">{t.emailTemplates.defaultTemplate}</label>
              </div>
              <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">{t.emailTemplates.activeStatus}</label>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              disabled={!formName || !formSubject || !formBody}
            >
              {t.emailTemplates.saveTemplate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              {t.emailTemplates.previewTemplate}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {/* Preview toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-[10px]', categoryColors[previewTemplate.category])}>
                    {categoryIcons[previewTemplate.category]} {getCategoryLabel(previewTemplate.category)}
                  </Badge>
                  {previewTemplate.isDefault && (
                    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-[10px]">
                      <Star className="h-2.5 w-2.5 me-0.5" />
                      {t.emailTemplates.defaultTemplate}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.emailTemplates.previewWithSample}</span>
                  <Switch checked={previewWithSample} onCheckedChange={setPreviewWithSample} />
                </div>
              </div>

              {/* Email Preview Card */}
              <Card className="border-border/50 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                    TV
                  </div>
                  <div className="text-white">
                    <p className="text-sm font-semibold">{t.emailTemplates.sampleData}: TechVision Inc.</p>
                    <p className="text-[10px] opacity-80">hr@techvision.com</p>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  {/* Subject */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailTemplates.subject}</p>
                    <p className="text-sm font-semibold">
                      {previewWithSample
                        ? replaceVariables(getTemplateSubject(previewTemplate))
                        : getTemplateSubject(previewTemplate)
                      }
                    </p>
                  </div>

                  <Separator />

                  {/* Body */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t.emailTemplates.body}</p>
                    <div className="text-sm whitespace-pre-line leading-relaxed">
                      {previewWithSample
                        ? replaceVariables(previewTemplate.body)
                        : previewTemplate.body
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.common.close}</Button>
            </DialogClose>
            {previewTemplate && (
              <Button
                onClick={() => {
                  setPreviewDialogOpen(false);
                  openEditDialog(previewTemplate);
                }}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              >
                <Pencil className="h-4 w-4 me-2" />
                {t.common.edit}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t.emailTemplates.deleteConfirm}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.emailTemplates.deleteConfirmMessage}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
