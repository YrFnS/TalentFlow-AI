// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { cn } from '@/lib/utils';
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
import { useCsrf } from '@/hooks/use-csrf';

const steps = [
  { id: 1, title: 'Details', icon: Briefcase },
  { id: 2, title: 'Requirements', icon: FileText },
  { id: 3, title: 'Compensation', icon: DollarSign },
  { id: 4, title: 'Preview', icon: Eye },
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

export default function CreateJobPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState('');

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

  const [skillInput, setSkillInput] = useState('');
  const { csrfToken } = useCsrf();

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

  const handleAiGenerate = async () => {
    if (!form.title) return;
    setAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          userId: user?.id || 'seed-user',
          jobTitle: form.title,
          jobType: form.jobType,
          location: form.location || undefined,
          isRemote: form.isRemote || undefined,
          companyName: undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || 'Failed to generate job description');
        return;
      }

      const jd = data.jobDescription;
      if (jd) {
        setForm((prev) => ({
          ...prev,
          description: jd.description || prev.description,
          requirements: Array.isArray(jd.requirements) && jd.requirements.length > 0
            ? jd.requirements : prev.requirements,
          responsibilities: Array.isArray(jd.responsibilities) && jd.responsibilities.length > 0
            ? jd.responsibilities : prev.responsibilities,
          benefits: Array.isArray(jd.benefits) && jd.benefits.length > 0
            ? jd.benefits : prev.benefits,
          skills: Array.isArray(jd.skills) && jd.skills.length > 0
            ? jd.skills : prev.skills,
          experienceMin: jd.experienceMin != null ? String(jd.experienceMin) : prev.experienceMin,
          experienceMax: jd.experienceMax != null ? String(jd.experienceMax) : prev.experienceMax,
        }));
      }
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
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
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
      default:
        return false;
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
                  isActive && 'bg-teal-600/10 text-teal-700 dark:text-teal-400',
                  isComplete && 'text-teal-600 dark:text-teal-400 cursor-pointer',
                  !isActive && !isComplete && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    isActive && 'bg-teal-600 text-white',
                    isComplete && 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn('flex-1 h-px mx-1', isComplete ? 'bg-teal-300 dark:bg-teal-700' : 'bg-border')} />
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
                    onClick={handleAiGenerate}
                    disabled={!form.title || aiGenerating}
                    className="border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                  >
                    {aiGenerating ? (
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 me-2" />
                    )}
                    AI Generate
                  </Button>
                  {aiError && (
                    <div className="flex items-start gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 max-w-xs">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-700 dark:text-red-300">{aiError}</p>
                        {aiError.includes('No active AI provider') && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-600 dark:text-red-400" asChild>
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
                      <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs flex items-center justify-center flex-shrink-0">
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
                      <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs flex items-center justify-center flex-shrink-0">
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
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center flex-shrink-0">
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
                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/30">
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
                    Salary Range: ${parseInt(form.salaryMin).toLocaleString()} - ${parseInt(form.salaryMax).toLocaleString()} {form.salaryCurrency}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-muted-foreground">Review your job posting before publishing</p>
              </div>

              <div className="border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">{form.title || 'Job Title'}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
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
                    <p className="text-sm text-teal-600 dark:text-teal-400">
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

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>Openings: {form.openings}</span>
                  {form.deadline && <span>Deadline: {form.deadline}</span>}
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
          {currentStep === 4 && (
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
              className="border-teal-300 dark:border-teal-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
              Save as Draft
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {t.common.next}
              <ArrowRight className="w-4 h-4 ms-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit('OPEN')}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Check className="w-4 h-4 me-2" />}
              Publish Job
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
