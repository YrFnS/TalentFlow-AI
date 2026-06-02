// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { ScreeningQuestion, JobForm, AiForm } from './components/types';
import { createEmptyQuestion } from './components/types';
import StepIndicator from './components/StepIndicator';
import JobDetailsStep from './components/JobDetailsStep';
import RequirementsStep from './components/RequirementsStep';
import CompensationStep from './components/CompensationStep';
import ScreeningStep from './components/ScreeningStep';
import PreviewStep from './components/PreviewStep';
import AiGenerateDialog from './components/AiGenerateDialog';

const TOTAL_STEPS = 5;

const initialForm: JobForm = {
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
  skills: [],
  openings: '1',
  deadline: '',
};

const initialAiForm: AiForm = {
  title: '',
  department: '',
  level: 'Mid',
  requirements: '',
};

export default function CreateJobPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiForm, setAiForm] = useState<AiForm>(initialAiForm);
  const [companyId, setCompanyId] = useState('');
  const [screeningAiLoading, setScreeningAiLoading] = useState(false);

  const [form, setForm] = useState<JobForm>(initialForm);
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);

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
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const updateListItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].map((item, i) => (i === index ? value : item)) }));
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
        if (field === 'isKnockout' && !value) updated.knockoutAnswer = '';
        if (field === 'questionType' && value !== 'MULTIPLE_CHOICE') updated.options = [];
        if (field === 'questionType' && value === 'MULTIPLE_CHOICE' && q.options.length === 0) updated.options = ['', ''];
        return updated;
      })
    );
  };

  const addScreeningOption = (qIndex: number) => {
    setScreeningQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: [...q.options, ''] } : q));
  };

  const removeScreeningOption = (qIndex: number, optIndex: number) => {
    setScreeningQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.filter((_, oi) => oi !== optIndex) } : q));
  };

  const updateScreeningOption = (qIndex: number, optIndex: number, value: string) => {
    setScreeningQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) } : q));
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
        body: JSON.stringify({ jobTitle: form.title, jobDescription: form.description }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const mapped: ScreeningQuestion[] = data.questions.map((q: any) => ({
          question: q.question,
          questionType: (q.questionType as ScreeningQuestion['questionType']) || 'YES_NO',
          options: Array.isArray(q.options) ? q.options : [],
          isRequired: q.isRequired ?? true,
          isKnockout: q.isKnockout ?? false,
          knockoutAnswer: q.knockoutAnswer || '',
        }));
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
      if (data.description) setForm((prev) => ({ ...prev, description: data.description }));
      if (Array.isArray(data.responsibilities) && data.responsibilities.length > 0) setForm((prev) => ({ ...prev, responsibilities: data.responsibilities }));
      if (Array.isArray(data.qualifications) && data.qualifications.length > 0) setForm((prev) => ({ ...prev, requirements: data.qualifications }));
      if (Array.isArray(data.benefits) && data.benefits.length > 0) setForm((prev) => ({ ...prev, benefits: data.benefits }));
      if (aiForm.title && !form.title) setForm((prev) => ({ ...prev, title: aiForm.title }));
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
      case 1: return form.title.trim() && form.description.trim();
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const openAiDialog = () => {
    setAiForm((prev) => ({ ...prev, title: form.title }));
    setAiError(null);
    setAiDialogOpen(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <JobDetailsStep form={form} updateField={updateField} aiError={aiError} onOpenAiDialog={openAiDialog} t={t} />;
      case 2:
        return <RequirementsStep form={form} updateField={updateField} addListItem={addListItem} removeListItem={removeListItem} updateListItem={updateListItem} t={t} />;
      case 3:
        return <CompensationStep form={form} updateField={updateField} t={t} />;
      case 4:
        return (
          <ScreeningStep
            screeningQuestions={screeningQuestions}
            screeningAiLoading={screeningAiLoading}
            jobTitle={form.title}
            onAddQuestion={addScreeningQuestion}
            onRemoveQuestion={removeScreeningQuestion}
            onUpdateQuestion={updateScreeningQuestion}
            onMoveQuestion={moveScreeningQuestion}
            onAddOption={addScreeningOption}
            onRemoveOption={removeScreeningOption}
            onUpdateOption={updateScreeningOption}
            onSuggestQuestions={handleSuggestScreeningQuestions}
            t={t}
          />
        );
      case 5:
        return <PreviewStep form={form} screeningQuestions={screeningQuestions} t={t} />;
      default:
        return null;
    }
  };

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
      <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
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
          {currentStep === TOTAL_STEPS && (
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

          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
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

      {/* AI Generate Dialog */}
      <AiGenerateDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        aiForm={aiForm}
        onAiFormChange={setAiForm}
        onGenerate={handleAiGenerate}
        aiGenerating={aiGenerating}
        aiError={aiError}
        t={t}
      />
    </div>
  );
}
