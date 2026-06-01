// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  ClipboardCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  AlertCircle,
  Search,
  Filter,
  Eye,
  FileText,
  GraduationCap,
  Monitor,
  Users,
  Settings,
  Trash2,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────
type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';
type OnboardingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

interface PlanTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
}

interface OnboardingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  tasks: PlanTask[];
  isActive: boolean;
}

interface AssignmentTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
  isCompleted: boolean;
  status: string;
}

interface OnboardingAssignment {
  id: string;
  employeeName: string;
  employeeEmail: string;
  planName: string;
  planId: string;
  progress: number;
  startDate: string;
  dueDate: string;
  status: OnboardingStatus;
  tasks: AssignmentTask[];
}

// ── Category config ────────────────────────────────────────────────
const categoryBadgeColors: Record<TaskCategory, string> = {
  Document: 'bg-blue-50 text-blue-700 dark:bg-blue-950 border-0',
  Training: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Setup: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Introduction: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  General: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
};

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  Document: FileText,
  Training: GraduationCap,
  Setup: Monitor,
  Introduction: Users,
  General: Settings,
};

const statusBadgeColors: Record<OnboardingStatus, string> = {
  Pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
  'In Progress': 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Overdue: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

// ── Mock data ──────────────────────────────────────────────────────
const defaultPlans: OnboardingPlan[] = [
  {
    id: 'plan-1',
    name: 'Standard Onboarding',
    description: 'Comprehensive onboarding for all new hires covering essential setup, documentation, and introductions',
    duration: 14,
    isActive: true,
    tasks: [
      { id: 'pt-1', title: 'Complete employment contract', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-2', title: 'Submit tax forms', category: 'Document', dueDay: 2, isRequired: true },
      { id: 'pt-3', title: 'IT account setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-4', title: 'Email and communication tools', category: 'Setup', dueDay: 2, isRequired: true },
      { id: 'pt-5', title: 'Company orientation', category: 'Training', dueDay: 3, isRequired: true },
      { id: 'pt-6', title: 'Security awareness training', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-7', title: 'Team introduction meeting', category: 'Introduction', dueDay: 2, isRequired: false },
      { id: 'pt-8', title: 'Buddy assignment meet & greet', category: 'Introduction', dueDay: 3, isRequired: false },
    ],
  },
  {
    id: 'plan-2',
    name: 'Executive Onboarding',
    description: 'Extended onboarding program for senior hires with strategic alignment and leadership integration',
    duration: 30,
    isActive: true,
    tasks: [
      { id: 'pt-9', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-10', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-11', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true },
      { id: 'pt-12', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-13', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true },
      { id: 'pt-14', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-15', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true },
      { id: 'pt-16', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true },
      { id: 'pt-17', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false },
      { id: 'pt-18', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true },
      { id: 'pt-19', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true },
      { id: 'pt-20', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true },
    ],
  },
  {
    id: 'plan-3',
    name: 'Engineering Onboarding',
    description: 'Technical onboarding for engineering hires with codebase walkthrough and dev environment setup',
    duration: 21,
    isActive: true,
    tasks: [
      { id: 'pt-21', title: 'Employment contract signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-22', title: 'NDA signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-23', title: 'Dev environment setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-24', title: 'GitHub access and onboarding repo', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-25', title: 'Codebase walkthrough', category: 'Training', dueDay: 3, isRequired: true },
      { id: 'pt-26', title: 'CI/CD pipeline overview', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-27', title: 'Security best practices', category: 'Training', dueDay: 7, isRequired: true },
      { id: 'pt-28', title: 'Team standup introduction', category: 'Introduction', dueDay: 2, isRequired: false },
      { id: 'pt-29', title: 'First PR review', category: 'Training', dueDay: 10, isRequired: true },
      { id: 'pt-30', title: 'Architecture deep-dive', category: 'Training', dueDay: 14, isRequired: false },
    ],
  },
];

const defaultAssignments: OnboardingAssignment[] = [
  {
    id: 'oa-1', employeeName: 'Sarah Chen', employeeEmail: 'sarah.chen@company.com', planName: 'Standard Onboarding', planId: 'plan-1', progress: 75, startDate: '2025-01-15', dueDate: '2025-01-29', status: 'In Progress',
    tasks: [
      { id: 'at-1', title: 'Complete employment contract', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-2', title: 'Submit tax forms', category: 'Document', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-3', title: 'IT account setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-4', title: 'Email and communication tools', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-5', title: 'Company orientation', category: 'Training', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-6', title: 'Security awareness training', category: 'Training', dueDay: 5, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-7', title: 'Team introduction meeting', category: 'Introduction', dueDay: 2, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-8', title: 'Buddy assignment meet & greet', category: 'Introduction', dueDay: 3, isRequired: false, isCompleted: false, status: 'PENDING' },
    ],
  },
  {
    id: 'oa-2', employeeName: 'Marcus Brown', employeeEmail: 'marcus.brown@company.com', planName: 'Executive Onboarding', planId: 'plan-2', progress: 33, startDate: '2025-02-01', dueDate: '2025-03-03', status: 'In Progress',
    tasks: [
      { id: 'at-9', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-10', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-11', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-12', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-13', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-14', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-15', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-16', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-17', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-18', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-19', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-20', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true, isCompleted: false, status: 'PENDING' },
    ],
  },
  {
    id: 'oa-3', employeeName: 'Priya Sharma', employeeEmail: 'priya.sharma@company.com', planName: 'Standard Onboarding', planId: 'plan-1', progress: 100, startDate: '2025-01-01', dueDate: '2025-01-15', status: 'Completed',
    tasks: defaultPlans[0].tasks.map(t => ({ ...t, id: `at-3-${t.id}`, isCompleted: true, status: 'COMPLETED' })),
  },
  {
    id: 'oa-4', employeeName: 'Tom Anderson', employeeEmail: 'tom.anderson@company.com', planName: 'Engineering Onboarding', planId: 'plan-3', progress: 10, startDate: '2025-03-10', dueDate: '2025-03-31', status: 'Pending',
    tasks: [
      { id: 'at-29', title: 'Employment contract signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-30', title: 'NDA signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: false, status: 'PENDING' },
      ...defaultPlans[2].tasks.slice(2).map((t, i) => ({ ...t, id: `at-4-${i}`, isCompleted: false, status: 'PENDING' })),
    ],
  },
  {
    id: 'oa-5', employeeName: 'Aisha Mohamed', employeeEmail: 'aisha.mohamed@company.com', planName: 'Executive Onboarding', planId: 'plan-2', progress: 50, startDate: '2025-01-20', dueDate: '2025-02-19', status: 'Overdue',
    tasks: [
      { id: 'at-37', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-38', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-39', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-40', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-41', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-42', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-43', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-44', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-45', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-46', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-47', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-48', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true, isCompleted: false, status: 'PENDING' },
    ],
  },
];

const categories: TaskCategory[] = ['Document', 'Training', 'Setup', 'Introduction', 'General'];

const getCategoryKey = (cat: TaskCategory): string => {
  const map: Record<TaskCategory, string> = {
    Document: 'categoryDocument',
    Training: 'categoryTraining',
    Setup: 'categorySetup',
    Introduction: 'categoryIntroduction',
    General: 'categoryGeneral',
  };
  return map[cat];
};

// Mock new hires for trigger dialog
const mockNewHires = [
  { id: 'nh-1', name: 'Emily Zhang', email: 'emily.zhang@company.com' },
  { id: 'nh-2', name: 'Ryan Cooper', email: 'ryan.cooper@company.com' },
  { id: 'nh-3', name: 'Fatima Al-Rashid', email: 'fatima.alrashid@company.com' },
];

// ── Main Component ─────────────────────────────────────────────────
export default function OnboardingContent() {
  const { t } = useI18n();
  const ot = t.onboarding as Record<string, string>;

  const [plans, setPlans] = useState<OnboardingPlan[]>(defaultPlans);
  const [assignments, setAssignments] = useState<OnboardingAssignment[]>(defaultAssignments);
  const [filterStatus, setFilterStatus] = useState<OnboardingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<OnboardingAssignment | null>(null);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  // Create plan form state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('14');
  const [newPlanTasks, setNewPlanTasks] = useState<Omit<PlanTask, 'id'>[]>([]);

  // Trigger form state
  const [triggerNewHire, setTriggerNewHire] = useState('');
  const [triggerPlanId, setTriggerPlanId] = useState('');
  const [triggerStartDate, setTriggerStartDate] = useState('');

  // ── Computed ────────────────────────────────────────────────────
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery && !a.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [assignments, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const active = assignments.filter(a => a.status === 'In Progress' || a.status === 'Pending').length;
    const completedCount = assignments.filter(a => a.status === 'Completed').length;
    const completionRate = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;
    const withProgress = assignments.filter(a => a.status === 'Completed' || a.status === 'In Progress');
    const avgDays = withProgress.length > 0 ? Math.round(withProgress.reduce((s, a) => s + a.progress / 100 * 14, 0) / withProgress.length) : 0;
    const overdueTasks = assignments.reduce((sum, a) => sum + a.tasks.filter(t => t.status === 'OVERDUE').length, 0);
    return { active, completedCount, completionRate, avgDays, overdueTasks };
  }, [assignments]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleOpenDetail = (assignment: OnboardingAssignment) => {
    setSelectedAssignment(assignment);
    setDetailOpen(true);
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedAssignment) return;
    const updated = { ...selectedAssignment };
    updated.tasks = updated.tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted, status: task.isCompleted ? 'PENDING' : 'COMPLETED' } : task
    );
    const completedCount = updated.tasks.filter(t => t.isCompleted).length;
    updated.progress = Math.round((completedCount / updated.tasks.length) * 100);
    updated.status = updated.progress === 100 ? 'Completed' : updated.status === 'Completed' ? 'In Progress' : updated.status;
    setSelectedAssignment(updated);
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleSkipTask = (taskId: string) => {
    if (!selectedAssignment) return;
    const updated = { ...selectedAssignment };
    updated.tasks = updated.tasks.map(task =>
      task.id === taskId ? { ...task, status: 'SKIPPED', isCompleted: false } : task
    );
    const completedOrSkipped = updated.tasks.filter(t => t.isCompleted || t.status === 'SKIPPED').length;
    updated.progress = Math.round((completedOrSkipped / updated.tasks.length) * 100);
    updated.status = updated.progress === 100 ? 'Completed' : updated.status;
    setSelectedAssignment(updated);
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    toast.success(ot.skip);
  };

  const handleMarkComplete = (assignmentId: string) => {
    setAssignments(prev => prev.map(a =>
      a.id === assignmentId ? { ...a, status: 'Completed' as OnboardingStatus, progress: 100, tasks: a.tasks.map(t => ({ ...t, isCompleted: true, status: 'COMPLETED' })) } : a
    ));
    toast.success(ot.markedComplete);
    setDetailOpen(false);
  };

  const handleMarkAllComplete = () => {
    if (!selectedAssignment) return;
    const updated = {
      ...selectedAssignment,
      progress: 100,
      status: 'Completed' as OnboardingStatus,
      tasks: selectedAssignment.tasks.map(t => ({ ...t, isCompleted: true, status: 'COMPLETED' })),
    };
    setSelectedAssignment(updated);
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    toast.success(ot.allMarkedComplete);
  };

  const handleSendReminder = () => {
    toast.success(ot.reminderSent);
  };

  const handleAddPlanTask = () => {
    setNewPlanTasks(prev => [...prev, { title: '', category: 'General' as TaskCategory, dueDay: 1, isRequired: true }]);
  };

  const handleRemovePlanTask = (index: number) => {
    setNewPlanTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlanTask = (index: number, field: string, value: string | boolean) => {
    setNewPlanTasks(prev => prev.map((task, i) => i === index ? { ...task, [field]: value } : task));
  };

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) return;
    const plan: OnboardingPlan = {
      id: `plan-${Date.now()}`,
      name: newPlanName,
      description: newPlanDesc,
      duration: parseInt(newPlanDuration) || 14,
      isActive: true,
      tasks: newPlanTasks.filter(t => t.title.trim()).map((t, i) => ({ ...t, id: `pt-new-${i}-${Date.now()}` })),
    };
    setPlans(prev => [...prev, plan]);
    setNewPlanName('');
    setNewPlanDesc('');
    setNewPlanDuration('14');
    setNewPlanTasks([]);
    setCreatePlanOpen(false);
    toast.success(ot.planCreated);
  };

  const handleTogglePlanActive = (planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, isActive: !p.isActive } : p));
  };

  const handleTriggerOnboarding = () => {
    if (!triggerNewHire || !triggerPlanId) {
      toast.error(ot.selectNewHire);
      return;
    }
    const hire = mockNewHires.find(h => h.id === triggerNewHire);
    const plan = plans.find(p => p.id === triggerPlanId);
    if (!hire || !plan) return;

    const startDate = triggerStartDate || new Date().toISOString().split('T')[0];
    const dueDate = new Date(new Date(startDate).getTime() + plan.duration * 86400000).toISOString().split('T')[0];

    const newAssignment: OnboardingAssignment = {
      id: `oa-${Date.now()}`,
      employeeName: hire.name,
      employeeEmail: hire.email,
      planName: plan.name,
      planId: plan.id,
      progress: 0,
      startDate,
      dueDate,
      status: 'Pending',
      tasks: plan.tasks.map((t, i) => ({
        id: `at-trigger-${i}-${Date.now()}`,
        title: t.title,
        category: t.category,
        dueDay: t.dueDay,
        isRequired: t.isRequired,
        isCompleted: false,
        status: 'PENDING',
      })),
    };
    setAssignments(prev => [newAssignment, ...prev]);
    toast.success(ot.triggerSuccess);
    setTriggerOpen(false);
    setTriggerNewHire('');
    setTriggerPlanId('');
    setTriggerStartDate('');
  };

  const allFilterStatuses: (OnboardingStatus | 'all')[] = ['all', 'Pending', 'In Progress', 'Completed', 'Overdue'];

  const getStatusLabel = (status: OnboardingStatus): string => {
    const key = status === 'In Progress' ? 'inProgress' : status.toLowerCase();
    return ot[key] || status;
  };

  const getDaysRemaining = (assignment: OnboardingAssignment): number => {
    const due = new Date(assignment.dueDate);
    const now = new Date();
    return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{ot.title}</h1>
            <p className="text-sm text-muted-foreground">{ot.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
            onClick={() => setTriggerOpen(true)}
          >
            <PlayCircle className="h-4 w-4 me-2" />
            {ot.triggerOnboarding}
          </Button>
          <Button
            className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={() => setCreatePlanOpen(true)}
          >
            <Plus className="h-4 w-4 me-2" />
            {ot.createPlan}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.activeAssignments}</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.completionRate}</p>
                <p className="text-xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.avgDays}</p>
                <p className="text-xl font-bold">{stats.avgDays}d</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.overdueTasks}</p>
                <p className="text-xl font-bold">{stats.overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Plans Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          {ot.plans}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-border/50 card-">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                  <Badge className={cn(
                    'text-[10px] border-0',
                    plan.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  )}>
                    {plan.isActive ? ot.planActive : ot.planInactive}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{plan.tasks.length} {ot.taskCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{plan.duration} {plan.duration === 1 ? ot.day : ot.days}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {categories.filter(cat => plan.tasks.some(t => t.category === cat)).map(cat => {
                    const CatIcon = categoryIcons[cat];
                    return (
                      <Badge key={cat} className={cn('text-[9px] gap-0.5 border-0', categoryBadgeColors[cat])}>
                        <CatIcon className="h-2.5 w-2.5" />
                        {ot[getCategoryKey(cat)]}
                      </Badge>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                  onClick={() => handleTogglePlanActive(plan.id)}
                >
                  {plan.isActive ? ot.planInactive : ot.planActive}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card
            className="border-dashed border-2 border-slate-300 card-cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setCreatePlanOpen(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-blue-600 mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-blue-700">{ot.createPlan}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Assignments Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {ot.activeAssignments}
        </h2>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as OnboardingStatus | 'all')}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder={ot.filterByStatus} />
            </SelectTrigger>
            <SelectContent>
              {allFilterStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? ot.allStatuses : getStatusLabel(s as OnboardingStatus)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={ot.searchByName}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const isExpanded = expandedAssignment === assignment.id;
            const daysRemaining = getDaysRemaining(assignment);
            const completedTasks = assignment.tasks.filter(t => t.isCompleted).length;
            const totalTasks = assignment.tasks.length;
            const overdueTasks = assignment.tasks.filter(t => t.status === 'OVERDUE').length;

            return (
              <Card key={assignment.id} className={cn(
                'border-border/50 card-',
                assignment.status === 'Overdue' && 'border-red-200 dark:border-red-800'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {getInitials(assignment.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{assignment.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{assignment.planName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
                        <Progress value={assignment.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-8 text-end">{assignment.progress}%</span>
                      </div>
                      <Badge className={cn('text-[10px]', statusBadgeColors[assignment.status])}>
                        {getStatusLabel(assignment.status)}
                      </Badge>
                      {overdueTasks > 0 && (
                        <Badge className="bg-red-50 text-red-700 dark:bg-red-950 border-0 text-[10px]">
                          <AlertCircle className="h-3 w-3 me-1" />
                          {overdueTasks} {ot.overdue}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{daysRemaining} {ot.daysRemaining}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Mobile progress */}
                  <div className="sm:hidden mt-2 flex items-center gap-2">
                    <Progress value={assignment.progress} className="h-2 flex-1" />
                    <span className="text-xs font-medium">{assignment.progress}%</span>
                    <span className="text-[10px] text-muted-foreground">{completedTasks}/{totalTasks}</span>
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div className="mt-4 space-y-2 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{completedTasks}/{totalTasks} {ot.taskCount}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={handleSendReminder}>
                            <Send className="h-3 w-3 me-1" /> {ot.sendReminder}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleOpenDetail(assignment)}>
                            <Eye className="h-3 w-3 me-1" /> {ot.viewDetails}
                          </Button>
                        </div>
                      </div>
                      {assignment.tasks.map((task) => {
                        const CatIcon = categoryIcons[task.category];
                        const isOverdue = task.status === 'OVERDUE';
                        return (
                          <div key={task.id} className={cn(
                            'flex items-center gap-2 p-2 rounded-md text-sm',
                            isOverdue && 'bg-red-50 dark:bg-red-950/20',
                            task.isCompleted && 'opacity-60'
                          )}>
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => {
                                const updated = { ...assignment };
                                updated.tasks = updated.tasks.map(t =>
                                  t.id === task.id ? { ...t, isCompleted: !t.isCompleted, status: t.isCompleted ? 'PENDING' : 'COMPLETED' } : t
                                );
                                const comp = updated.tasks.filter(t => t.isCompleted).length;
                                updated.progress = Math.round((comp / updated.tasks.length) * 100);
                                updated.status = updated.progress === 100 ? 'Completed' : updated.status;
                                setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
                                setExpandedAssignment(updated.id);
                              }}
                              className="accent-teal-600"
                            />
                            <CatIcon className={cn('h-3.5 w-3.5', isOverdue ? 'text-red-500' : 'text-muted-foreground')} />
                            <span className={cn('flex-1 text-xs', task.isCompleted && 'line-through')}>{task.title}</span>
                            <Badge className={cn('text-[8px] border-0', categoryBadgeColors[task.category])}>
                              {ot[getCategoryKey(task.category)]}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{ot.dueDay} {task.dueDay}</span>
                            {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredAssignments.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{ot.noOnboardings}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Onboarding Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              {ot.newHireDetail}
            </DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-6 py-2">
              {/* Employee Info Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    {ot.employee}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(selectedAssignment.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-semibold">{selectedAssignment.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{selectedAssignment.employeeEmail}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{ot.plans}: {selectedAssignment.planName}</span>
                        <Badge className={cn('text-[10px]', statusBadgeColors[selectedAssignment.status])}>
                          {getStatusLabel(selectedAssignment.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ot.progress}</span>
                  <span className="text-sm font-bold text-blue-600">{selectedAssignment.progress}%</span>
                </div>
                <Progress value={selectedAssignment.progress} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ot.startDate}: {selectedAssignment.startDate}</span>
                  <span>{ot.dueDate}: {selectedAssignment.dueDate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{getDaysRemaining(selectedAssignment)} {ot.daysRemaining}</span>
                </div>
              </div>

              {/* Task Checklist by Category */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  {ot.tasks}
                </h3>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-4 pe-2">
                    {categories.filter(cat => selectedAssignment.tasks.some(t => t.category === cat)).map(cat => {
                      const catTasks = selectedAssignment.tasks.filter(t => t.category === cat);
                      const CatIcon = categoryIcons[cat];
                      const catCompleted = catTasks.filter(t => t.isCompleted).length;
                      return (
                        <div key={cat}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-md text-white text-[10px]',
                              cat === 'Document' ? 'bg-blue-500' :
                              cat === 'Training' ? 'bg-purple-500' :
                              cat === 'Setup' ? 'bg-slate-500' :
                              cat === 'Introduction' ? 'bg-amber-500' :
                              'bg-gray-500'
                            )}>
                              <CatIcon className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-semibold">{ot[getCategoryKey(cat)]}</span>
                            <span className="text-[10px] text-muted-foreground">{catCompleted}/{catTasks.length}</span>
                          </div>
                          <div className="space-y-1 ms-2">
                            {catTasks.map((task) => {
                              const isOverdue = task.status === 'OVERDUE';
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded-md text-sm transition-colors',
                                    isOverdue && 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800',
                                    task.isCompleted && 'opacity-60'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.isCompleted}
                                    onChange={() => handleToggleTask(task.id)}
                                    className="accent-teal-600"
                                  />
                                  <span className={cn('flex-1 text-xs', task.isCompleted && 'line-through')}>{task.title}</span>
                                  {task.isRequired && (
                                    <Badge className="text-[8px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">{ot.required}</Badge>
                                  )}
                                  {!task.isRequired && (
                                    <Badge className="text-[8px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0">{ot.optional}</Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{ot.dueDay} {task.dueDay}</span>
                                  {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                  {!task.isCompleted && !isOverdue && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                      onClick={() => handleSkipTask(task.id)}
                                    >
                                      <SkipForward className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" className="text-xs" onClick={handleSendReminder}>
                  <Send className="h-3 w-3 me-1" />
                  {ot.sendReminder}
                </Button>
                {selectedAssignment.status !== 'Completed' && (
                  <Button
                    size="sm"
                    className="text-xs bg-gradient-to-r bg-blue-600 text-white"
                    onClick={handleMarkAllComplete}
                  >
                    <CheckCircle2 className="h-3 w-3 me-1" />
                    {ot.markComplete}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {ot.createPlan}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{ot.planName}</label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="mt-1"
                placeholder={ot.planNamePlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{ot.planDescription}</label>
              <Textarea
                value={newPlanDesc}
                onChange={(e) => setNewPlanDesc(e.target.value)}
                className="mt-1"
                rows={2}
                placeholder={ot.planDescriptionPlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{ot.duration}</label>
              <Input
                type="number"
                min={1}
                value={newPlanDuration}
                onChange={(e) => setNewPlanDuration(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{ot.tasks}</label>
                <Button variant="outline" size="sm" className="text-xs" onClick={handleAddPlanTask}>
                  <Plus className="h-3 w-3 me-1" />
                  {ot.addTask}
                </Button>
              </div>
              {newPlanTasks.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">{ot.addTaskHint}</p>
              )}
              <div className="space-y-3">
                {newPlanTasks.map((task, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="text-[10px] text-muted-foreground">{ot.taskTitle}</label>
                          <Input
                            value={task.title}
                            onChange={(e) => handleUpdatePlanTask(index, 'title', e.target.value)}
                            className="h-7 text-xs mt-0.5"
                            placeholder={ot.taskTitle}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">{ot.taskCategory}</label>
                          <Select
                            value={task.category}
                            onValueChange={(v) => handleUpdatePlanTask(index, 'category', v)}
                          >
                            <SelectTrigger className="h-7 text-xs mt-0.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c} value={c}>{ot[getCategoryKey(c)]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">{ot.dueDay}</label>
                          <Input
                            type="number"
                            min={1}
                            value={task.dueDay}
                            onChange={(e) => handleUpdatePlanTask(index, 'dueDay', e.target.value)}
                            className="h-7 text-xs mt-0.5"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={task.isRequired}
                              onChange={(e) => handleUpdatePlanTask(index, 'isRequired', e.target.checked)}
                              className="accent-teal-600"
                            />
                            {ot.required}
                          </label>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleRemovePlanTask(index)}>
                            <Trash2 className="h-3 w-3 me-1" />
                            {ot.removeTask}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-gradient-to-r bg-blue-600 text-white"
              onClick={handleCreatePlan}
            >
              {ot.createPlan}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trigger Onboarding Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-600" />
              {ot.triggerOnboarding}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">{ot.selectNewHire}</label>
              <Select value={triggerNewHire} onValueChange={setTriggerNewHire}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={ot.selectEmployee} />
                </SelectTrigger>
                <SelectContent>
                  {mockNewHires.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name} ({h.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{ot.selectPlan}</label>
              <Select value={triggerPlanId} onValueChange={setTriggerPlanId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={ot.selectPlan} />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.tasks.length} {ot.taskCount}, {p.duration} {ot.days})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{ot.startDate}</label>
              <Input
                type="date"
                value={triggerStartDate}
                onChange={(e) => setTriggerStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-gradient-to-r bg-blue-600 text-white"
              onClick={handleTriggerOnboarding}
            >
              <PlayCircle className="h-3.5 w-3.5 me-1" />
              {ot.triggerOnboarding}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
