// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, PlayCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  type TaskCategory,
  type OnboardingPlan,
  type OnboardingAssignment,
  type OnboardingStatus,
  defaultPlans,
  defaultAssignments,
  mockNewHires,
} from './mock-data';
import OnboardingStatsCards from './components/OnboardingStatsCards';
import OnboardingPlansSection from './components/OnboardingPlansSection';
import OnboardingFiltersBar from './components/OnboardingFiltersBar';
import AssignmentsList from './components/AssignmentsList';
import OnboardingDetailDialog from './components/OnboardingDetailDialog';
import OnboardingCreatePlanDialog from './components/OnboardingCreatePlanDialog';
import OnboardingTriggerDialog from './components/OnboardingTriggerDialog';

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
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('14');
  const [newPlanTasks, setNewPlanTasks] = useState<Omit<import('./mock-data').PlanTask, 'id'>[]>([]);
  const [triggerNewHire, setTriggerNewHire] = useState('');
  const [triggerPlanId, setTriggerPlanId] = useState('');
  const [triggerStartDate, setTriggerStartDate] = useState('');

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

  const updateAssignment = (updated: OnboardingAssignment) => {
    setSelectedAssignment(updated);
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
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
    updateAssignment(updated);
  };

  const handleSkipTask = (taskId: string) => {
    if (!selectedAssignment) return;
    const updated = { ...selectedAssignment };
    updated.tasks = updated.tasks.map(task =>
      task.id === taskId ? { ...task, status: 'SKIPPED', isCompleted: false } : task
    );
    const done = updated.tasks.filter(t => t.isCompleted || t.status === 'SKIPPED').length;
    updated.progress = Math.round((done / updated.tasks.length) * 100);
    updated.status = updated.progress === 100 ? 'Completed' : updated.status;
    updateAssignment(updated);
    toast.success(ot.skip);
  };

  const handleMarkAllComplete = () => {
    if (!selectedAssignment) return;
    updateAssignment({
      ...selectedAssignment,
      progress: 100,
      status: 'Completed' as OnboardingStatus,
      tasks: selectedAssignment.tasks.map(t => ({ ...t, isCompleted: true, status: 'COMPLETED' })),
    });
    toast.success(ot.allMarkedComplete);
  };

  const handleSendReminder = () => { toast.success(ot.reminderSent); };

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) return;
    const plan: OnboardingPlan = {
      id: `plan-${Date.now()}`, name: newPlanName, description: newPlanDesc,
      duration: parseInt(newPlanDuration) || 14, isActive: true,
      tasks: newPlanTasks.filter(t => t.title.trim()).map((t, i) => ({ ...t, id: `pt-new-${i}-${Date.now()}` })),
    };
    setPlans(prev => [...prev, plan]);
    setNewPlanName(''); setNewPlanDesc(''); setNewPlanDuration('14'); setNewPlanTasks([]);
    setCreatePlanOpen(false);
    toast.success(ot.planCreated);
  };

  const handleTriggerOnboarding = () => {
    if (!triggerNewHire || !triggerPlanId) { toast.error(ot.selectNewHire); return; }
    const hire = mockNewHires.find(h => h.id === triggerNewHire);
    const plan = plans.find(p => p.id === triggerPlanId);
    if (!hire || !plan) return;
    const startDate = triggerStartDate || new Date().toISOString().split('T')[0];
    const dueDate = new Date(new Date(startDate).getTime() + plan.duration * 86400000).toISOString().split('T')[0];
    setAssignments(prev => [{
      id: `oa-${Date.now()}`, employeeName: hire.name, employeeEmail: hire.email,
      planName: plan.name, planId: plan.id, progress: 0, startDate, dueDate, status: 'Pending',
      tasks: plan.tasks.map((t, i) => ({ id: `at-trigger-${i}-${Date.now()}`, title: t.title, category: t.category, dueDay: t.dueDay, isRequired: t.isRequired, isCompleted: false, status: 'PENDING' })),
    }, ...prev]);
    toast.success(ot.triggerSuccess);
    setTriggerOpen(false); setTriggerNewHire(''); setTriggerPlanId(''); setTriggerStartDate('');
  };

  const handleToggleExpand = (id: string | null) => { setExpandedAssignment(id); };

  const handleOpenDetail = (assignment: OnboardingAssignment) => {
    setSelectedAssignment(assignment);
    setDetailOpen(true);
  };

  const handleToggleTaskInline = (assignment: OnboardingAssignment, taskId: string) => {
    const updated = { ...assignment };
    updated.tasks = updated.tasks.map(t =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted, status: t.isCompleted ? 'PENDING' : 'COMPLETED' } : t
    );
    const comp = updated.tasks.filter(t => t.isCompleted).length;
    updated.progress = Math.round((comp / updated.tasks.length) * 100);
    updated.status = updated.progress === 100 ? 'Completed' : updated.status;
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setExpandedAssignment(updated.id);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
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
          <Button variant="outline" size="sm" className="border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950" onClick={() => setTriggerOpen(true)}>
            <PlayCircle className="h-4 w-4 me-2" />{ot.triggerOnboarding}
          </Button>
          <Button className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700" onClick={() => setCreatePlanOpen(true)}>
            <Plus className="h-4 w-4 me-2" />{ot.createPlan}
          </Button>
        </div>
      </div>
      <OnboardingStatsCards stats={stats} />
      <OnboardingPlansSection plans={plans} onTogglePlanActive={(id) => setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))} onCreatePlanClick={() => setCreatePlanOpen(true)} />
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />{ot.activeAssignments}
        </h2>
        <OnboardingFiltersBar filterStatus={filterStatus} searchQuery={searchQuery} onFilterStatusChange={setFilterStatus} onSearchChange={setSearchQuery} />
        <AssignmentsList filteredAssignments={filteredAssignments} expandedAssignment={expandedAssignment} onToggleExpand={handleToggleExpand} onOpenDetail={handleOpenDetail} onSendReminder={handleSendReminder} onToggleTask={handleToggleTaskInline} />
      </div>
      <OnboardingDetailDialog open={detailOpen} onOpenChange={setDetailOpen} selectedAssignment={selectedAssignment} onToggleTask={handleToggleTask} onSkipTask={handleSkipTask} onMarkAllComplete={handleMarkAllComplete} onSendReminder={handleSendReminder} />
      <OnboardingCreatePlanDialog open={createPlanOpen} onOpenChange={setCreatePlanOpen} newPlanName={newPlanName} newPlanDesc={newPlanDesc} newPlanDuration={newPlanDuration} newPlanTasks={newPlanTasks} onNameChange={setNewPlanName} onDescChange={setNewPlanDesc} onDurationChange={setNewPlanDuration} onAddTask={() => setNewPlanTasks(prev => [...prev, { title: '', category: 'General' as TaskCategory, dueDay: 1, isRequired: true }])} onRemoveTask={(i) => setNewPlanTasks(prev => prev.filter((_, idx) => idx !== i))} onUpdateTask={(i, field, value) => setNewPlanTasks(prev => prev.map((task, idx) => idx === i ? { ...task, [field]: value } : task))} onCreatePlan={handleCreatePlan} />
      <OnboardingTriggerDialog open={triggerOpen} onOpenChange={setTriggerOpen} triggerNewHire={triggerNewHire} triggerPlanId={triggerPlanId} triggerStartDate={triggerStartDate} mockNewHires={mockNewHires} plans={plans} onNewHireChange={setTriggerNewHire} onPlanIdChange={setTriggerPlanId} onStartDateChange={setTriggerStartDate} onTrigger={handleTriggerOnboarding} />
    </div>
  );
}
