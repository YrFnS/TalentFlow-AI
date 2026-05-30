'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
  ClipboardCheck,
  Plus,
  Star,
  Trash2,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  BarChart3,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  rating1: string;
  rating2: string;
  rating3: string;
  rating4: string;
  rating5: string;
}

interface ScorecardTemplate {
  id: string;
  name: string;
  criteria: Criterion[];
  totalWeight: number;
  isDefault: boolean;
  isActive: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultRatings = {
  rating1: '1 - Poor',
  rating2: '2 - Below Average',
  rating3: '3 - Average',
  rating4: '4 - Above Average',
  rating5: '5 - Excellent',
};

const mockTemplates: ScorecardTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Engineering Interview',
    criteria: [
      { id: generateId(), name: 'Technical Skills', description: 'Proficiency in relevant programming languages, frameworks, and tools', weight: 30, ...defaultRatings },
      { id: generateId(), name: 'Problem Solving', description: 'Ability to analyze complex problems and develop effective solutions', weight: 25, ...defaultRatings },
      { id: generateId(), name: 'Communication', description: 'Clarity of thought expression and technical communication', weight: 15, ...defaultRatings },
      { id: generateId(), name: 'Culture Fit', description: 'Alignment with team values and working style', weight: 15, ...defaultRatings },
      { id: generateId(), name: 'Experience', description: 'Relevance and depth of prior work experience', weight: 15, ...defaultRatings },
    ],
    totalWeight: 100,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'tpl-2',
    name: 'Design Interview',
    criteria: [
      { id: generateId(), name: 'Creativity', description: 'Originality and innovation in design thinking', weight: 30, ...defaultRatings },
      { id: generateId(), name: 'Technical Skills', description: 'Proficiency in design tools and methodologies', weight: 20, ...defaultRatings },
      { id: generateId(), name: 'Communication', description: 'Ability to articulate design decisions and rationale', weight: 20, ...defaultRatings },
      { id: generateId(), name: 'Culture Fit', description: 'Alignment with design team culture and values', weight: 15, ...defaultRatings },
      { id: generateId(), name: 'Experience', description: 'Quality and relevance of portfolio work', weight: 15, ...defaultRatings },
    ],
    totalWeight: 100,
    isDefault: false,
    isActive: true,
  },
  {
    id: 'tpl-3',
    name: 'Sales Interview',
    criteria: [
      { id: generateId(), name: 'Communication', description: 'Persuasive speaking, active listening, and rapport building', weight: 25, ...defaultRatings },
      { id: generateId(), name: 'Negotiation', description: 'Ability to handle objections and close deals', weight: 25, ...defaultRatings },
      { id: generateId(), name: 'Client Management', description: 'Building and maintaining strong client relationships', weight: 20, ...defaultRatings },
      { id: generateId(), name: 'Problem Solving', description: 'Creative solutions to client challenges', weight: 15, ...defaultRatings },
      { id: generateId(), name: 'Culture Fit', description: 'Alignment with sales team dynamics and drive', weight: 15, ...defaultRatings },
    ],
    totalWeight: 100,
    isDefault: false,
    isActive: true,
  },
  {
    id: 'tpl-4',
    name: 'Leadership Assessment',
    criteria: [
      { id: generateId(), name: 'Strategic Thinking', description: 'Ability to set direction and think long-term', weight: 25, ...defaultRatings },
      { id: generateId(), name: 'Decision Making', description: 'Sound judgment under pressure and uncertainty', weight: 20, ...defaultRatings },
      { id: generateId(), name: 'Team Management', description: 'Ability to build, motivate, and develop teams', weight: 20, ...defaultRatings },
      { id: generateId(), name: 'Communication', description: 'Clear vision casting and stakeholder management', weight: 15, ...defaultRatings },
      { id: generateId(), name: 'Vision & Direction', description: 'Capacity to inspire and drive organizational change', weight: 10, ...defaultRatings },
      { id: generateId(), name: 'Culture Fit', description: 'Embodiment of organizational values', weight: 10, ...defaultRatings },
    ],
    totalWeight: 100,
    isDefault: false,
    isActive: false,
  },
];

function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={cn(
              'h-5 w-5',
              (hovered || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ScorecardsContent() {
  const { t } = useI18n();
  const st = t.scorecards as Record<string, string>;

  const [templates, setTemplates] = useState<ScorecardTemplate[]>(mockTemplates);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ScorecardTemplate | null>(null);
  const [viewTemplate, setViewTemplate] = useState<ScorecardTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCriteria, setFormCriteria] = useState<Criterion[]>([]);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  // Scorecard submission state
  const [scorecardTemplateId, setScorecardTemplateId] = useState('');
  const [criterionRatings, setCriterionRatings] = useState<Record<string, number>>({});
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({});
  const [overallRecommendation, setOverallRecommendation] = useState('');
  const [overallNotes, setOverallNotes] = useState('');

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    defaultCount: templates.filter(t => t.isDefault).length,
    criteriaTotal: templates.reduce((sum, t) => sum + t.criteria.length, 0),
  }), [templates]);

  const totalWeight = useMemo(() => {
    return formCriteria.reduce((sum, c) => sum + c.weight, 0);
  }, [formCriteria]);

  const openCreateDialog = () => {
    setEditTemplate(null);
    setFormName('');
    setFormCriteria([
      { id: generateId(), name: '', description: '', weight: 0, ...defaultRatings },
    ]);
    setFormIsDefault(false);
    setFormIsActive(true);
    setCreateOpen(true);
  };

  const openEditDialog = (template: ScorecardTemplate) => {
    setEditTemplate(template);
    setFormName(template.name);
    setFormCriteria([...template.criteria.map(c => ({ ...c, id: generateId() }))]);
    setFormIsDefault(template.isDefault);
    setFormIsActive(template.isActive);
    setCreateOpen(true);
  };

  const addCriterion = () => {
    setFormCriteria(prev => [
      ...prev,
      { id: generateId(), name: '', description: '', weight: 0, ...defaultRatings },
    ]);
  };

  const removeCriterion = (id: string) => {
    setFormCriteria(prev => prev.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
    setFormCriteria(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveTemplate = () => {
    if (!formName.trim()) {
      toast.error(st.weightError);
      return;
    }
    if (totalWeight !== 100) {
      toast.error(st.weightMustEqual100);
      return;
    }
    if (formCriteria.some(c => !c.name.trim())) {
      toast.error(st.criterionName);
      return;
    }

    if (editTemplate) {
      setTemplates(prev =>
        prev.map(t =>
          t.id === editTemplate.id
            ? {
                ...t,
                name: formName,
                criteria: formCriteria,
                totalWeight,
                isDefault: formIsDefault,
                isActive: formIsActive,
              }
            : formIsDefault
            ? { ...t, isDefault: false }
            : t
        )
      );
      toast.success(st.saveSuccess);
    } else {
      const newTemplate: ScorecardTemplate = {
        id: generateId(),
        name: formName,
        criteria: formCriteria,
        totalWeight,
        isDefault: formIsDefault,
        isActive: formIsActive,
      };
      setTemplates(prev =>
        formIsDefault
          ? [...prev.map(t => ({ ...t, isDefault: false })), newTemplate]
          : [...prev, newTemplate]
      );
      toast.success(st.saveSuccess);
    }
    setCreateOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget));
      toast.success(st.deleteSuccess);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const openScorecardDialog = () => {
    setScorecardTemplateId('');
    setCriterionRatings({});
    setCriterionNotes({});
    setOverallRecommendation('');
    setOverallNotes('');
    setScorecardOpen(true);
  };

  const handleScorecardTemplateSelect = (templateId: string) => {
    setScorecardTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const ratings: Record<string, number> = {};
      const notes: Record<string, string> = {};
      template.criteria.forEach(c => {
        ratings[c.id] = 0;
        notes[c.id] = '';
      });
      setCriterionRatings(ratings);
      setCriterionNotes(notes);
    }
  };

  const handleSubmitScorecard = () => {
    const template = templates.find(t => t.id === scorecardTemplateId);
    if (!template) return;
    if (!overallRecommendation) {
      toast.error(st.overallRecommendation);
      return;
    }
    if (template.criteria.some(c => criterionRatings[c.id] === 0)) {
      toast.error(st.rating);
      return;
    }
    toast.success(st.scorecardSubmitted);
    setScorecardOpen(false);
  };

  const selectedScorecardTemplate = templates.find(t => t.id === scorecardTemplateId);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{st.title}</h1>
            <p className="text-sm text-muted-foreground">{st.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
            onClick={openScorecardDialog}
          >
            <Star className="h-4 w-4 me-2" />
            {st.submitScorecard}
          </Button>
          <Button
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4 me-2" />
            {st.createTemplate}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{st.totalTemplates}</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{st.activeTemplates}</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{st.defaultTemplate}</p>
                <p className="text-xl font-bold">{stats.defaultCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{st.criteriaCount}</p>
                <p className="text-xl font-bold">{stats.criteriaTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">{st.noTemplates}</h3>
            <p className="text-sm text-muted-foreground mb-4">{st.noTemplatesDesc}</p>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4 me-2" />
              {st.createTemplate}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="border-border/50 card-hover-lift transition-all duration-200 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-[10px]">
                          {st.defaultTemplate}
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px] border-0 shrink-0',
                      template.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {template.isActive ? st.isActive : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{st.criteria}:</span>
                  <span className="font-medium">{template.criteria.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{st.totalWeight}:</span>
                  <span
                    className={cn(
                      'font-medium',
                      template.totalWeight === 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {template.totalWeight}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.criteria.slice(0, 3).map((c) => (
                    <Badge
                      key={c.id}
                      variant="outline"
                      className="text-[10px] border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                    >
                      {c.name} ({c.weight}%)
                    </Badge>
                  ))}
                  {template.criteria.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{template.criteria.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setViewTemplate(template);
                      setDetailOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 me-1" />
                    {st.templateDetails}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-3 w-3 me-1" />
                    {st.editTemplate}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    onClick={() => {
                      setDeleteTarget(template.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
              {editTemplate ? st.editTemplate : st.createTemplate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{st.templateName}</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={st.templateNamePlaceholder}
              />
            </div>

            {/* Criteria Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{st.criteria}</label>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                  onClick={addCriterion}
                >
                  <Plus className="h-3 w-3 me-1" />
                  {st.addCriterion}
                </Button>
              </div>

              {formCriteria.map((criterion, index) => (
                <Card key={criterion.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                        onClick={() => removeCriterion(criterion.id)}
                        disabled={formCriteria.length <= 1}
                      >
                        <Trash2 className="h-3 w-3 me-1" />
                        {st.removeCriterion}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs text-muted-foreground">{st.criterionName}</label>
                        <Input
                          value={criterion.name}
                          onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                          placeholder={st.criterionNamePlaceholder}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{st.weight} (%)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={criterion.weight || ''}
                          onChange={(e) => updateCriterion(criterion.id, 'weight', parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{st.criterionDescription}</label>
                      <Input
                        value={criterion.description}
                        onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                        placeholder={st.criterionDescriptionPlaceholder}
                        className="h-8 text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Total Weight Indicator */}
              <div
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  totalWeight === 100
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                )}
              >
                <span className="text-sm font-medium">{st.totalWeight}:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-lg font-bold',
                      totalWeight === 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {totalWeight}%
                  </span>
                  {totalWeight === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
                <label className="text-sm">{st.isDefault}</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                <label className="text-sm">{st.isActive}</label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleSaveTemplate}
              disabled={totalWeight !== 100 || !formName.trim()}
            >
              {editTemplate ? t.common.save : st.createTemplate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              {st.templateDetails}
            </DialogTitle>
          </DialogHeader>
          {viewTemplate && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{viewTemplate.name}</h2>
                {viewTemplate.isDefault && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-[10px]">
                    {st.defaultTemplate}
                  </Badge>
                )}
                <Badge
                  className={cn(
                    'text-[10px] border-0',
                    viewTemplate.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {viewTemplate.isActive ? st.isActive : 'Inactive'}
                </Badge>
              </div>
              <div className="space-y-3">
                {viewTemplate.criteria.map((c, i) => (
                  <Card key={c.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                            <span className="font-medium text-sm">{c.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <span key={level} className="text-[10px] text-muted-foreground">
                                {level}: {c[`rating${level}` as keyof Criterion] as string}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 shrink-0"
                        >
                          {c.weight}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  viewTemplate.totalWeight === 100
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                )}
              >
                <span className="text-sm font-medium">{st.totalWeight}:</span>
                <span
                  className={cn(
                    'font-bold',
                    viewTemplate.totalWeight === 100
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {viewTemplate.totalWeight}%
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scorecard Submission Dialog */}
      <Dialog open={scorecardOpen} onOpenChange={setScorecardOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              {st.submitScorecard}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Select Template */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{st.selectTemplate}</label>
              <Select value={scorecardTemplateId} onValueChange={handleScorecardTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={st.selectTemplatePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.isActive).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.criteria.length} {st.criteria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Criteria Ratings */}
            {selectedScorecardTemplate && (
              <div className="space-y-3">
                {selectedScorecardTemplate.criteria.map((criterion) => (
                  <Card key={criterion.id} className="border-border/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{criterion.name}</span>
                          <span className="text-xs text-muted-foreground ms-2">({criterion.weight}%)</span>
                        </div>
                        <StarRating
                          value={criterionRatings[criterion.id] || 0}
                          onChange={(v) =>
                            setCriterionRatings(prev => ({ ...prev, [criterion.id]: v }))
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      <Textarea
                        value={criterionNotes[criterion.id] || ''}
                        onChange={(e) =>
                          setCriterionNotes(prev => ({ ...prev, [criterion.id]: e.target.value }))
                        }
                        placeholder={st.criterionNotesPlaceholder}
                        rows={2}
                        className="text-xs"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Overall Recommendation */}
            {selectedScorecardTemplate && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{st.overallRecommendation}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'STRONG_HIRE', label: st.strongHire, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' },
                      { value: 'HIRE', label: st.hire, color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-teal-300 dark:border-teal-700' },
                      { value: 'NO_HIRE', label: st.noHire, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
                      { value: 'STRONG_NO_HIRE', label: st.strongNoHire, color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-300 dark:border-red-700' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          'px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                          overallRecommendation === option.value
                            ? option.color
                            : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                        onClick={() => setOverallRecommendation(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{st.overallNotes}</label>
                  <Textarea
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder={st.overallNotesPlaceholder}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleSubmitScorecard}
              disabled={!scorecardTemplateId || !overallRecommendation}
            >
              {st.submitScorecard}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {st.deleteTemplate}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{st.deleteConfirm}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
