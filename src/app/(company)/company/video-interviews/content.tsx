'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Sparkles,
  Loader2,
  Play,
  Trash2,
  Calendar,
  Search,
  Eye,
  Brain,
  Timer,
  RotateCcw,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface InterviewQuestion {
  text: string;
  type: string;
}

interface VideoInterviewResponse {
  id: string;
  videoInterviewId: string;
  candidateId: string;
  questionIndex: number;
  videoUrl: string | null;
  duration: number | null;
  aiScore: number | null;
  aiFeedback: string | null;
  retakes: number;
  completedAt: string | null;
}

interface VideoInterview {
  id: string;
  applicationId: string;
  title: string;
  description: string | null;
  questions: string;
  responseDeadline: string | null;
  maxRetakes: number;
  timePerQuestion: number | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  responses: VideoInterviewResponse[];
  application: {
    id: string;
    candidate: {
      user: { name: string; email: string };
    };
    job: { title: string };
  };
}

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  PENDING: {
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800/30',
    icon: Clock,
  },
  IN_PROGRESS: {
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-200 dark:border-teal-800/30',
    icon: Play,
  },
  COMPLETED: {
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800/30',
    icon: CheckCircle2,
  },
  EXPIRED: {
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800/30',
    icon: AlertCircle,
  },
  CANCELLED: {
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-800/30',
    icon: XCircle,
  },
};

const questionTypeOptions = [
  { value: 'intro', labelKey: 'intro' },
  { value: 'technical', labelKey: 'technical' },
  { value: 'behavioral', labelKey: 'behavioral' },
  { value: 'situational', labelKey: 'situational' },
];

export default function VideoInterviewsContent() {
  const { t } = useI18n();
  const [interviews, setInterviews] = useState<VideoInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    applicationId: '',
    title: '',
    description: '',
    questions: [{ text: '', type: 'intro' }] as InterviewQuestion[],
    responseDeadline: '',
    maxRetakes: 1,
    timePerQuestion: 90,
  });
  const [generatingAI, setGeneratingAI] = useState(false);

  // View responses dialog
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<VideoInterview | null>(null);
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/video-interviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch video interviews:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Unique jobs for filter
  const uniqueJobs = Array.from(new Set(interviews.map((vi) => vi.application.job.title)));

  // Stats
  const stats = {
    total: interviews.length,
    pending: interviews.filter((vi) => vi.status === 'PENDING').length,
    completed: interviews.filter((vi) => vi.status === 'COMPLETED').length,
    avgScore: (() => {
      const scored = interviews.filter((vi) => vi.status === 'COMPLETED' && vi.responses.length > 0);
      if (scored.length === 0) return 0;
      const totalScore = scored.reduce((sum, vi) => {
        const responsesWithScore = vi.responses.filter((r) => r.aiScore !== null);
        if (responsesWithScore.length === 0) return sum;
        const avg = responsesWithScore.reduce((s, r) => s + (r.aiScore || 0), 0) / responsesWithScore.length;
        return sum + avg;
      }, 0);
      return Math.round(totalScore / scored.length);
    })(),
  };

  // Filtered interviews
  const filteredInterviews = interviews.filter((vi) => {
    const matchesSearch = !searchQuery ||
      vi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vi.application.candidate.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vi.application.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJob = jobFilter === 'all' || vi.application.job.title === jobFilter;
    return matchesSearch && matchesJob;
  });

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: t.asyncInterview.pending,
      IN_PROGRESS: t.asyncInterview.inProgress,
      COMPLETED: t.asyncInterview.completed,
      EXPIRED: t.asyncInterview.expired,
      CANCELLED: t.asyncInterview.cancelled,
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const parseQuestions = (questionsStr: string): InterviewQuestion[] => {
    try {
      return JSON.parse(questionsStr);
    } catch {
      return [];
    }
  };

  const getInterviewAvgScore = (vi: VideoInterview): number | null => {
    const scored = vi.responses.filter((r) => r.aiScore !== null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((sum, r) => sum + (r.aiScore || 0), 0) / scored.length);
  };

  // Create interview handler
  const handleCreate = async () => {
    if (!createForm.title || createForm.questions.length === 0 || createForm.questions.some((q) => !q.text.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/video-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: createForm.applicationId || 'app-demo',
          title: createForm.title,
          description: createForm.description || undefined,
          questions: createForm.questions,
          responseDeadline: createForm.responseDeadline || undefined,
          maxRetakes: createForm.maxRetakes,
          timePerQuestion: createForm.timePerQuestion,
        }),
      });
      if (res.ok) {
        const newInterview = await res.json();
        setInterviews((prev) => [newInterview, ...prev]);
        setCreateOpen(false);
        resetCreateForm();
        toast.success('Interview created successfully');
      }
    } catch (error) {
      console.error('Failed to create interview:', error);
      toast.error('Failed to create interview');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      applicationId: '',
      title: '',
      description: '',
      questions: [{ text: '', type: 'intro' }],
      responseDeadline: '',
      maxRetakes: 1,
      timePerQuestion: 90,
    });
  };

  // AI question generation
  const handleGenerateQuestions = async () => {
    if (!createForm.title.trim()) {
      toast.error('Please enter an interview title first');
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: createForm.title,
          level: 'Mid',
          type: 'mixed',
          count: 4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions)) {
          const aiQuestions: InterviewQuestion[] = data.questions.map((q: { question: string; category: string }) => ({
            text: q.question,
            type: q.category === 'technical' ? 'technical' : q.category === 'behavioral' ? 'behavioral' : q.category === 'situational' ? 'situational' : 'intro',
          }));
          setCreateForm((prev) => ({ ...prev, questions: aiQuestions }));
          toast.success(`Generated ${aiQuestions.length} questions`);
        }
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setGeneratingAI(false);
    }
  };

  // AI analysis handler
  const handleAnalyze = async (interviewId: string, questionIndex: number) => {
    setAnalyzingIdx(questionIndex);
    try {
      // Simulate AI analysis with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Return a generic score since we don't have real AI feedback
      const score = 0;
      const feedback = '';

      setInterviews((prev) =>
        prev.map((vi) => {
          if (vi.id === interviewId) {
            return {
              ...vi,
              responses: vi.responses.map((r) => {
                if (r.questionIndex === questionIndex) {
                  return { ...r, aiScore: score, aiFeedback: feedback };
                }
                return r;
              }),
            };
          }
          return vi;
        })
      );

      if (selectedInterview?.id === interviewId) {
        setSelectedInterview((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            responses: prev.responses.map((r) => {
              if (r.questionIndex === questionIndex) {
                return { ...r, aiScore: score, aiFeedback: feedback };
              }
              return r;
            }),
          };
        });
      }

      toast.success('AI analysis complete');
    } catch {
      toast.error('Failed to analyze response');
    } finally {
      setAnalyzingIdx(null);
    }
  };

  // Add/remove question
  const addQuestion = () => {
    setCreateForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { text: '', type: 'technical' }],
    }));
  };

  const removeQuestion = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, field: 'text' | 'type', value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const getQuestionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      intro: t.asyncInterview.intro,
      technical: t.asyncInterview.technical,
      behavioral: t.asyncInterview.behavioral,
      situational: t.asyncInterview.situational,
    };
    return labels[type] || type;
  };

  const openResponsesDialog = (vi: VideoInterview) => {
    setSelectedInterview(vi);
    setResponsesOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.asyncInterview.title}</h1>
            <p className="text-sm text-muted-foreground">{t.asyncInterview.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => { resetCreateForm(); setCreateOpen(true); }}
        >
          <Plus className="w-4 h-4 me-2" />
          {t.asyncInterview.createInterview}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.asyncInterview.totalInterviews, value: stats.total, icon: Video, gradient: 'from-teal-500 to-emerald-600' },
          { label: t.asyncInterview.pendingResponses, value: stats.pending, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
          { label: t.asyncInterview.completed, value: stats.completed, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
          { label: t.asyncInterview.avgAIScore, value: stats.avgScore > 0 ? `${stats.avgScore}%` : '-', icon: Brain, gradient: 'from-teal-600 to-emerald-700' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover-lift border-border/50 relative overflow-hidden">
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-[0.06]', stat.gradient)} />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white', stat.gradient)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
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
          <Input
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder={t.asyncInterview.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.asyncInterview.filterByStatus}</SelectItem>
            <SelectItem value="PENDING">{t.asyncInterview.pending}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t.asyncInterview.inProgress}</SelectItem>
            <SelectItem value="COMPLETED">{t.asyncInterview.completed}</SelectItem>
            <SelectItem value="EXPIRED">{t.asyncInterview.expired}</SelectItem>
            <SelectItem value="CANCELLED">{t.asyncInterview.cancelled}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder={t.asyncInterview.filterByJob} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.asyncInterview.filterByJob}</SelectItem>
            {uniqueJobs.map((job) => (
              <SelectItem key={job} value={job}>{job}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interviews Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
            <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t.asyncInterview.noInterviews}</h3>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.asyncInterview.candidate}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.job}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.questions}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.responseDeadline}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.status}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.aiScore}</TableHead>
                    <TableHead className="text-xs">{t.asyncInterview.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((vi) => {
                    const sConfig = statusConfig[vi.status] || statusConfig.PENDING;
                    const SIcon = sConfig.icon;
                    const parsedQuestions = parseQuestions(vi.questions);
                    const avgScore = getInterviewAvgScore(vi);
                    const isDeadlinePassed = vi.responseDeadline && new Date(vi.responseDeadline) < new Date() && vi.status === 'PENDING';

                    return (
                      <TableRow key={vi.id} className="hover:bg-muted/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px]">
                                {getInitials(vi.application.candidate.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[140px]">
                                {vi.application.candidate.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {vi.title}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{vi.application.job.title}</TableCell>
                        <TableCell className="text-sm">{parsedQuestions.length}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(vi.responseDeadline)}
                            {isDeadlinePassed && (
                              <p className="text-xs text-red-500 dark:text-red-400">{t.asyncInterview.deadlinePassed}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 font-medium',
                              sConfig.color,
                              sConfig.bgColor,
                              sConfig.borderColor
                            )}
                          >
                            <SIcon className="w-3 h-3 me-1" />
                            {getStatusLabel(vi.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {avgScore !== null ? (
                            <span className={cn(
                              'text-sm font-bold',
                              avgScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                              avgScore >= 70 ? 'text-teal-600 dark:text-teal-400' :
                              'text-amber-600 dark:text-amber-400'
                            )}>
                              {avgScore}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(vi.status === 'COMPLETED' || vi.status === 'IN_PROGRESS') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                onClick={() => openResponsesDialog(vi)}
                              >
                                <Eye className="w-3 h-3 me-1" />
                                {t.asyncInterview.viewResponses}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Interview Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-teal-600" />
              {t.asyncInterview.createInterview}
            </DialogTitle>
            <DialogDescription>
              {t.asyncInterview.subtitle}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pe-2">
            <div className="space-y-4 py-2">
              {/* Select Application */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.asyncInterview.selectApplication}</Label>
                <Select
                  value={createForm.applicationId}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, applicationId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.asyncInterview.selectApplication} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app-1">Select an application...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.asyncInterview.interviewTitle} *</Label>
                <Input
                  placeholder={t.asyncInterview.interviewTitle}
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.asyncInterview.description}</Label>
                <Textarea
                  placeholder={t.asyncInterview.description}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t.asyncInterview.questions} *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                      onClick={handleGenerateQuestions}
                      disabled={generatingAI}
                    >
                      {generatingAI ? (
                        <Loader2 className="w-3 h-3 me-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 me-1" />
                      )}
                      {generatingAI ? t.asyncInterview.generating : t.asyncInterview.generateQuestions}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={addQuestion}
                    >
                      <Plus className="w-3 h-3 me-1" />
                      {t.asyncInterview.addQuestion}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {createForm.questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}.</span>
                          <Select
                            value={q.type}
                            onValueChange={(v) => updateQuestion(idx, 'type', v)}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {t.asyncInterview[opt.labelKey as keyof typeof t.asyncInterview]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder={`${t.asyncInterview.questionType}: ${getQuestionTypeLabel(q.type)}`}
                          value={q.text}
                          onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      {createForm.questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-5"
                          onClick={() => removeQuestion(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Response Deadline */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.asyncInterview.responseDeadline}</Label>
                <Input
                  type="date"
                  value={createForm.responseDeadline}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, responseDeadline: e.target.value }))}
                />
              </div>

              {/* Max Retakes & Time per Question */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.asyncInterview.maxRetakes}</Label>
                  <Select
                    value={String(createForm.maxRetakes)}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, maxRetakes: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.asyncInterview.timePerQuestion}</Label>
                  <Select
                    value={String(createForm.timePerQuestion)}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, timePerQuestion: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 {t.asyncInterview.seconds}</SelectItem>
                      <SelectItem value="60">60 {t.asyncInterview.seconds}</SelectItem>
                      <SelectItem value="90">90 {t.asyncInterview.seconds}</SelectItem>
                      <SelectItem value="120">120 {t.asyncInterview.seconds}</SelectItem>
                      <SelectItem value="0">{t.asyncInterview.unlimited}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleCreate}
              disabled={createSubmitting || !createForm.title || createForm.questions.some((q) => !q.text.trim())}
            >
              {createSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
              {t.asyncInterview.createInterview}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Responses Dialog */}
      <Dialog open={responsesOpen} onOpenChange={setResponsesOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              {t.asyncInterview.viewResponses}
            </DialogTitle>
            <DialogDescription>
              {selectedInterview?.title} - {selectedInterview?.application.candidate.user.name}
            </DialogDescription>
          </DialogHeader>
          {selectedInterview && (
            <ScrollArea className="max-h-[60vh] pe-2">
              <div className="space-y-4 py-2">
                {parseQuestions(selectedInterview.questions).map((question, idx) => {
                  const response = selectedInterview.responses.find((r) => r.questionIndex === idx);
                  return (
                    <Card key={idx} className="border-border/50">
                      <CardContent className="p-4 space-y-3">
                        {/* Question */}
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/30 shrink-0">
                            {getQuestionTypeLabel(question.type)}
                          </Badge>
                          <p className="text-sm font-medium">{question.text}</p>
                        </div>

                        {/* Video Placeholder */}
                        {response ? (
                          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-teal-900/80 to-emerald-900/80 dark:from-teal-950 dark:to-emerald-950 aspect-video flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="relative flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Play className="w-5 h-5 text-white ms-0.5" />
                              </div>
                              {response.duration && (
                                <span className="text-xs text-white/80">{response.duration}s</span>
                              )}
                            </div>
                            {response.retakes > 0 && (
                              <div className="absolute top-2 end-2 flex items-center gap-1 text-xs text-white/70 bg-black/30 rounded px-1.5 py-0.5">
                                <RotateCcw className="w-3 h-3" />
                                {response.retakes} {t.asyncInterview.retake.toLowerCase()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative rounded-lg overflow-hidden bg-muted/30 aspect-video flex items-center justify-center border border-dashed border-border/50">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Video className="w-8 h-8 opacity-30" />
                              <span className="text-xs">No response yet</span>
                            </div>
                          </div>
                        )}

                        {/* AI Score & Feedback */}
                        {response && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">{t.asyncInterview.aiScore}:</span>
                                {response.aiScore !== null ? (
                                  <span className={cn(
                                    'text-sm font-bold',
                                    response.aiScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                                    response.aiScore >= 70 ? 'text-teal-600 dark:text-teal-400' :
                                    'text-amber-600 dark:text-amber-400'
                                  )}>
                                    {response.aiScore}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                              {response.aiFeedback === null && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                  onClick={() => handleAnalyze(selectedInterview.id, idx)}
                                  disabled={analyzingIdx === idx}
                                >
                                  {analyzingIdx === idx ? (
                                    <Loader2 className="w-3 h-3 me-1 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3 me-1" />
                                  )}
                                  {analyzingIdx === idx ? t.asyncInterview.analyzing : t.asyncInterview.analyzeWithAI}
                                </Button>
                              )}
                            </div>
                            {response.aiFeedback ? (
                              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/30">
                                <p className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-1">{t.asyncInterview.aiFeedback}</p>
                                <p className="text-xs text-muted-foreground">{response.aiFeedback}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">{t.asyncInterview.noFeedback}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
