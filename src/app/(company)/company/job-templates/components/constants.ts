// @ts-nocheck
import { useI18n } from '@/store/i18n-store';

export interface JobTemplate {
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

export interface TemplateFormData {
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

export const emptyForm: TemplateFormData = {
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

export const departmentColors: Record<string, string> = {
  engineering: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  design: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  marketing: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  sales: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0',
  hr: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
};

export const jobTypeColors: Record<string, string> = {
  'full-time': 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  'part-time': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  contract: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  internship: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-0',
};

export function getDepartmentLabel(dept: string, t: ReturnType<typeof useI18n>['t']) {
  const map: Record<string, string> = {
    engineering: t.jobTemplates.engineering,
    design: t.jobTemplates.design,
    marketing: t.jobTemplates.marketing,
    sales: t.jobTemplates.sales,
    hr: t.jobTemplates.humanResources,
  };
  return map[dept] || dept;
}

export function getJobTypeLabel(type: string) {
  const map: Record<string, string> = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
  };
  return map[type] || type;
}

export function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatSalary(min: number, max: number) {
  if (!min && !max) return '';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
}
