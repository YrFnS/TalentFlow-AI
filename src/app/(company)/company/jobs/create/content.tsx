'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type ListField = 'requirements' | 'responsibilities' | 'benefits';
type Form = {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  jobType: string;
  location: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  experienceMin: string;
  experienceMax: string;
  openings: string;
  deadline: string;
  skills: string[];
};

const initialForm: Form = {
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
  openings: '1',
  deadline: '',
  skills: [],
};

function ListEditor({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><Label>{title}</Label><Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ''])}><Plus className="me-1 h-3 w-3" />Add</Button></div>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2"><Input value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`${title.slice(0, -1)} ${index + 1}`} /><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} disabled={values.length === 1}><Trash2 className="h-4 w-4" /></Button></div>
      ))}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();
  const { user, validateSession } = useAuth();
  const [form, setForm] = useState<Form>(initialForm);
  const [skill, setSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    void validateSession();
  }, [validateSession]);

  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user?.role || '');
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));

  function addSkill() {
    const value = skill.trim();
    if (!value || form.skills.includes(value)) return;
    set('skills', [...form.skills, value]);
    setSkill('');
  }

  function validate() {
    if (!form.title.trim()) return 'Job title is required';
    if (!form.description.trim()) return 'Job description is required';
    if (form.salaryMin && form.salaryMax && Number(form.salaryMax) < Number(form.salaryMin)) return 'Maximum salary must be greater than minimum salary';
    if (form.experienceMin && form.experienceMax && Number(form.experienceMax) < Number(form.experienceMin)) return 'Maximum experience must be greater than minimum experience';
    if (Number(form.openings || 0) < 1) return 'At least one opening is required';
    return '';
  }

  async function generateWithAi() {
    if (!form.title.trim()) {
      setAiError('Add a job title before generating content');
      return;
    }
    setGenerating(true);
    setAiError('');
    try {
      const response = await apiFetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: form.title,
          jobType: form.jobType,
          location: form.location,
          companyName: user?.companyName,
        }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to generate job description'));
      const generated = (await response.json()).jobDescription || {};
      setForm((current) => ({
        ...current,
        description: generated.description || current.description,
        requirements: Array.isArray(generated.requirements) && generated.requirements.length ? generated.requirements : current.requirements,
        responsibilities: Array.isArray(generated.responsibilities) && generated.responsibilities.length ? generated.responsibilities : current.responsibilities,
        benefits: Array.isArray(generated.benefits) && generated.benefits.length ? generated.benefits : current.benefits,
        skills: Array.isArray(generated.skills) && generated.skills.length ? generated.skills : current.skills,
        experienceMin: generated.experienceMin != null ? String(generated.experienceMin) : current.experienceMin,
        experienceMax: generated.experienceMax != null ? String(generated.experienceMax) : current.experienceMax,
      }));
      toast.success('Job content generated');
    } catch (reason) {
      setAiError(reason instanceof Error ? reason.message : 'Unable to generate job description');
    } finally {
      setGenerating(false);
    }
  }

  async function submit(status: 'DRAFT' | 'OPEN') {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status,
          salaryMin: form.salaryMin || undefined,
          salaryMax: form.salaryMax || undefined,
          experienceMin: form.experienceMin || undefined,
          experienceMax: form.experienceMax || undefined,
          deadline: form.deadline || undefined,
          requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
          responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
          benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
        }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to create job'));
      toast.success(status === 'OPEN' ? 'Job published' : 'Draft saved');
      router.push('/company/jobs');
      router.refresh();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to create job');
    } finally {
      setSubmitting(false);
    }
  }

  if (user && !canCreate) {
    return <Card><CardContent className="py-16 text-center"><Briefcase className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">Read-only access</p><p className="mt-1 text-sm text-muted-foreground">Your role cannot create or publish jobs.</p><Button asChild className="mt-4" variant="outline"><Link href="/company/jobs">Back to jobs</Link></Button></CardContent></Card>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><Button asChild variant="ghost" size="icon"><Link href="/company/jobs"><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="text-2xl font-bold">Create job</h1><p className="mt-1 text-sm text-muted-foreground">Add accurate role details, then save a draft or publish it.</p></div></div>
        <Button variant="outline" onClick={() => void generateWithAi()} disabled={generating || !form.title.trim()}>{generating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}Generate with AI</Button>
      </div>

      {aiError && <Card className="border-destructive/40"><CardContent className="flex gap-2 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{aiError}</CardContent></Card>}

      <Card><CardHeader><CardTitle className="text-base">Role basics</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label htmlFor="title">Job title *</Label><Input id="title" value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Senior Frontend Engineer" /></div><div className="space-y-2"><Label>Employment type</Label><Select value={form.jobType} onValueChange={(value) => set('jobType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'HYBRID'].map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(event) => set('location', event.target.value)} placeholder="Baghdad or Remote" /></div><div className="flex items-center justify-between rounded-lg border p-4 md:col-span-2"><div><p className="text-sm font-medium">Remote-friendly role</p><p className="text-xs text-muted-foreground">Show candidates that remote work is available.</p></div><Switch checked={form.isRemote} onCheckedChange={(value) => set('isRemote', value)} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="description">Job description *</Label><Textarea id="description" rows={8} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Describe the role, team, and expected outcomes." /></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Responsibilities and requirements</CardTitle></CardHeader><CardContent className="grid gap-8 lg:grid-cols-2"><ListEditor title="Responsibilities" values={form.responsibilities} onChange={(values) => set('responsibilities', values)} /><ListEditor title="Requirements" values={form.requirements} onChange={(values) => set('requirements', values)} /><div className="lg:col-span-2"><ListEditor title="Benefits" values={form.benefits} onChange={(values) => set('benefits', values)} /></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Skills and compensation</CardTitle></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Skills</Label><div className="flex gap-2"><Input value={skill} onChange={(event) => setSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill(); } }} placeholder="TypeScript" /><Button type="button" variant="outline" onClick={addSkill}>Add</Button></div><div className="flex flex-wrap gap-2">{form.skills.map((item) => <Badge key={item} variant="secondary" className="cursor-pointer" onClick={() => set('skills', form.skills.filter((skillItem) => skillItem !== item))}>{item} ×</Badge>)}</div></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Currency</Label><Select value={form.salaryCurrency} onValueChange={(value) => set('salaryCurrency', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['USD', 'EUR', 'GBP', 'IQD', 'SAR', 'AED'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Minimum salary</Label><Input type="number" min="0" value={form.salaryMin} onChange={(event) => set('salaryMin', event.target.value)} /></div><div className="space-y-2"><Label>Maximum salary</Label><Input type="number" min="0" value={form.salaryMax} onChange={(event) => set('salaryMax', event.target.value)} /></div></div><div className="grid gap-4 sm:grid-cols-4"><div className="space-y-2"><Label>Minimum experience</Label><Input type="number" min="0" value={form.experienceMin} onChange={(event) => set('experienceMin', event.target.value)} /></div><div className="space-y-2"><Label>Maximum experience</Label><Input type="number" min="0" value={form.experienceMax} onChange={(event) => set('experienceMax', event.target.value)} /></div><div className="space-y-2"><Label>Openings</Label><Input type="number" min="1" value={form.openings} onChange={(event) => set('openings', event.target.value)} /></div><div className="space-y-2"><Label>Application deadline</Label><Input type="date" value={form.deadline} onChange={(event) => set('deadline', event.target.value)} /></div></div></CardContent></Card>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => void submit('DRAFT')} disabled={submitting}>{submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}Save draft</Button><Button onClick={() => void submit('OPEN')} disabled={submitting}>{submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Briefcase className="me-2 h-4 w-4" />}Publish job</Button></div>
    </div>
  );
}
