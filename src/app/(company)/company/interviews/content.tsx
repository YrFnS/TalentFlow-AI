// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Search, X, Plus, Sparkles, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import type { Interview, AvailabilityConfig, SchedulingSlot, ScreeningQuestion } from './components/types';
import InterviewsTab from './components/InterviewsTab';
import SelfSchedulingTab from './components/SelfSchedulingTab';
import InterviewDetailsSheet from './components/InterviewDetailsSheet';
import ScheduleInterviewDialog from './components/ScheduleInterviewDialog';
import CancelInterviewDialog from './components/CancelInterviewDialog';
import AiQuestionsDialog from './components/AiQuestionsDialog';
import { getInitials } from '@/lib/utils';

const interviewTypes = ['PHONE', 'VIDEO', 'ON_SITE', 'ASYNC_VIDEO'];
const interviewStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function InterviewsPage() {
  const { t } = useI18n();

  // State
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Interview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiQuestionsOpen, setAiQuestionsOpen] = useState(false);

  // Schedule form
  const [formType, setFormType] = useState('VIDEO');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formInterviewer, setFormInterviewer] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Self-scheduling state
  const [availability, setAvailability] = useState<AvailabilityConfig>({
    interviewerId: 'interviewer-1',
    interviewerName: 'Sarah Chen',
    slots: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '13:00' },
      { dayOfWeek: 3, startTime: '15:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '11:00' },
    ],
    slotDuration: 30,
    bufferBetween: 15,
    timezone: 'Asia/Riyadh',
  });
  const [schedulingSlots, setSchedulingSlots] = useState<SchedulingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [daysToGenerate, setDaysToGenerate] = useState('14');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Data fetching
  const fetchInterviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/interviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch('/api/interviews/availability?interviewerId=interviewer-1');
      if (res.ok) {
        const data = await res.json();
        if (data.slots && data.slots.length > 0) {
          setAvailability(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const now = new Date();
      const toDate = new Date(now);
      toDate.setDate(toDate.getDate() + 14);
      const res = await fetch(
        `/api/interviews/slots?interviewerId=interviewer-1&fromDate=${now.toISOString()}&toDate=${toDate.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setSchedulingSlots(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchAvailability();
    fetchSlots();
  }, [fetchInterviews, fetchAvailability, fetchSlots]);

  // Handlers
  const filteredInterviews = interviews.filter((interview) => {
    const query = searchQuery.toLowerCase();
    return !searchQuery ||
      interview.application.candidate.user.name.toLowerCase().includes(query) ||
      interview.application.job.title.toLowerCase().includes(query) ||
      interview.assignments.some((a) => a.interviewer.name.toLowerCase().includes(query));
  });

  const handleSchedule = async () => {
    if (!formDate || !formTime) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${formDate}T${formTime}`).toISOString();
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'app-demo',
          type: formType,
          scheduledAt,
          durationMinutes: parseInt(formDuration),
          notes: formNotes || undefined,
        }),
      });
      if (res.ok) {
        const newInterview = await res.json();
        setInterviews((prev) => [newInterview, ...prev]);
        setScheduleOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInterview = async () => {
    if (!cancelTarget) return;
    try {
      const res = await fetch(`/api/interviews?interviewId=${cancelTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setInterviews((prev) => prev.map((i) => i.id === cancelTarget.id ? { ...i, status: 'CANCELLED' } : i));
        setCancelDialogOpen(false);
        if (detailsOpen && selectedInterview?.id === cancelTarget.id) {
          setSelectedInterview({ ...cancelTarget, status: 'CANCELLED' });
        }
        setCancelTarget(null);
      }
    } catch (error) {
      console.error('Failed to cancel interview:', error);
    }
  };

  const resetForm = () => {
    setFormType('VIDEO');
    setFormDate('');
    setFormTime('');
    setFormDuration('30');
    setFormInterviewer('');
    setFormNotes('');
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const res = await fetch('/api/interviews/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availability),
      });
      if (res.ok) {
        toast.success(t.selfScheduling.availabilitySaved);
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleGenerateSlots = async () => {
    setGeneratingSlots(true);
    try {
      const res = await fetch(
        `/api/interviews/slots?interviewerId=interviewer-1&generate=true&days=${daysToGenerate}`
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(t.selfScheduling.slotsGenerated);
        fetchSlots();
      }
    } catch (error) {
      console.error('Failed to generate slots:', error);
    } finally {
      setGeneratingSlots(false);
    }
  };

  const handleCopySchedulingLink = (token: string) => {
    const link = `${window.location.origin}/schedule/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
    toast.success('Link copied to clipboard');
  };

  const addAvailabilitySlot = () => {
    setAvailability((prev) => ({
      ...prev,
      slots: [...prev.slots, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
    }));
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailability((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const updateAvailabilitySlot = (index: number, field: string, value: string | number) => {
    setAvailability((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.interviews.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {interviews.length} {t.interviews.title.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScheduleInterviewDialog
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            formType={formType}
            onFormTypeChange={setFormType}
            formDate={formDate}
            onFormDateChange={setFormDate}
            formTime={formTime}
            onFormTimeChange={setFormTime}
            formDuration={formDuration}
            onFormDurationChange={setFormDuration}
            formInterviewer={formInterviewer}
            onFormInterviewerChange={setFormInterviewer}
            formNotes={formNotes}
            onFormNotesChange={setFormNotes}
            submitting={submitting}
            onSchedule={handleSchedule}
            t={t}
          />
          <Button
            variant="outline"
            className="border-slate-300 text-blue-600 hover:bg-slate-50"
            onClick={() => setAiQuestionsOpen(true)}
          >
            <Sparkles className="w-4 h-4 me-2" />
            AI Generate Questions
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="interviews" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="interviews" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {t.interviews.title}
          </TabsTrigger>
          <TabsTrigger value="self-scheduling" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {t.selfScheduling.title}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interviews">
          <InterviewsTab
            interviews={filteredInterviews}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectInterview={(i) => { setSelectedInterview(i); setDetailsOpen(true); }}
            formatDate={formatDate}
            formatTime={formatTime}
            getInitials={getInitials}
            t={t}
          />
        </TabsContent>

        <TabsContent value="self-scheduling">
          <SelfSchedulingTab
            availability={availability}
            setAvailability={setAvailability}
            schedulingSlots={schedulingSlots}
            slotsLoading={slotsLoading}
            savingAvailability={savingAvailability}
            generatingSlots={generatingSlots}
            daysToGenerate={daysToGenerate}
            onDaysToGenerateChange={setDaysToGenerate}
            copiedLink={copiedLink}
            onSaveAvailability={handleSaveAvailability}
            onGenerateSlots={handleGenerateSlots}
            onCopyLink={handleCopySchedulingLink}
            addAvailabilitySlot={addAvailabilitySlot}
            removeAvailabilitySlot={removeAvailabilitySlot}
            updateAvailabilitySlot={updateAvailabilitySlot}
            formatTime={formatTime}
            t={t}
          />
        </TabsContent>
      </Tabs>

      {/* Interview Details Sheet */}
      <InterviewDetailsSheet
        interview={selectedInterview}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onCancel={(i) => { setCancelTarget(i); setCancelDialogOpen(true); }}
        formatDate={formatDate}
        formatTime={formatTime}
        getInitials={getInitials}
        t={t}
      />

      {/* Cancel Dialog */}
      <CancelInterviewDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelInterview}
        t={t}
      />

      {/* AI Questions Dialog */}
      <AiQuestionsDialog
        open={aiQuestionsOpen}
        onOpenChange={setAiQuestionsOpen}
        t={t}
      />
    </div>
  );
}
