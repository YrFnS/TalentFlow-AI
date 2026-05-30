// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Video,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Search,
  X,
  User,
  Star,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Trash2,
  Sparkles,
  Loader2,
  CalendarClock,
  Settings2,
  Zap,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ─── Interview types ───────────────────────────────────────────
interface InterviewAssignment {
  interviewer: { name: string };
  rating: number | null;
  notes: string | null;
}

interface Interview {
  id: string;
  applicationId: string;
  type: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  meetingLink: string | null;
  feedback: string | null;
  rating: number | null;
  createdAt: string;
  application: {
    id: string;
    candidate: {
      user: { name: string; email: string };
    };
    job: { title: string };
  };
  assignments: InterviewAssignment[];
}

// ─── Self-Scheduling types ──────────────────────────────────────
interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityConfig {
  interviewerId: string;
  interviewerName: string;
  slots: AvailabilitySlot[];
  slotDuration: number;
  bufferBetween: number;
  timezone: string;
}

interface SchedulingSlot {
  id: string;
  interviewerId: string;
  interviewerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'available' | 'booked';
  bookedBy: { name: string; email: string } | null;
  token: string;
  jobTitle: string;
  companyName: string;
  location: string;
}

// ─── Config maps ────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  SCHEDULED: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-200 dark:border-amber-800/30', icon: Calendar },
  IN_PROGRESS: { color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', borderColor: 'border-teal-200 dark:border-teal-800/30', icon: PlayCircle },
  COMPLETED: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800/30', icon: CheckCircle2 },
  CANCELLED: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-200 dark:border-red-800/30', icon: XCircle },
};

const typeConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  PHONE: { color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30', icon: Phone },
  VIDEO: { color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/30', icon: Video },
  ON_SITE: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30', icon: MapPin },
  ASYNC_VIDEO: { color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/30', icon: Video },
};

const interviewTypes = ['PHONE', 'VIDEO', 'ON_SITE', 'ASYNC_VIDEO'];
const interviewStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const timezones = [
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Pacific/Auckland', 'Australia/Sydney',
];

// ─── Main Component ─────────────────────────────────────────────
export default function InterviewsPage() {
  const { t } = useI18n();

  // ─── Interviews state ────────────────────────────────────────
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
  const [aiQuestionsLoading, setAiQuestionsLoading] = useState(false);
  const [aiQuestionsError, setAiQuestionsError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<Array<{
    question: string; category: string; difficulty: string; evaluationCriteria: string;
  }>>([]);
  const [aiQuestionForm, setAiQuestionForm] = useState({ role: '', level: 'Mid', type: 'Mixed', count: 5 });

  // Schedule form state
  const [formType, setFormType] = useState('VIDEO');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formInterviewer, setFormInterviewer] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // ─── Self-Scheduling state ───────────────────────────────────
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

  // ─── Data fetching ────────────────────────────────────────────
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

  // ─── Interview handlers ───────────────────────────────────────
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

  // ─── Self-Scheduling handlers ─────────────────────────────────
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

  const handleAiGenerateQuestions = useCallback(async () => {
    if (!aiQuestionForm.role.trim()) return;
    setAiQuestionsLoading(true);
    setAiQuestionsError(null);
    setAiQuestions([]);
    try {
      const res = await fetch('/api/ai/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: aiQuestionForm.role.trim(),
          level: aiQuestionForm.level,
          type: aiQuestionForm.type.toLowerCase(),
          count: aiQuestionForm.count,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiQuestionsError(data.error || 'Failed to generate questions');
        return;
      }
      if (Array.isArray(data.questions)) setAiQuestions(data.questions);
    } catch (err) {
      setAiQuestionsError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setAiQuestionsLoading(false);
    }
  }, [aiQuestionForm]);

  const handleAddToKit = (question: { question: string; category: string; difficulty: string; evaluationCriteria: string }) => {
    const kit = JSON.parse(localStorage.getItem('interviewKit') || '[]');
    kit.push(question);
    localStorage.setItem('interviewKit', JSON.stringify(kit));
  };

  const handleCopySchedulingLink = (token: string) => {
    const link = `${window.location.origin}/schedule/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
    toast.success('Link copied to clipboard');
  };

  // ─── Helpers ──────────────────────────────────────────────────
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PHONE: t.interviews.phone, VIDEO: t.interviews.video, ON_SITE: t.interviews.onsite, ASYNC_VIDEO: t.interviews.asyncVideo,
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      SCHEDULED: t.interviews.scheduled, IN_PROGRESS: t.interviews.inProgress, COMPLETED: t.interviews.completed, CANCELLED: t.interviews.cancelled,
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  const getDayLabel = (day: number) => {
    const key = dayNames[day];
    return t.selfScheduling[key];
  };

  // Group interviews by date
  const groupedByDate = filteredInterviews.reduce(
    (groups, interview) => {
      const date = new Date(interview.scheduledAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(interview);
      return groups;
    },
    {} as Record<string, Interview[]>
  );

  // Stats
  const stats = {
    scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
    inProgress: interviews.filter((i) => i.status === 'IN_PROGRESS').length,
    completed: interviews.filter((i) => i.status === 'COMPLETED').length,
    cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
  };

  // Self-scheduling stats
  const ssStats = {
    total: schedulingSlots.length,
    available: schedulingSlots.filter((s) => s.status === 'available').length,
    booked: schedulingSlots.filter((s) => s.status === 'booked').length,
  };

  // Group scheduling slots by date
  const groupedSlots = schedulingSlots.reduce(
    (groups, slot) => {
      const date = new Date(slot.startTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
      return groups;
    },
    {} as Record<string, SchedulingSlot[]>
  );

  const renderStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={cn('w-4 h-4', star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
        ))}
      </div>
    );
  };

  // ─── Add / Remove availability slots ──────────────────────────
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

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    setAvailability((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  // ─── Render ───────────────────────────────────────────────────
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
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.interviews.schedule}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t.interviews.schedule}</DialogTitle>
                <DialogDescription>{t.interviews.selectApplication}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.interviews.type}</label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {interviewTypes.map((type) => {
                        const cfg = typeConfig[type];
                        const Icon = cfg.icon;
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn('w-4 h-4', cfg.color)} />
                              {getTypeLabel(type)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.interviews.date}</label>
                    <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.interviews.time}</label>
                    <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.interviews.duration}</label>
                  <Select value={formDuration} onValueChange={setFormDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 {t.interviews.minutes}</SelectItem>
                      <SelectItem value="30">30 {t.interviews.minutes}</SelectItem>
                      <SelectItem value="45">45 {t.interviews.minutes}</SelectItem>
                      <SelectItem value="60">60 {t.interviews.minutes}</SelectItem>
                      <SelectItem value="90">90 {t.interviews.minutes}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.interviews.interviewer}</label>
                  <Input placeholder="Interviewer name" value={formInterviewer} onChange={(e) => setFormInterviewer(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.interviews.notes}</label>
                  <Textarea placeholder={t.interviews.notes} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleOpen(false)}>{t.common.cancel}</Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSchedule} disabled={!formDate || !formTime || submitting}>
                  {submitting ? t.common.loading : t.interviews.schedule}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
            onClick={() => { setAiQuestionsOpen(true); setAiQuestions([]); setAiQuestionsError(null); }}
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
            <Video className="w-4 h-4" />
            {t.interviews.title}
          </TabsTrigger>
          <TabsTrigger value="self-scheduling" className="gap-2">
            <CalendarClock className="w-4 h-4" />
            {t.selfScheduling.title}
          </TabsTrigger>
        </TabsList>

        {/* ═══════ Interviews Tab ═══════ */}
        <TabsContent value="interviews" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t.interviews.scheduled, count: stats.scheduled, ...statusConfig.SCHEDULED },
              { label: t.interviews.inProgress, count: stats.inProgress, ...statusConfig.IN_PROGRESS },
              { label: t.interviews.completed, count: stats.completed, ...statusConfig.COMPLETED },
              { label: t.interviews.cancelled, count: stats.cancelled, ...statusConfig.CANCELLED },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className={cn('border card-hover-lift', stat.borderColor)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', stat.bgColor)}><Icon className={cn('w-4 h-4', stat.color)} /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t.common.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder={t.interviews.status} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.interviews.allStatuses}</SelectItem>
                {interviewStatuses.map((status) => (
                  <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t.interviews.noInterviews}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.interviews.noInterviewsDesc}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, dateInterviews]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{date}</h3>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {dateInterviews.map((interview) => {
                      const sConfig = statusConfig[interview.status] || statusConfig.SCHEDULED;
                      const tConfig = typeConfig[interview.type] || typeConfig.VIDEO;
                      const SIcon = sConfig.icon;
                      const TIcon = tConfig.icon;
                      const interviewerNames = interview.assignments.map((a) => a.interviewer.name).join(', ');
                      return (
                        <Card
                          key={interview.id}
                          className={cn('border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 card-hover-lift', sConfig.borderColor)}
                          onClick={() => { setSelectedInterview(interview); setDetailsOpen(true); }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn('p-1.5 rounded-md', tConfig.bgColor)}><TIcon className={cn('w-4 h-4', tConfig.color)} /></div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">{getTypeLabel(interview.type)}</p>
                                  <p className="text-xs text-muted-foreground">{formatTime(interview.scheduledAt)} · {interview.durationMinutes} {t.interviews.minutes}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 font-medium flex-shrink-0', sConfig.color, sConfig.bgColor, sConfig.borderColor)}>
                                <SIcon className="w-3 h-3 me-1" />{getStatusLabel(interview.status)}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px]">
                                    {getInitials(interview.application.candidate.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{interview.application.candidate.user.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{interview.application.job.title}</p>
                                </div>
                              </div>
                              {interviewerNames && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" /><span className="truncate">{interviewerNames}</span>
                                </div>
                              )}
                              {interview.rating && <div className="flex items-center gap-1">{renderStars(interview.rating)}</div>}
                              {interview.location && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" /><span className="truncate">{interview.location}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════ Self-Scheduling Tab ═══════ */}
        <TabsContent value="self-scheduling" className="space-y-6">
          {/* Self-Scheduling Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border border-teal-200 dark:border-teal-800/30 card-hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30"><CalendarClock className="w-4 h-4 text-teal-700 dark:text-teal-400" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.selfScheduling.totalSlots}</p>
                    <p className="text-xl font-bold">{ssStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-emerald-200 dark:border-emerald-800/30 card-hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.selfScheduling.availableSlots}</p>
                    <p className="text-xl font-bold text-emerald-600">{ssStats.available}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-amber-200 dark:border-amber-800/30 card-hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.selfScheduling.bookedSlots}</p>
                    <p className="text-xl font-bold text-amber-600">{ssStats.booked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs: Availability & Slots */}
          <Tabs defaultValue="availability" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="availability" className="gap-2">
                <Settings2 className="w-4 h-4" />
                {t.selfScheduling.availabilityTab}
              </TabsTrigger>
              <TabsTrigger value="slots" className="gap-2">
                <CalendarClock className="w-4 h-4" />
                {t.selfScheduling.slotsTab}
              </TabsTrigger>
            </TabsList>

            {/* ─── Availability Settings ─── */}
            <TabsContent value="availability" className="space-y-6 animate-fade-in-up">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.selfScheduling.availabilitySettings}</CardTitle>
                  <CardDescription>{t.selfScheduling.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Slot Duration & Buffer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.selfScheduling.slotDuration}</Label>
                      <Select value={String(availability.slotDuration)} onValueChange={(v) => setAvailability((p) => ({ ...p, slotDuration: parseInt(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="30">30 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="45">45 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="60">60 {t.selfScheduling.minutes}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.selfScheduling.bufferBetween}</Label>
                      <Select value={String(availability.bufferBetween)} onValueChange={(v) => setAvailability((p) => ({ ...p, bufferBetween: parseInt(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="5">5 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="10">10 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="15">15 {t.selfScheduling.minutes}</SelectItem>
                          <SelectItem value="30">30 {t.selfScheduling.minutes}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.selfScheduling.timezone}</Label>
                      <Select value={availability.timezone} onValueChange={(v) => setAvailability((p) => ({ ...p, timezone: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Weekly Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{t.selfScheduling.dayOfWeek}</h4>
                      <Button size="sm" variant="outline" className="text-teal-600 border-teal-300 dark:border-teal-700" onClick={addAvailabilitySlot}>
                        <Plus className="w-3 h-3 me-1" />{t.common.create}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {availability.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-teal-300 dark:hover:border-teal-700 transition-colors animate-fade-in-up">
                          <Select value={String(slot.dayOfWeek)} onValueChange={(v) => updateAvailabilitySlot(idx, 'dayOfWeek', parseInt(v))}>
                            <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {dayNames.map((day, i) => <SelectItem key={i} value={String(i)}>{t.selfScheduling[day]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Input type="time" value={slot.startTime} onChange={(e) => updateAvailabilitySlot(idx, 'startTime', e.target.value)} className="h-8 w-[110px]" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <Input type="time" value={slot.endTime} onChange={(e) => updateAvailabilitySlot(idx, 'endTime', e.target.value)} className="h-8 w-[110px]" />
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ms-auto" onClick={() => removeAvailabilitySlot(idx)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {availability.slots.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">{t.selfScheduling.noSlots}</p>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSaveAvailability} disabled={savingAvailability}>
                      {savingAvailability ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 me-2" />}
                      {t.selfScheduling.saveAvailability}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Slots Card */}
              <Card className="border-teal-200 dark:border-teal-800/30">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30">
                        <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{t.selfScheduling.generateSlots}</h3>
                        <p className="text-xs text-muted-foreground">{t.selfScheduling.generateSlotsDesc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ms-auto">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">{t.selfScheduling.daysToGenerate}</Label>
                        <Input type="number" min={1} max={30} value={daysToGenerate} onChange={(e) => setDaysToGenerate(e.target.value)} className="h-8 w-16" />
                      </div>
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleGenerateSlots} disabled={generatingSlots}>
                        {generatingSlots ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Zap className="w-4 h-4 me-2" />}
                        {generatingSlots ? t.selfScheduling.generating : t.selfScheduling.generateSlots}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Slots View ─── */}
            <TabsContent value="slots" className="space-y-6 animate-fade-in-up">
              {slotsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
                  ))}
                </div>
              ) : schedulingSlots.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CalendarClock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">{t.selfScheduling.noSlots}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.selfScheduling.noSlotsDesc}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{date}</h3>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dateSlots.map((slot) => {
                          const isAvailable = slot.status === 'available';
                          return (
                            <Card
                              key={slot.id}
                              className={cn(
                                'border transition-all duration-200 card-hover-lift animate-fade-in-up',
                                isAvailable
                                  ? 'border-teal-200 dark:border-teal-800/30 hover:border-teal-400 dark:hover:border-teal-600'
                                  : 'border-amber-200 dark:border-amber-800/30'
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className={cn('w-4 h-4', isAvailable ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400')} />
                                    <span className="text-sm font-medium">
                                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] px-1.5 py-0 font-medium',
                                      isAvailable
                                        ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/30'
                                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/30'
                                    )}
                                  >
                                    {isAvailable ? t.selfScheduling.available : t.selfScheduling.booked}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{slot.duration} {t.selfScheduling.minutes}</span>
                                  <span>·</span>
                                  <span>{slot.interviewerName}</span>
                                </div>
                                {slot.bookedBy && (
                                  <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{t.selfScheduling.bookedBy}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-300">{slot.bookedBy.name}</p>
                                    <p className="text-[10px] text-amber-500">{slot.bookedBy.email}</p>
                                  </div>
                                )}
                                {isAvailable && slot.token && (
                                  <div className="mt-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                      onClick={() => handleCopySchedulingLink(slot.token)}
                                    >
                                      {copiedLink === slot.token ? (
                                        <><CheckCircle className="w-3 h-3 me-1" />Copied!</>
                                      ) : (
                                        <><Copy className="w-3 h-3 me-1" />Copy scheduling link</>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Interview Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] p-0">
          {selectedInterview && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', typeConfig[selectedInterview.type]?.bgColor || 'bg-teal-50')}>
                    {React.createElement(typeConfig[selectedInterview.type]?.icon || Video, {
                      className: cn('w-5 h-5', typeConfig[selectedInterview.type]?.color || 'text-teal-600'),
                    })}
                  </div>
                  <div className="text-start">
                    <p className="font-semibold">{t.interviews.interviewDetails}</p>
                    <p className="text-sm text-muted-foreground">{getTypeLabel(selectedInterview.type)} · {selectedInterview.durationMinutes} {t.interviews.minutes}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.interviews.candidateName}</h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <Avatar className="w-10 h-10"><AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">{getInitials(selectedInterview.application.candidate.user.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedInterview.application.candidate.user.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedInterview.application.job.title}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.interviews.schedule}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground">{t.interviews.date}</p>
                      <p className="text-sm font-medium">{formatDate(selectedInterview.scheduledAt)}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground">{t.interviews.time}</p>
                      <p className="text-sm font-medium">{formatTime(selectedInterview.scheduledAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', statusConfig[selectedInterview.status]?.color, statusConfig[selectedInterview.status]?.bgColor)}>
                    {getStatusLabel(selectedInterview.status)}
                  </Badge>
                </div>
                <Separator />
                {selectedInterview.assignments.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.interviews.interviewer}</h4>
                      {selectedInterview.assignments.map((assignment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7"><AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-[10px]">{getInitials(assignment.interviewer.name)}</AvatarFallback></Avatar>
                            <span className="text-sm">{assignment.interviewer.name}</span>
                          </div>
                          {assignment.rating && renderStars(assignment.rating)}
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </>
                )}
                {(selectedInterview.location || selectedInterview.meetingLink) && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.contactInfo}</h4>
                      {selectedInterview.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" />{selectedInterview.location}</div>}
                      {selectedInterview.meetingLink && (
                        <div className="flex items-center gap-2 text-sm">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">{selectedInterview.meetingLink}</a>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}
                {(selectedInterview.rating || selectedInterview.feedback) && (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.interviews.scorecard}</h4>
                      {selectedInterview.rating && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{t.interviews.rating}</span>
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{selectedInterview.rating}/5</span>
                          </div>
                          {renderStars(selectedInterview.rating)}
                        </div>
                      )}
                      {selectedInterview.feedback && (
                        <div className="p-3 rounded-lg border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t.interviews.feedback}</p>
                          <p className="text-sm">{selectedInterview.feedback}</p>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}
              </div>
              <div className="p-4 border-t flex gap-2">
                {selectedInterview.status === 'SCHEDULED' && (
                  <Button variant="outline" className="flex-1 text-destructive border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => { setCancelTarget(selectedInterview); setCancelDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4 me-2" />{t.interviews.cancelInterview}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Interview Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.interviews.confirmCancel}</AlertDialogTitle>
            <AlertDialogDescription>{t.interviews.confirmCancelMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInterview} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.interviews.cancelInterview}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate Questions Dialog */}
      <Dialog open={aiQuestionsOpen} onOpenChange={setAiQuestionsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              AI Generate Interview Questions
            </DialogTitle>
            <DialogDescription>Let AI generate tailored interview questions for any role and level.</DialogDescription>
          </DialogHeader>
          {aiQuestions.length === 0 && !aiQuestionsLoading && !aiQuestionsError && (
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Role *</label>
                <Input placeholder="e.g., Senior Frontend Engineer" value={aiQuestionForm.role} onChange={(e) => setAiQuestionForm((prev) => ({ ...prev, role: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select value={aiQuestionForm.level} onValueChange={(v) => setAiQuestionForm((prev) => ({ ...prev, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={aiQuestionForm.type} onValueChange={(v) => setAiQuestionForm((prev) => ({ ...prev, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Behavioral">Behavioral</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <Input type="number" min={1} max={20} value={aiQuestionForm.count} onChange={(e) => setAiQuestionForm((prev) => ({ ...prev, count: parseInt(e.target.value) || 5 }))} />
              </div>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAiGenerateQuestions} disabled={!aiQuestionForm.role.trim()}>
                <Sparkles className="w-4 h-4 me-2" />Generate Questions
              </Button>
            </div>
          )}
          {aiQuestionsLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="mt-3 text-sm text-muted-foreground">Generating questions...</p>
            </div>
          )}
          {aiQuestionsError && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-sm text-red-700 dark:text-red-400">{aiQuestionsError}</div>
          )}
          {aiQuestions.length > 0 && (
            <div className="space-y-3">
              {aiQuestions.map((q, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <p className="text-sm font-medium">{q.question}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{q.category}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600">{q.difficulty}</Badge>
                        </div>
                        {q.evaluationCriteria && <p className="text-xs text-muted-foreground mt-1">{q.evaluationCriteria}</p>}
                      </div>
                      <Button size="sm" variant="ghost" className="text-teal-600 h-8" onClick={() => handleAddToKit(q)}>Add to Kit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
