// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCards from './components/StatsCards';
import AssessmentFilters from './components/AssessmentFilters';
import AssessmentList from './components/AssessmentList';
import CreateAssessmentDialog from './components/CreateAssessmentDialog';
import GenerateAIDialog from './components/GenerateAIDialog';
import AssessmentDetailDialog from './components/AssessmentDetailDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

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
    if (!formTitle.trim()) { toast.error(sa.titleRequired); return; }
    if (formSkillIds.length === 0) { toast.error(sa.selectAtLeastOne); return; }
    try {
      const res = await fetch('/api/skill-assessments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, description: formDescription, skillIds: formSkillIds, type: formType, passingScore: formPassingScore, timeLimitMinutes: formTimeLimit, questions: formQuestions }),
      });
      if (res.ok) { toast.success(sa.assessmentCreated); setShowCreateDialog(false); resetForm(); fetchAssessments(); }
      else { const data = await res.json(); toast.error(data.error || 'Failed to create assessment'); }
    } catch { toast.error('Failed to create assessment'); }
  };

  const handleGenerateQuestions = async () => {
    if (formSkillIds.length === 0) { toast.error(sa.selectAtLeastOne); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/skill-assessments/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds: formSkillIds, type: formType, difficulty: formDifficulty, count: formQuestionCount }),
      });
      if (res.ok) { const data = await res.json(); setFormQuestions(data.questions || []); toast.success(sa.questionsGenerated); }
      else { toast.error('Failed to generate questions'); }
    } catch { toast.error('Failed to generate questions'); }
    finally { setGenerating(false); }
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;
    try {
      const res = await fetch(`/api/skill-assessments/${selectedAssessment.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success(sa.assessmentDeleted); setShowDeleteDialog(false); setSelectedAssessment(null); fetchAssessments(); }
    } catch { toast.error('Failed to delete assessment'); }
  };

  const handleViewDetail = async (assessment: AssessmentItem) => {
    setSelectedAssessment(assessment);
    try {
      const res = await fetch(`/api/skill-assessments/${assessment.id}`);
      if (res.ok) { const data = await res.json(); setAssessmentResults(data.assessment?.results || []); }
    } catch { setAssessmentResults([]); }
    setShowDetailDialog(true);
  };

  const resetForm = () => { setFormTitle(''); setFormDescription(''); setFormSkillIds([]); setFormType('CUSTOM'); setFormPassingScore(70); setFormTimeLimit(30); setFormDifficulty('MEDIUM'); setFormQuestionCount(5); setFormQuestions([]); };
  const toggleSkill = (skillId: string) => { setFormSkillIds((prev) => prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]); };
  const totalAssessments = assessments.length;
  const activeAssessments = assessments.filter((a) => a.isActive).length;
  const avgScore = assessments.length > 0 ? Math.round(assessments.reduce((sum, a) => sum + a.averageScore, 0) / assessments.length) : 0;
  const skillsCovered = new Set(assessments.flatMap((a) => a.skillIds)).size;
  const filtered = assessments.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) && (categoryFilter === 'ALL' || a.type === categoryFilter));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return 'bg-slate-50 text-blue-700 dark:bg-teal-950';
      case 'SOFT_SKILL': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950';
      case 'DOMAIN': return 'bg-amber-50 text-amber-700 dark:bg-amber-950';
      case 'TOOL': return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950';
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
      case 'CODING': return { label: sa.coding, color: 'bg-teal-100 text-slate-800 dark:bg-teal-900' };
      case 'SITUATIONAL': return { label: sa.situational, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900' };
      case 'BEHAVIORAL': return { label: sa.behavioral, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' };
      default: return { label: sa.custom, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{sa.title}</h1>
          <p className="text-muted-foreground mt-1">{sa.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setShowGenerateDialog(true); }} variant="outline" className="gap-2 border-slate-300 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"><Sparkles className="h-4 w-4" />{sa.generateWithAI}</Button>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" />{sa.createAssessment}</Button>
        </div>
      </div>
      <StatsCards totalAssessments={totalAssessments} activeAssessments={activeAssessments} avgScore={avgScore} skillsCovered={skillsCovered} sa={sa} />
      <AssessmentFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} sa={sa} />
      <AssessmentList loading={loading} filtered={filtered} getTypeBadge={getTypeBadge} getCategoryColor={getCategoryColor} sa={sa} onViewDetail={handleViewDetail} onDelete={(a) => { setSelectedAssessment(a); setShowDeleteDialog(true); }} onCreateNew={() => { resetForm(); setShowCreateDialog(true); }} />
      <CreateAssessmentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} formTitle={formTitle} setFormTitle={setFormTitle} formDescription={formDescription} setFormDescription={setFormDescription} formType={formType} setFormType={setFormType} formPassingScore={formPassingScore} setFormPassingScore={setFormPassingScore} formTimeLimit={formTimeLimit} setFormTimeLimit={setFormTimeLimit} formQuestionCount={formQuestionCount} setFormQuestionCount={setFormQuestionCount} formSkillIds={formSkillIds} toggleSkill={toggleSkill} taxonomy={taxonomy} getCategoryLabel={getCategoryLabel} sa={sa} handleCreateAssessment={handleCreateAssessment} />
      <GenerateAIDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog} formTitle={formTitle} setFormTitle={setFormTitle} formType={formType} setFormType={setFormType} formDifficulty={formDifficulty} setFormDifficulty={setFormDifficulty} formQuestionCount={formQuestionCount} setFormQuestionCount={setFormQuestionCount} formSkillIds={formSkillIds} toggleSkill={toggleSkill} formQuestions={formQuestions} generating={generating} taxonomy={taxonomy} getCategoryLabel={getCategoryLabel} sa={sa} handleGenerateQuestions={handleGenerateQuestions} handleCreateAssessment={handleCreateAssessment} />
      <AssessmentDetailDialog open={showDetailDialog} onOpenChange={setShowDetailDialog} selectedAssessment={selectedAssessment} assessmentResults={assessmentResults} getCategoryColor={getCategoryColor} sa={sa} />
      <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} sa={sa} handleDeleteAssessment={handleDeleteAssessment} />
    </div>
  );
}
