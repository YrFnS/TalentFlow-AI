// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  FileText,
  Briefcase,
  DollarSign,
  MapPin,
  Eye,
  AlertCircle,
  Settings,
  HelpCircle,
  AlertTriangle,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ScreeningQuestion {
  question: string;
  questionType: 'YES_NO' | 'MULTIPLE_CHOICE' | 'TEXT' | 'NUMBER' | 'DATE';
  options: string[];
  isRequired: boolean;
  isKnockout: boolean;
  knockoutAnswer: string;
}

const steps = [
  { id: 1, title: 'Details', icon: Briefcase },
  { id: 2, title: 'Requirements', icon: FileText },
  { id: 3, title: 'Compensation', icon: DollarSign },
  { id: 4, title: 'Screening', icon: HelpCircle },
  { id: 5, title: 'Preview', icon: Eye },
];

const jobTypeOptions = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'AED', label: 'AED (د.إ)' },
];

const questionTypeOptions = [
  { value: 'YES_NO', labelKey: 'typeYesNo' },
  { value: 'MULTIPLE_CHOICE', labelKey: 'typeMultipleChoice' },
  { value: 'TEXT', labelKey: 'typeText' },
  { value: 'NUMBER', labelKey: 'typeNumber' },
  { value: 'DATE', labelKey: 'typeDate' },
];

function createEmptyQuestion(): ScreeningQuestion {
  return {
    question: '',
    questionType: 'YES_NO',
    options: [],
    isRequired: true,
    isKnockout: false,
    knockoutAnswer: '',
  };
}

export default function CreateJobPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiForm, setAiForm] = useState({
    title: '',
    department: '',
    level: 'Mid',
    requirements: '',
  });
  const [companyId, setCompanyId] = useState('');
  const [screeningAiLoading, setScreeningAiLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    benefits: [''],
    jobType: 'FULL_TIME',
    location: '',
    isRemote: false,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    experienceMin: '',
    experienceMax: '',
    skills: [] as string[],
    openings: '1',
    deadline: '',
  });

  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    (async () => {
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      const seedData = await seedRes.json();
      setCompanyId(seedData.companyId);
    })();
  }, []);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addListItem = (field: 'requirements' | 'responsibilities' | 'benefits') => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeListItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateListItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      updateField('skills', [...form.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    updateField('skills', form.skills.filter((s) => s !== skill));
  };

  // Screening question management
  const addScreeningQuestion = () => {
    setScreeningQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeScreeningQuestion = (index: number) => {
    setScreeningQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScreeningQuestion = (index: number, field: keyof ScreeningQuestion, value: unknown) => {
    setScreeningQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const updated = { ...q, [field]: value };
        // Reset knockout answer if knockout is disabled
        if (field === 'isKnockout' && !value) {
          updated.knockoutAnswer = '';
        }
        // Reset options when type changes from MULTIPLE_CHOICE
        if (field === 'questionType' && value !== 'MULTIPLE_CHOICE') {
          updated.options = [];
        }
        // Initialize options for MULTIPLE_CHOICE
        if (field === 'questionType' && value === 'MULTIPLE_CHOICE' && q.options.length === 0) {
          updated.options = ['', ''];
        }
        return updated;
      })
    );
  };

  const addScreeningOption = (qIndex: number) => {
    setScreeningQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q
      )
    );
  };

  const removeScreeningOption = (qIndex: number, optIndex: number) => {
    setScreeningQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, oi) => oi !== optIndex) }
          : q
      )
    );
  };

  const updateScreeningOption = (qIndex: number, optIndex: number, value: string) => {
    setScreeningQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) }
          : q
      )
    );
  };

  const moveScreeningQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= screeningQuestions.length) return;
    setScreeningQuestions((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const handleSuggestScreeningQuestions = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a job title first');
      return;
    }
    setScreeningAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-screening-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: form.title,
          jobDescription: form.description,
        }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const mapped: ScreeningQuestion[] = data.questions.map(
          (q: {
            question: string;
            questionType: string;
            options?: string[] | null;
            isRequired?: boolean;
            isKnockout?: boolean;
            knockoutAnswer?: string | null;
          }) => ({
            question: q.question,
            questionType: (q.questionType as ScreeningQuestion['questionType']) || 'YES_NO',
            options: Array.isArray(q.options) ? q.options : [],
            isRequired: q.isRequired ?? true,
            isKnockout: q.isKnockout ?? false,
            knockoutAnswer: q.knockoutAnswer || '',
          })
        );
        setScreeningQuestions((prev) => [...prev, ...mapped]);
        toast.success(`Added ${mapped.length} screening questions`);
      } else {
        toast.error('No questions were generated');
      }
    } catch {
      toast.error('Failed to generate screening questions');
    } finally {
      setScreeningAiLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.title) return;
    setAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiForm.title,
          department: aiForm.department || undefined,
          level: aiForm.level || undefined,
          requirements: aiForm.requirements || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || 'Failed to generate job description');
        return;
      }

      if (data.description) {
        setForm((prev) => ({ ...prev, description: data.description }));
      }
      if (Array.isArray(data.responsibilities) && data.responsibilities.length > 0) {
        setForm((prev) => ({ ...prev, responsibilities: data.responsibilities }));
      }
      if (Array.isArray(data.qualifications) && data.qualifications.length > 0) {
        setForm((prev) => ({ ...prev, requirements: data.qualifications }));
      }
      if (Array.isArray(data.benefits) && data.benefits.length > 0) {
        setForm((prev) => ({ ...prev, benefits: data.benefits }));
      }
      if (aiForm.title && !form.title) {
        setForm((prev) => ({ ...prev, title: aiForm.title }));
      }
      setAiDialogOpen(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (status: 'DRAFT' | 'OPEN') => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          createdById: user?.id || 'seed-user',
          title: form.title,
          description: form.description,
          requirements: form.requirements.filter((r) => r.trim()),
          responsibilities: form.responsibilities.filter((r) => r.trim()),
          benefits: form.benefits.filter((b) => b.trim()),
          jobType: form.jobType,
          status,
          salaryMin: form.salaryMin,
          salaryMax: form.salaryMax,
          salaryCurrency: form.salaryCurrency,
          location: form.location,
          isRemote: form.isRemote,
          experienceMin: form.experienceMin,
          experienceMax: form.experienceMax,
          skills: form.skills,
          openings: form.openings,
          deadline: form.deadline || null,
        }),
      });

      if (res.ok) {
        const jobData = await res.json();
        // Save screening questions if any
        if (screeningQuestions.length > 0 && screeningQuestions.some((q) => q.question.trim())) {
          const validQuestions = screeningQuestions
            .filter((q) => q.question.trim())
            .map((q, index) => ({
              question: q.question,
              questionType: q.questionType,
              options: q.questionType === 'MULTIPLE_CHOICE' ? q.options.filter((o) => o.trim()) : null,
              isRequired: q.isRequired,
              isKnockout: q.isKnockout,
              knockoutAnswer: q.isKnockout ? q.knockoutAnswer : null,
              order: index,
            }));
          await fetch('/api/screening-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: jobData.id, questions: validQuestions }),
          });
        }
        router.push('/company/jobs');
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.title.trim() && form.description.trim();
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const totalSteps = 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/company/jobs')} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.jobs.createJob}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Fill in the details to create a new job posting</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive && 'bg-blue-600/10 text-blue-700',
                  isComplete && 'text-blue-600 cursor-pointer',
                  !isActive && !isComplete && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    isActive && 'bg-blue-600 text-white',
                    isComplete && 'bg-teal-100 text-blue-600',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn('flex-1 h-px mx-1', isComplete ? 'bg-teal-300 dark:bg-blue-700' : 'bg-border')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Job Details</h2>
                  <p className="text-sm text-muted-foreground">Basic information about the position</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAiForm((prev) => ({ ...prev, title: form.title }));
                      setAiError(null);
                      setAiDialogOpen(true);
                    }}
                    className="border-slate-300 text-blue-600 hover:bg-slate-50"
                  >
                    <Sparkles className="w-4 h-4 me-2" />
                    AI Generate
                  </Button>
                  {aiError && (
                    <div className="flex items-start gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 max-w-xs">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-700">{aiError}</p>
                        {aiError.includes('No active AI provider') && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-600" asChild>
                            <Link href="/company/ai-settings">
                              <Settings className="h-3 w-3 mr-1" />
                              Configure AI
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">{t.jobs.jobTitle} *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Frontend Engineer"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t.jobs.jobDescription} *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, team, and what makes this opportunity exciting..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={8}
                    className="resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t.jobs.jobType}</Label>
                    <Select value={form.jobType} onValueChange={(v) => updateField('jobType', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="openings">{t.jobs.openings}</Label>
                    <Input
                      id="openings"
                      type="number"
                      min="1"
                      value={form.openings}
                      onChange={(e) => updateField('openings', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">{t.jobs.location}</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={form.location}
                      onChange={(e) => updateField('location', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">{t.jobs.deadline}</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => updateField('deadline', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.isRemote}
                    onCheckedChange={(v) => updateField('isRemote', v)}
                  />
                  <Label>Remote-friendly position</Label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Requirements & Skills</h2>
                <p className="text-sm text-muted-foreground">Define what you&apos;re looking for in a candidate</p>
              </div>

              {/* Requirements */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t.jobs.requirements}</Label>
                  <Button variant="outline" size="sm" onClick={() => addListItem('requirements')} className="h-7 text-xs">
                    + Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <Input
                        placeholder="e.g., 5+ years of experience..."
                        value={req}
                        onChange={(e) => updateListItem('requirements', i, e.target.value)}
                        className="flex-1"
                      />
                      {form.requirements.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('requirements', i)}>
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t.jobs.responsibilities}</Label>
                  <Button variant="outline" size="sm" onClick={() => addListItem('responsibilities')} className="h-7 text-xs">
                    + Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.responsibilities.map((resp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <Input
                        placeholder="e.g., Lead the development of..."
                        value={resp}
                        onChange={(e) => updateListItem('responsibilities', i, e.target.value)}
                        className="flex-1"
                      />
                      {form.responsibilities.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('responsibilities', i)}>
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t.jobs.benefits}</Label>
                  <Button variant="outline" size="sm" onClick={() => addListItem('benefits')} className="h-7 text-xs">
                    + Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.benefits.map((ben, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <Input
                        placeholder="e.g., Competitive salary..."
                        value={ben}
                        onChange={(e) => updateListItem('benefits', i, e.target.value)}
                        className="flex-1"
                      />
                      {form.benefits.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeListItem('benefits', i)}>
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="grid gap-2">
                <Label>{t.jobs.skills}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={addSkill} className="flex-shrink-0">
                    Add
                  </Button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-2.5 py-1 text-xs gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expMin">Min Experience (years)</Label>
                  <Input
                    id="expMin"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.experienceMin}
                    onChange={(e) => updateField('experienceMin', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expMax">Max Experience (years)</Label>
                  <Input
                    id="expMax"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={form.experienceMax}
                    onChange={(e) => updateField('experienceMax', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Compensation</h2>
                <p className="text-sm text-muted-foreground">Set the salary range and currency</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="80000"
                    value={form.salaryMin}
                    onChange={(e) => updateField('salaryMin', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="120000"
                    value={form.salaryMax}
                    onChange={(e) => updateField('salaryMax', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={form.salaryCurrency} onValueChange={(v) => updateField('salaryCurrency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.salaryMin && form.salaryMax && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/30">
                  <p className="text-sm font-medium text-blue-700">
                    Salary Range: ${parseInt(form.salaryMin).toLocaleString()} - ${parseInt(form.salaryMax).toLocaleString()} {form.salaryCurrency}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{t.screening.title}</h2>
                  <p className="text-sm text-muted-foreground">{t.screening.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestScreeningQuestions}
                    disabled={screeningAiLoading || !form.title.trim()}
                    className="border-slate-300 text-blue-600 hover:bg-slate-50"
                  >
                    {screeningAiLoading ? (
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 me-2" />
                    )}
                    {screeningAiLoading ? t.screening.generating : t.screening.suggestWithAI}
                  </Button>
                  <Button
                    size="sm"
                    onClick={addScreeningQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 me-2" />
                    {t.screening.addQuestion}
                  </Button>
                </div>
              </div>

              {screeningQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">{t.screening.noQuestions}</p>
                  <p className="text-muted-foreground text-xs mt-1">Add questions manually or use AI to suggest relevant ones</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {screeningQuestions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className={cn(
                        'border rounded-lg p-4 space-y-4 transition-colors',
                        q.isKnockout
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10'
                          : 'border-border'
                      )}
                    >
                      {/* Question Header */}
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 cursor-grab" />
                        <span className="text-xs font-medium text-muted-foreground">#{qIndex + 1}</span>
                        <div className="flex-1" />
                        {qIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveScreeningQuestion(qIndex, 'up')}
                            title={t.screening.moveUp}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                        )}
                        {qIndex < screeningQuestions.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveScreeningQuestion(qIndex, 'down')}
                            title={t.screening.moveDown}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeScreeningQuestion(qIndex)}
                          title={t.screening.removeQuestion}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Question Text */}
                      <div className="grid gap-2">
                        <Label className="text-xs">{t.screening.questionText}</Label>
                        <Input
                          placeholder="e.g., Do you have experience with React?"
                          value={q.question}
                          onChange={(e) => updateScreeningQuestion(qIndex, 'question', e.target.value)}
                        />
                      </div>

                      {/* Question Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-xs">{t.screening.questionType}</Label>
                          <Select
                            value={q.questionType}
                            onValueChange={(v) => updateScreeningQuestion(qIndex, 'questionType', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {t.screening[opt.labelKey as keyof typeof t.screening]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Required Toggle */}
                        <div className="grid gap-2">
                          <Label className="text-xs">{t.screening.required}/{t.screening.optional}</Label>
                          <div className="flex items-center gap-3 h-10">
                            <Switch
                              checked={q.isRequired}
                              onCheckedChange={(v) => updateScreeningQuestion(qIndex, 'isRequired', v)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {q.isRequired ? t.screening.required : t.screening.optional}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Multiple Choice Options */}
                      {q.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="grid gap-2">
                          <Label className="text-xs">{t.screening.typeMultipleChoice} {t.screening.questionType.split(' ')[0]}</Label>
                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border border-slate-300 text-blue-600 text-[10px] flex items-center justify-center flex-shrink-0">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <Input
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={opt}
                                  onChange={(e) => updateScreeningOption(qIndex, optIndex, e.target.value)}
                                  className="flex-1 h-8 text-sm"
                                />
                                {q.options.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeScreeningOption(qIndex, optIndex)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addScreeningOption(qIndex)}
                            className="h-7 text-xs border-slate-300 text-blue-600"
                          >
                            <Plus className="w-3 h-3 me-1" />
                            {t.screening.addOption}
                          </Button>
                        </div>
                      )}

                      {/* Knockout Toggle */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={q.isKnockout}
                            onCheckedChange={(v) => updateScreeningQuestion(qIndex, 'isKnockout', v)}
                          />
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <Label className="text-sm font-medium">{t.screening.knockout}</Label>
                          </div>
                        </div>
                        {q.isKnockout && (
                          <div className="ms-7 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 space-y-3">
                            <p className="text-xs text-amber-700">
                              {t.screening.knockoutDesc}
                            </p>
                            <div className="grid gap-2">
                              <Label className="text-xs text-amber-700">
                                {t.screening.disqualifyAnswer}
                              </Label>
                              {q.questionType === 'YES_NO' ? (
                                <Select
                                  value={q.knockoutAnswer}
                                  onValueChange={(v) => updateScreeningQuestion(qIndex, 'knockoutAnswer', v)}
                                >
                                  <SelectTrigger className="h-8 border-amber-300 dark:border-amber-700">
                                    <SelectValue placeholder={t.screening.selectAnswer} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Yes">{t.screening.yes}</SelectItem>
                                    <SelectItem value="No">{t.screening.no}</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : q.questionType === 'MULTIPLE_CHOICE' ? (
                                <Select
                                  value={q.knockoutAnswer}
                                  onValueChange={(v) => updateScreeningQuestion(qIndex, 'knockoutAnswer', v)}
                                >
                                  <SelectTrigger className="h-8 border-amber-300 dark:border-amber-700">
                                    <SelectValue placeholder={t.screening.selectAnswer} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {q.options
                                      .filter((o) => o.trim())
                                      .map((opt, i) => (
                                        <SelectItem key={i} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder={t.screening.enterAnswer}
                                  value={q.knockoutAnswer}
                                  onChange={(e) => updateScreeningQuestion(qIndex, 'knockoutAnswer', e.target.value)}
                                  className="h-8 border-amber-300 dark:border-amber-700"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-muted-foreground">Review your job posting before publishing</p>
              </div>

              <div className="border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">{form.title || 'Job Title'}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-teal-100 text-blue-700">
                      {jobTypeOptions.find((o) => o.value === form.jobType)?.label}
                    </Badge>
                    {form.isRemote && <Badge variant="outline">Remote</Badge>}
                    {form.location && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {form.location}
                      </Badge>
                    )}
                  </div>
                </div>

                {form.salaryMin && form.salaryMax && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Salary</h4>
                    <p className="text-sm text-blue-600">
                      ${parseInt(form.salaryMin).toLocaleString()} - ${parseInt(form.salaryMax).toLocaleString()} {form.salaryCurrency}
                    </p>
                  </div>
                )}

                {form.description && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.jobs.jobDescription}</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{form.description}</div>
                  </div>
                )}

                {form.requirements.filter((r) => r.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.jobs.requirements}</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {form.requirements.filter((r) => r.trim()).map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {form.responsibilities.filter((r) => r.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.jobs.responsibilities}</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {form.responsibilities.filter((r) => r.trim()).map((resp, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {form.benefits.filter((b) => b.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.jobs.benefits}</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {form.benefits.filter((b) => b.trim()).map((ben, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{ben}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {form.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.jobs.skills}</h4>
                    <div className="flex flex-wrap gap-2">
                      {form.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(form.experienceMin || form.experienceMax) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">{t.jobs.experience}</h4>
                    <p className="text-sm text-muted-foreground">
                      {form.experienceMin || '0'} - {form.experienceMax || '∞'} years
                    </p>
                  </div>
                )}

                {/* Screening Questions Preview */}
                {screeningQuestions.length > 0 && screeningQuestions.some((q) => q.question.trim()) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t.screening.title}</h4>
                    <div className="space-y-2">
                      {screeningQuestions.filter((q) => q.question.trim()).map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <div className="flex-1">
                            <span className="text-muted-foreground">{q.question}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {t.screening[q.questionType === 'YES_NO' ? 'typeYesNo' : q.questionType === 'MULTIPLE_CHOICE' ? 'typeMultipleChoice' : q.questionType === 'TEXT' ? 'typeText' : q.questionType === 'NUMBER' ? 'typeNumber' : 'typeDate' as keyof typeof t.screening]}
                              </Badge>
                              {q.isRequired && (
                                <Badge className="text-[10px] h-5 bg-slate-50 text-blue-700 border-0">
                                  {t.screening.required}
                                </Badge>
                              )}
                              {q.isKnockout && (
                                <Badge className="text-[10px] h-5 bg-amber-50 text-amber-700 border-0 gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {t.screening.knockout}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>Openings: {form.openings}</span>
                  {form.deadline && <span>Deadline: {form.deadline}</span>}
                  {screeningQuestions.length > 0 && (
                    <span>{screeningQuestions.filter((q) => q.question.trim()).length} screening questions</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 me-2" />
          {t.common.back}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === totalSteps && (
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
              className="border-slate-300"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
              Save as Draft
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t.common.next}
              <ArrowRight className="w-4 h-4 ms-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit('OPEN')}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Check className="w-4 h-4 me-2" />}
              Publish Job
            </Button>
          )}
        </div>
      </div>

      {/* AI Generate Job Description Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Generate Job Description
            </DialogTitle>
            <DialogDescription>
              Fill in the details below and AI will generate a complete job description, responsibilities, qualifications, and benefits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ai-title">Job Title *</Label>
              <Input
                id="ai-title"
                placeholder="e.g., Senior Frontend Engineer"
                value={aiForm.title}
                onChange={(e) => setAiForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-department">Department</Label>
              <Input
                id="ai-department"
                placeholder="e.g., Engineering"
                value={aiForm.department}
                onChange={(e) => setAiForm((prev) => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-level">Level</Label>
              <Select value={aiForm.level} onValueChange={(v) => setAiForm((prev) => ({ ...prev, level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-requirements">Key Requirements</Label>
              <Textarea
                id="ai-requirements"
                placeholder="e.g., React, TypeScript, 5+ years experience, team leadership..."
                value={aiForm.requirements}
                onChange={(e) => setAiForm((prev) => ({ ...prev, requirements: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleAiGenerate}
              disabled={!aiForm.title.trim() || aiGenerating}
            >
              {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
