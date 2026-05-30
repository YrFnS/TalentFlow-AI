'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import {
  Brain,
  Plus,
  Sparkles,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface SkillTaxonomy {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
}

interface SkillInfo {
  name: string;
  category: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  description?: string;
  skillIds: string[];
  skills: SkillInfo[];
  questions: unknown[];
  timeLimitMinutes: number | null;
  passingScore: number;
  type: string;
  isActive: boolean;
  createdAt: string;
  totalResults: number;
  averageScore: number;
}

interface AssessmentResult {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  score: number | null;
  overallLevel: string | null;
  completedAt: string;
}

export default function SkillAssessmentsContent() {
  const { t } = useI18n();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [generating, setGenerating] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSkillIds, setFormSkillIds] = useState<string[]>([]);
  const [formType, setFormType] = useState('CUSTOM');
  const [formPassingScore, setFormPassingScore] = useState(70);
  const [formTimeLimit, setFormTimeLimit] = useState<number | null>(30);
  const [formDifficulty, setFormDifficulty] = useState('MEDIUM');
  const [formQuestionCount, setFormQuestionCount] = useState(5);
  const [formQuestions, setFormQuestions] = useState<unknown[]>([]);

  const sa = t.skillAssessment;

  const fetchTaxonomy = useCallback(async () => {
    try {
      const res = await fetch('/api/skills/taxonomy');
      if (res.ok) {
        const data = await res.json();
        setTaxonomy(data.skills || []);
      }
    } catch (err) {
      console.error('Error fetching taxonomy:', err);
    }
  }, []);

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/skill-assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
    fetchAssessments();
  }, [fetchTaxonomy, fetchAssessments]);

  const handleCreateAssessment = async () => {
    if (!formTitle.trim()) {
      toast.error(sa.titleRequired);
      return;
    }
    if (formSkillIds.length === 0) {
      toast.error(sa.selectAtLeastOne);
      return;
    }

    try {
      const res = await fetch('/api/skill-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          skillIds: formSkillIds,
          type: formType,
          passingScore: formPassingScore,
          timeLimitMinutes: formTimeLimit,
          questions: formQuestions,
        }),
      });

      if (res.ok) {
        toast.success(sa.assessmentCreated);
        setShowCreateDialog(false);
        resetForm();
        fetchAssessments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create assessment');
      }
    } catch {
      toast.error('Failed to create assessment');
    }
  };

  const handleGenerateQuestions = async () => {
    if (formSkillIds.length === 0) {
      toast.error(sa.selectAtLeastOne);
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/skill-assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillIds: formSkillIds,
          type: formType,
          difficulty: formDifficulty,
          count: formQuestionCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormQuestions(data.questions || []);
        toast.success(sa.questionsGenerated);
      } else {
        toast.error('Failed to generate questions');
      }
    } catch {
      toast.error('Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      const res = await fetch(`/api/skill-assessments/${selectedAssessment.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(sa.assessmentDeleted);
        setShowDeleteDialog(false);
        setSelectedAssessment(null);
        fetchAssessments();
      }
    } catch {
      toast.error('Failed to delete assessment');
    }
  };

  const handleViewDetail = async (assessment: AssessmentItem) => {
    setSelectedAssessment(assessment);
    try {
      const res = await fetch(`/api/skill-assessments/${assessment.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssessmentResults(data.assessment?.results || []);
      }
    } catch {
      setAssessmentResults([]);
    }
    setShowDetailDialog(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSkillIds([]);
    setFormType('CUSTOM');
    setFormPassingScore(70);
    setFormTimeLimit(30);
    setFormDifficulty('MEDIUM');
    setFormQuestionCount(5);
    setFormQuestions([]);
  };

  const toggleSkill = (skillId: string) => {
    setFormSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Stats
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter((a) => a.isActive).length;
  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.averageScore, 0) / assessments.length)
    : 0;
  const uniqueSkillIds = new Set(assessments.flatMap((a) => a.skillIds));
  const skillsCovered = uniqueSkillIds.size;

  // Filtered assessments
  const filtered = assessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || a.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400';
      case 'SOFT_SKILL': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
      case 'DOMAIN': return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
      case 'TOOL': return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400';
      case 'CERTIFICATION': return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return sa.technical;
      case 'SOFT_SKILL': return sa.softSkill;
      case 'DOMAIN': return sa.domain;
      case 'TOOL': return sa.tool;
      case 'CERTIFICATION': return sa.certification;
      default: return category;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CODING': return { label: sa.coding, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' };
      case 'SITUATIONAL': return { label: sa.situational, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' };
      case 'BEHAVIORAL': return { label: sa.behavioral, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' };
      default: return { label: sa.custom, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  const filteredTaxonomy = taxonomy.filter((s) => {
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sa.title}</h1>
          <p className="text-muted-foreground mt-1">{sa.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowGenerateDialog(true);
            }}
            variant="outline"
            className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
          >
            <Sparkles className="h-4 w-4" />
            {sa.generateWithAI}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            {sa.createAssessment}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/50">
                <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{sa.totalAssessments}</p>
                <p className="text-2xl font-bold">{totalAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{sa.activeAssessments}</p>
                <p className="text-2xl font-bold">{activeAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{sa.avgScore}</p>
                <p className="text-2xl font-bold">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/50">
                <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{sa.skillsCovered}</p>
                <p className="text-2xl font-bold">{skillsCovered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={sa.selectSkills + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="CUSTOM">{sa.custom}</SelectItem>
            <SelectItem value="CODING">{sa.coding}</SelectItem>
            <SelectItem value="SITUATIONAL">{sa.situational}</SelectItem>
            <SelectItem value="BEHAVIORAL">{sa.behavioral}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assessments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">{sa.noAssessments}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{sa.subtitle}</p>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="mt-4 gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              {sa.createAssessment}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((assessment) => {
            const typeBadge = getTypeBadge(assessment.type);
            return (
              <Card
                key={assessment.id}
                className="card-hover-lift cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleViewDetail(assessment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{assessment.title}</h3>
                        <Badge className={`text-[10px] ${typeBadge.color}`}>
                          {typeBadge.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            assessment.isActive
                              ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                              : 'border-gray-300 text-gray-500'
                          }
                        >
                          {assessment.isActive ? sa.active : sa.inactive}
                        </Badge>
                      </div>
                      {assessment.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {assessment.questions?.length || 0} {sa.questions.toLowerCase()}
                        </span>
                        {assessment.timeLimitMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {assessment.timeLimitMinutes} {sa.minutes}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {sa.passingScore}: {assessment.passingScore}%
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {sa.avgScore}: {assessment.averageScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {assessment.skills.slice(0, 5).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`text-[10px] ${getCategoryColor(skill.category)}`}
                          >
                            {skill.name}
                          </Badge>
                        ))}
                        {assessment.skills.length > 5 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{assessment.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(assessment); }}>
                          <Eye className="h-4 w-4 me-2" />
                          {sa.viewResults}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Pencil className="h-4 w-4 me-2" />
                          {sa.editAssessment}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssessment(assessment);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {sa.deleteAssessment}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Assessment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{sa.createAssessment}</DialogTitle>
            <DialogDescription>{sa.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{sa.assessmentTitle} *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={sa.assessmentTitle}
              />
            </div>
            <div className="space-y-2">
              <Label>{sa.description}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={sa.description}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{sa.assessmentType}</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">{sa.custom}</SelectItem>
                    <SelectItem value="CODING">{sa.coding}</SelectItem>
                    <SelectItem value="SITUATIONAL">{sa.situational}</SelectItem>
                    <SelectItem value="BEHAVIORAL">{sa.behavioral}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{sa.passingScore}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formPassingScore}
                  onChange={(e) => setFormPassingScore(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{sa.timeLimit} ({sa.minutes})</Label>
                <Input
                  type="number"
                  min={0}
                  value={formTimeLimit || ''}
                  onChange={(e) => setFormTimeLimit(e.target.value ? Number(e.target.value) : null)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>{sa.questionCount}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formQuestionCount}
                  onChange={(e) => setFormQuestionCount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{sa.selectSkills} *</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {['TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'TOOL', 'CERTIFICATION'].map((cat) => {
                  const catSkills = filteredTaxonomy.filter((s) => s.category === cat);
                  if (catSkills.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                        {getCategoryLabel(cat)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {catSkills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant={formSkillIds.includes(skill.id) ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs transition-all ${
                              formSkillIds.includes(skill.id)
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'hover:border-teal-400'
                            }`}
                            onClick={() => toggleSkill(skill.id)}
                          >
                            {skill.name}
                            {formSkillIds.includes(skill.id) && (
                              <X className="h-2.5 w-2.5 ms-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {formSkillIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formSkillIds.length} skill(s) selected
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {sa.goBack}
            </Button>
            <Button
              onClick={handleCreateAssessment}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={formSkillIds.length === 0 || !formTitle.trim()}
            >
              {sa.saveAssessment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate with AI Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              {sa.generateWithAI}
            </DialogTitle>
            <DialogDescription>
              {sa.generatingQuestions}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{sa.assessmentTitle} *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={sa.assessmentTitle}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{sa.assessmentType}</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">{sa.custom}</SelectItem>
                    <SelectItem value="CODING">{sa.coding}</SelectItem>
                    <SelectItem value="SITUATIONAL">{sa.situational}</SelectItem>
                    <SelectItem value="BEHAVIORAL">{sa.behavioral}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{sa.difficulty}</Label>
                <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{sa.easy}</SelectItem>
                    <SelectItem value="MEDIUM">{sa.medium}</SelectItem>
                    <SelectItem value="HARD">{sa.hard}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{sa.questionCount}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formQuestionCount}
                  onChange={(e) => setFormQuestionCount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{sa.selectSkills} *</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {['TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'TOOL', 'CERTIFICATION'].map((cat) => {
                  const catSkills = filteredTaxonomy.filter((s) => s.category === cat);
                  if (catSkills.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                        {getCategoryLabel(cat)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {catSkills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant={formSkillIds.includes(skill.id) ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs transition-all ${
                              formSkillIds.includes(skill.id)
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'hover:border-teal-400'
                            }`}
                            onClick={() => toggleSkill(skill.id)}
                          >
                            {skill.name}
                            {formSkillIds.includes(skill.id) && (
                              <X className="h-2.5 w-2.5 ms-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {formSkillIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formSkillIds.length} skill(s) selected
                </p>
              )}
            </div>

            {/* Generated Questions Preview */}
            {formQuestions.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {sa.questionsGenerated}
                </Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {(formQuestions as { question: string; type: string; difficulty: string }[]).map((q, idx) => (
                    <div key={idx} className="text-sm flex gap-2">
                      <span className="text-muted-foreground font-medium">{idx + 1}.</span>
                      <div>
                        <p>{q.question}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-[9px]">{q.type}</Badge>
                          <Badge variant="secondary" className="text-[9px]">{q.difficulty}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              {sa.goBack}
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateQuestions}
              disabled={generating || formSkillIds.length === 0}
              className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {sa.generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {sa.generateWithAI}
                </>
              )}
            </Button>
            <Button
              onClick={handleCreateAssessment}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={formSkillIds.length === 0 || !formTitle.trim() || formQuestions.length === 0}
            >
              {sa.saveAssessment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedAssessment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-teal-500" />
                  {selectedAssessment.title}
                </DialogTitle>
                <DialogDescription>{selectedAssessment.description || sa.subtitle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Assessment Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30">
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                      {selectedAssessment.questions?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">{sa.questions}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedAssessment.passingScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">{sa.passingScore}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {selectedAssessment.timeLimitMinutes || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{sa.timeLimit}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
                    <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                      {selectedAssessment.totalResults}
                    </p>
                    <p className="text-xs text-muted-foreground">{sa.totalResults}</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">{sa.selectSkills}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAssessment.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={`text-xs ${getCategoryColor(skill.category)}`}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Results Table */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">{sa.results}</h4>
                  {assessmentResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {sa.noResults}
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-semibold text-muted-foreground">
                        <span>{sa.candidateName}</span>
                        <span>{sa.score}</span>
                        <span>{sa.level}</span>
                        <span>{sa.passingScore}</span>
                        <span>{sa.completedAt}</span>
                      </div>
                      <ScrollArea className="max-h-48">
                        {assessmentResults.map((result) => (
                          <div
                            key={result.id}
                            className="grid grid-cols-5 gap-2 p-3 border-t text-sm items-center"
                          >
                            <span className="font-medium truncate">{result.candidateName}</span>
                            <span className="font-mono">{result.score !== null ? `${result.score}%` : '—'}</span>
                            <span>
                              {result.overallLevel ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  {result.overallLevel}
                                </Badge>
                              ) : '—'}
                            </span>
                            <span>
                              {(result.score !== null && result.score >= selectedAssessment.passingScore) ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
                                  {sa.passed}
                                </Badge>
                              ) : result.score !== null ? (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-[10px]">
                                  {sa.failed}
                                </Badge>
                              ) : '—'}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(result.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sa.deleteAssessment}</DialogTitle>
            <DialogDescription>{sa.deleteConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {sa.goBack}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssessment}>
              {sa.deleteAssessment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
