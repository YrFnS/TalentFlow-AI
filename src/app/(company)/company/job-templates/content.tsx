'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import {
  Briefcase,
  FileText,
  TrendingUp,
  Calendar,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  MapPin,
  DollarSign,
  Clock,
  X,
  Users,
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface JobTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  department: 'engineering' | 'design' | 'marketing' | 'sales' | 'hr';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  requirements: string[];
  responsibilities: string;
  benefits: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  remote: boolean;
  skills: string[];
  usageCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  title: string;
  description: string;
  department: string;
  jobType: string;
  requirements: string[];
  responsibilities: string;
  benefits: string[];
  salaryMin: string;
  salaryMax: string;
  location: string;
  remote: boolean;
  skills: string[];
}

const emptyForm: TemplateFormData = {
  name: '',
  title: '',
  description: '',
  department: 'engineering',
  jobType: 'full-time',
  requirements: [],
  responsibilities: '',
  benefits: [],
  salaryMin: '',
  salaryMax: '',
  location: '',
  remote: false,
  skills: [],
};

// Tag input component for requirements/benefits/skills
function TagInput({ tags, onTagsChange, placeholder }: { tags: string[]; onTagsChange: (tags: string[]) => void; placeholder: string }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-9"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-9 px-3">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-xs gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-teal-900 dark:hover:text-teal-200 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const departmentColors: Record<string, string> = {
  engineering: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  design: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  marketing: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  sales: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0',
  hr: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
};

const jobTypeColors: Record<string, string> = {
  'full-time': 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  'part-time': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  contract: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  internship: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-0',
};

export default function JobTemplatesContent() {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterJobType, setFilterJobType] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/job-templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Stats
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.active).length;
  const mostUsedTemplate = templates.reduce((max, t) => (t.usageCount > (max?.usageCount ?? 0) ? t : max), templates[0]);
  const createdThisMonth = templates.filter((t) => {
    const created = new Date(t.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  // Filtered templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || template.department === filterDepartment;
    const matchesJobType = filterJobType === 'all' || template.jobType === filterJobType;
    return matchesSearch && matchesDepartment && matchesJobType;
  });

  // Department label helper
  const getDepartmentLabel = (dept: string) => {
    const map: Record<string, string> = {
      engineering: t.jobTemplates.engineering,
      design: t.jobTemplates.design,
      marketing: t.jobTemplates.marketing,
      sales: t.jobTemplates.sales,
      hr: t.jobTemplates.humanResources,
    };
    return map[dept] || dept;
  };

  // Job type label helper
  const getJobTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
    };
    return map[type] || type;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format salary
  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return '';
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  // Handlers
  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/job-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salaryMin: Number(formData.salaryMin) || 0,
          salaryMax: Number(formData.salaryMax) || 0,
        }),
      });
      if (res.ok) {
        toast.success(t.common.success);
        setCreateDialogOpen(false);
        setFormData(emptyForm);
        fetchTemplates();
      } else {
        toast.error(t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/job-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          ...formData,
          salaryMin: Number(formData.salaryMin) || 0,
          salaryMax: Number(formData.salaryMax) || 0,
        }),
      });
      if (res.ok) {
        toast.success(t.common.success);
        setEditDialogOpen(false);
        setSelectedTemplate(null);
        setFormData(emptyForm);
        fetchTemplates();
      } else {
        toast.error(t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/job-templates?id=${selectedTemplate.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(t.common.success);
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast.error(t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    }
  };

  const openEditDialog = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      description: template.description,
      department: template.department,
      jobType: template.jobType,
      requirements: [...template.requirements],
      responsibilities: template.responsibilities,
      benefits: [...template.benefits],
      salaryMin: String(template.salaryMin),
      salaryMax: String(template.salaryMax),
      location: template.location,
      remote: template.remote,
      skills: [...template.skills],
    });
    setEditDialogOpen(true);
  };

  const openUseDialog = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setUseDialogOpen(true);
  };

  const openDeleteDialog = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleUseTemplate = () => {
    setUseDialogOpen(false);
    toast.success(`${t.jobTemplates.useTemplate}: ${selectedTemplate?.title}`, {
      description: t.jobTemplates.useThisTemplate,
    });
  };

  // Template form dialog content
  const TemplateFormDialog = ({
    open,
    onOpenChange,
    title,
    onSubmit,
    isEdit,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onSubmit: () => void;
    isEdit?: boolean;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dialog-content-glow">
        <DialogHeader className="dialog-header-accent pt-2">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t.jobTemplates.editTemplate : t.jobTemplates.createTemplate}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Template Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.templateName}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.jobTemplates.templateNamePlaceholder}
              className="h-9"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.jobTitle}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Frontend Developer"
              className="h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.description}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role and what makes it exciting..."
              rows={3}
            />
          </div>

          {/* Department + Job Type row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.department}</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => setFormData({ ...formData, department: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">{t.jobTemplates.engineering}</SelectItem>
                  <SelectItem value="design">{t.jobTemplates.design}</SelectItem>
                  <SelectItem value="marketing">{t.jobTemplates.marketing}</SelectItem>
                  <SelectItem value="sales">{t.jobTemplates.sales}</SelectItem>
                  <SelectItem value="hr">{t.jobTemplates.humanResources}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.jobType}</Label>
              <Select
                value={formData.jobType}
                onValueChange={(val) => setFormData({ ...formData, jobType: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.requirements}</Label>
            <TagInput
              tags={formData.requirements}
              onTagsChange={(requirements) => setFormData({ ...formData, requirements })}
              placeholder="Add a requirement and press Enter..."
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.responsibilities}</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Describe the key responsibilities..."
              rows={3}
            />
          </div>

          {/* Benefits */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.benefits}</Label>
            <TagInput
              tags={formData.benefits}
              onTagsChange={(benefits) => setFormData({ ...formData, benefits })}
              placeholder="Add a benefit and press Enter..."
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.salaryRange}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DollarSign className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  placeholder="Min"
                  className="ps-7 h-9"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  placeholder="Max"
                  className="ps-7 h-9"
                />
              </div>
            </div>
          </div>

          {/* Location + Remote row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.location}</Label>
              <div className="relative">
                <MapPin className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="ps-7 h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.remote}</Label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  checked={formData.remote}
                  onCheckedChange={(checked) => setFormData({ ...formData, remote: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.remote ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.skills}</Label>
            <TagInput
              tags={formData.skills}
              onTagsChange={(skills) => setFormData({ ...formData, skills })}
              placeholder="Add a skill and press Enter..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9">{t.common.cancel}</Button>
          </DialogClose>
          <Button
            onClick={onSubmit}
            disabled={saving || !formData.name.trim() || !formData.title.trim()}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
          >
            {saving && <Loader2 className="w-4 h-4 me-1 animate-spin" />}
            {isEdit ? t.jobTemplates.updateTemplate : t.jobTemplates.saveTemplate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <Copy className="w-4 h-4 text-white" />
            </div>
            {t.jobTemplates.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t.jobTemplates.subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setFormData(emptyForm);
            setCreateDialogOpen(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md h-9"
        >
          <Plus className="w-4 h-4 me-2" />
          {t.jobTemplates.createTemplate}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <Card className="card-hover-lift stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/30">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTemplates}</p>
                <p className="text-xs text-muted-foreground">{t.jobTemplates.totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTemplates}</p>
                <p className="text-xs text-muted-foreground">{t.jobTemplates.activeTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/30">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{mostUsedTemplate?.title || '-'}</p>
                <p className="text-xs text-muted-foreground">{t.jobTemplates.mostUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{createdThisMonth}</p>
                <p className="text-xs text-muted-foreground">{t.jobTemplates.createdThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.jobTemplates.searchTemplates}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <Building2 className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={t.jobTemplates.filterDepartment} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.jobTemplates.allDepartments}</SelectItem>
            <SelectItem value="engineering">{t.jobTemplates.engineering}</SelectItem>
            <SelectItem value="design">{t.jobTemplates.design}</SelectItem>
            <SelectItem value="marketing">{t.jobTemplates.marketing}</SelectItem>
            <SelectItem value="sales">{t.jobTemplates.sales}</SelectItem>
            <SelectItem value="hr">{t.jobTemplates.humanResources}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterJobType} onValueChange={setFilterJobType}>
          <SelectTrigger className="w-full sm:w-44 h-9">
            <Briefcase className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={t.jobTemplates.filterJobType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.jobTemplates.allJobTypes}</SelectItem>
            <SelectItem value="full-time">Full Time</SelectItem>
            <SelectItem value="part-time">Part Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-12 bg-muted rounded" />
                <div className="flex gap-1.5">
                  <div className="h-5 bg-muted rounded w-14" />
                  <div className="h-5 bg-muted rounded w-14" />
                  <div className="h-5 bg-muted rounded w-14" />
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="h-8 flex-1 bg-muted rounded" />
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="group card-hover-lift border-border/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shrink-0">
                    <span className="text-xs font-bold">{getInitials(template.title)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-semibold leading-tight truncate">
                            {template.name}
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{template.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge variant="secondary" className={`text-[10px] ${departmentColors[template.department] || ''}`}>
                        {getDepartmentLabel(template.department)}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] ${jobTypeColors[template.jobType] || ''}`}>
                        {getJobTypeLabel(template.jobType)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
                  {template.description}
                </CardDescription>

                {/* Salary & Location */}
                {(template.salaryMin || template.salaryMax) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-teal-500" />
                      {formatSalary(template.salaryMin, template.salaryMax)}
                    </span>
                    {template.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-teal-500" />
                        {template.location}
                      </span>
                    )}
                  </div>
                )}

                {/* Remote badge */}
                {template.remote && (
                  <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400">
                    {t.jobTemplates.remote}
                  </Badge>
                )}

                {/* Skills tags */}
                {template.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-thin">
                    {template.skills.slice(0, 4).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {template.skills.length > 4 && (
                      <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-0">
                        +{template.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Usage & Date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t.jobTemplates.templateUsed} {template.usageCount} {t.jobTemplates.times}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(template.updatedAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs h-8"
                    onClick={() => openUseDialog(template)}
                  >
                    <Copy className="w-3 h-3 me-1" />
                    {t.jobTemplates.useTemplate}
                  </Button>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 w-8 p-0"
                          onClick={() => openEditDialog(template)}
                          aria-label={t.jobTemplates.editTemplate}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.jobTemplates.editTemplate}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(template)}
                          aria-label={t.jobTemplates.deleteTemplate}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.jobTemplates.deleteTemplate}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed animate-fade-in-up">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 mb-4">
              <FileText className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t.jobTemplates.noTemplates}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t.jobTemplates.subtitle}</p>
            <Button
              className="mt-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
              onClick={() => {
                setFormData(emptyForm);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 me-2" />
              {t.jobTemplates.createTemplate}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Template Dialog */}
      <TemplateFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title={t.jobTemplates.createTemplate}
        onSubmit={handleCreate}
      />

      {/* Edit Template Dialog */}
      <TemplateFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title={t.jobTemplates.editTemplate}
        onSubmit={handleEdit}
        isEdit
      />

      {/* Use Template Confirmation Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="sm:max-w-md dialog-content-glow">
          <DialogHeader className="dialog-header-accent pt-2">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              {t.jobTemplates.useTemplate}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t.jobTemplates.useThisTemplate}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-3 py-2">
              <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white shrink-0">
                      <span className="text-[10px] font-bold">{getInitials(selectedTemplate.title)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{selectedTemplate.title}</p>
                      <p className="text-xs text-muted-foreground">{getDepartmentLabel(selectedTemplate.department)}</p>
                    </div>
                  </div>
                  {selectedTemplate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {(selectedTemplate.salaryMin || selectedTemplate.salaryMax) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatSalary(selectedTemplate.salaryMin, selectedTemplate.salaryMax)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="h-9">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              onClick={handleUseTemplate}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
            >
              <Copy className="w-4 h-4 me-1" />
              {t.jobTemplates.useTemplate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dialog-content-glow">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {t.jobTemplates.deleteTemplate}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t.jobTemplates.confirmDelete}</p>
              <p className="text-xs">{t.jobTemplates.deleteWarning}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
