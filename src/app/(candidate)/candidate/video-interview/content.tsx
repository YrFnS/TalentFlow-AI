// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  Calendar,
  Eye,
  Brain,
  Lightbulb,
  Camera,
  Timer,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';

interface InterviewQuestion {
  text: string;
  type: string;
}

interface MockResponse {
  questionIndex: number;
  duration: number;
  aiScore: number | null;
  aiFeedback: string | null;
  retakes: number;
}

interface MockInterview {
  id: string;
  title: string;
  job: string;
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  questions: InterviewQuestion[];
  maxRetakes: number;
  timePerQuestion: number; // seconds, 0 = unlimited
  completedAt: string | null;
  responses: MockResponse[];
}

type InterviewStep = 'list' | 'instructions' | 'question' | 'recording' | 'review' | 'completion';

const pendingInterviews: MockInterview[] = [];
const completedInterviews: MockInterview[] = [];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoInterviewCandidateContent() {
  const { t } = useI18n();

  // Interview flow state
  const [currentStep, setCurrentStep] = useState<InterviewStep>('list');
  const [activeInterview, setActiveInterview] = useState<MockInterview | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [questionResponses, setQuestionResponses] = useState<Record<number, { duration: number; retakes: number }>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<MockInterview | null>(null);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed countdown for question display
  const countdown = (() => {
    if (currentStep === 'question' && activeInterview && activeInterview.timePerQuestion > 0) {
      const existing = questionResponses[currentQuestionIdx];
      if (!existing?.duration) {
        return activeInterview.timePerQuestion;
      }
    }
    return 0;
  })();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Start interview
  const handleStartInterview = (interview: MockInterview) => {
    setActiveInterview(interview);
    setCurrentQuestionIdx(0);
    setQuestionResponses({});
    setCurrentStep('instructions');
  };

  // Begin recording
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    const timeLimit = activeInterview?.timePerQuestion || 0;

    recordingInterval.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        if (timeLimit > 0 && next >= timeLimit) {
          handleStopRecording();
          return timeLimit;
        }
        return next;
      });
    }, 1000);
  };

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    setIsRecording(false);
    setQuestionResponses((prev) => ({
      ...prev,
      [currentQuestionIdx]: {
        duration: recordingTime,
        retakes: prev[currentQuestionIdx]?.retakes || 0,
      },
    }));
    setCurrentStep('review');
  }, [currentQuestionIdx, recordingTime]);

  // Retake
  const handleRetake = () => {
    const currentRetakes = questionResponses[currentQuestionIdx]?.retakes || 0;
    if (activeInterview && currentRetakes >= activeInterview.maxRetakes) {
      toast.error('No retakes remaining for this question');
      return;
    }
    setQuestionResponses((prev) => ({
      ...prev,
      [currentQuestionIdx]: {
        duration: 0,
        retakes: (prev[currentQuestionIdx]?.retakes || 0) + 1,
      },
    }));
    setRecordingTime(0);
    setCurrentStep('question');
  };

  // Next question
  const handleNextQuestion = () => {
    if (!activeInterview) return;
    if (currentQuestionIdx < activeInterview.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setRecordingTime(0);
      setCurrentStep('question');
    } else {
      setSubmitDialogOpen(true);
    }
  };

  // Previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setRecordingTime(0);
      setCurrentStep('question');
    }
  };

  // Submit all
  const handleSubmitAll = () => {
    setSubmitDialogOpen(false);
    setCurrentStep('completion');
    toast.success(t.asyncInterview.completionTitle);
  };

  // Back to list
  const handleBackToList = () => {
    setCurrentStep('list');
    setActiveInterview(null);
    setCurrentQuestionIdx(0);
    setRecordingTime(0);
    setIsRecording(false);
    setQuestionResponses({});
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  // Open feedback dialog
  const handleViewFeedback = (interview: MockInterview) => {
    setFeedbackInterview(interview);
    setFeedbackOpen(true);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const remainingRetakes = activeInterview
    ? activeInterview.maxRetakes - (questionResponses[currentQuestionIdx]?.retakes || 0)
    : 0;

  const progressPercent = activeInterview
    ? ((currentQuestionIdx + 1) / activeInterview.questions.length) * 100
    : 0;

  // Render interview list
  const renderInterviewList = () => (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Video className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.asyncInterview.title}</h1>
          <p className="text-sm text-muted-foreground">{t.asyncInterview.subtitle}</p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-blue-600" />
          {t.asyncInterview.upcoming}
        </h2>
        {pendingInterviews.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{t.asyncInterview.noPendingInterviews || 'No pending interviews'}</p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingInterviews.map((interview) => {
            const isDeadlinePassed = new Date(interview.deadline) < new Date();
            return (
              <Card key={interview.id} className="card-border-border/50 overflow-hidden">
                <div className="h-24 bg-gradient-to-br bg-blue-600 relative flex items-center justify-center">
                  <Video className="h-10 w-10 text-white/20" />
                  <div className="absolute top-2 start-2">
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">
                      {interview.questions.length} {t.asyncInterview.questions}
                    </Badge>
                  </div>
                  <div className="absolute top-2 end-2">
                    <Badge className={cn(
                      'text-[10px] border-0',
                      isDeadlinePassed
                        ? 'bg-red-500/80 text-white'
                        : 'bg-white/20 text-white'
                    )}>
                      {isDeadlinePassed ? t.asyncInterview.deadlinePassed : interview.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold">{interview.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{interview.job}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(interview.deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {interview.timePerQuestion > 0
                        ? `${interview.timePerQuestion}s`
                        : t.asyncInterview.unlimited}
                    </span>
                  </div>
                  <Button
                    className="w-full h-8 text-xs bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
                    onClick={() => handleStartInterview(interview)}
                    disabled={isDeadlinePassed}
                  >
                    <Play className="w-3.5 h-3.5 me-1" />
                    {t.asyncInterview.startInterview}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
      </div>

      {/* Completed Interviews */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          {t.asyncInterview.completedInterviews}
        </h2>
        {completedInterviews.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{t.asyncInterview.noCompletedInterviews || 'No completed interviews yet'}</p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedInterviews.map((interview) => {
            const avgScore = interview.responses.length > 0
              ? Math.round(interview.responses.reduce((sum, r) => sum + (r.aiScore || 0), 0) / interview.responses.length)
              : null;
            return (
              <Card key={interview.id} className="card-border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold">{interview.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{interview.job}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(interview.completedAt || '')}
                    </span>
                    {avgScore !== null && (
                      <span className={cn(
                        'font-bold',
                        avgScore >= 85 ? 'text-emerald-600' :
                        avgScore >= 70 ? 'text-blue-600' :
                        'text-amber-600'
                      )}>
                        {t.asyncInterview.aiScore}: {avgScore}%
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-slate-300 text-blue-600 hover:bg-slate-50"
                    onClick={() => handleViewFeedback(interview)}
                  >
                    <Eye className="w-3.5 h-3.5 me-1" />
                    {t.asyncInterview.viewFeedback}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );

  // Render instructions step
  const renderInstructions = () => {
    if (!activeInterview) return null;
    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <Card className="border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br bg-blue-600 flex items-center justify-center mb-3">
              <Video className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">{t.asyncInterview.instructions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t.asyncInterview.instructionsDesc}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                <Timer className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold">
                  {activeInterview.timePerQuestion > 0
                    ? `${activeInterview.timePerQuestion} ${t.asyncInterview.seconds}`
                    : t.asyncInterview.unlimited}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.asyncInterview.timeLimit}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                <RotateCcw className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold">{activeInterview.maxRetakes}</p>
                <p className="text-[10px] text-muted-foreground">{t.asyncInterview.retakesAllowed}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5" />
                {t.asyncInterview.tips}
              </p>
              <ul className="space-y-1">
                <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.asyncInterview.tip1}</li>
                <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.asyncInterview.tip2}</li>
                <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.asyncInterview.tip3}</li>
                <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.asyncInterview.tip4}</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={handleBackToList}>
                {t.common.back}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setCurrentStep('question')}
              >
                {t.asyncInterview.startInterview}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render question step
  const renderQuestion = () => {
    if (!activeInterview) return null;
    const question = activeInterview.questions[currentQuestionIdx];
    const timeLimit = activeInterview.timePerQuestion;
    const hasExistingResponse = questionResponses[currentQuestionIdx]?.duration;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{t.asyncInterview.questionOf} {currentQuestionIdx + 1} / {activeInterview.questions.length}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6 space-y-5">
            {/* Question */}
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-blue-700 border-slate-200/30 shrink-0 mt-0.5">
                {getQuestionTypeLabel(question.type)}
              </Badge>
              <p className="text-lg font-medium">{question.text}</p>
            </div>

            {/* Camera placeholder */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 aspect-video flex items-center justify-center border border-border/20">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Camera className="w-7 h-7 text-white/70" />
                </div>
                <p className="text-xs text-white/50">Camera preview</p>
              </div>
              {timeLimit > 0 && !hasExistingResponse && (
                <div className="absolute top-3 end-3 bg-black/50 rounded-lg px-2.5 py-1 text-white text-sm font-mono">
                  {formatDuration(countdown || timeLimit)}
                </div>
              )}
            </div>

            {/* Retakes info */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {remainingRetakes} {t.asyncInterview.retakesRemaining}
              </span>
              {timeLimit > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t.asyncInterview.timeLimit}: {timeLimit} {t.asyncInterview.seconds}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="text-destructive border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                {t.common.cancel}
              </Button>
              <div className="flex items-center gap-2">
                {currentQuestionIdx > 0 && (
                  <Button variant="outline" onClick={handlePreviousQuestion}>
                    <ChevronLeft className="w-4 h-4 me-1" />
                    {t.asyncInterview.previous}
                  </Button>
                )}
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleStartRecording}
                >
                  <Camera className="w-4 h-4 me-2" />
                  {t.asyncInterview.startRecording}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render recording step
  const renderRecording = () => {
    if (!activeInterview) return null;
    const question = activeInterview.questions[currentQuestionIdx];
    const timeLimit = activeInterview.timePerQuestion;
    const timeRemaining = timeLimit > 0 ? Math.max(0, timeLimit - recordingTime) : null;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <Card className="border-red-200 dark:border-red-800/50">
          <CardContent className="p-6 space-y-5">
            {/* Recording indicator */}
            <div className="flex items-center justify-center gap-2 text-red-500">
              <span className="recording-dot w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium">{t.asyncInterview.recording}</span>
              <span className="text-sm font-mono">{formatDuration(recordingTime)}</span>
            </div>

            {/* Question text */}
            <p className="text-sm text-muted-foreground text-center">{question.text}</p>

            {/* Camera with recording overlay */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 aspect-video flex items-center justify-center border-2 border-red-500/50">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 animate-pulse">
                  <Camera className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-xs text-white/50">Recording in progress...</p>
              </div>
              {timeRemaining !== null && (
                <div className="absolute top-3 end-3 bg-red-500/80 rounded-lg px-2.5 py-1 text-white text-sm font-mono">
                  {t.asyncInterview.timeRemaining}: {formatDuration(timeRemaining)}
                </div>
              )}
              <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-red-500/80 rounded-lg px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs text-white font-medium">REC</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => {
                  if (recordingInterval.current) {
                    clearInterval(recordingInterval.current);
                    recordingInterval.current = null;
                  }
                  setIsRecording(false);
                  setRecordingTime(0);
                  setCurrentStep('question');
                }}
              >
                {t.common.cancel}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleStopRecording}
              >
                <Square className="w-4 h-4 me-2" />
                {t.asyncInterview.stopRecording}
              </Button>
            </div>
          </CardContent>
        </Card>

        <style jsx>{`
          @keyframes recording-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .recording-dot {
            animation: recording-pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  };

  // Render review step
  const renderReview = () => {
    if (!activeInterview) return null;
    const question = activeInterview.questions[currentQuestionIdx];
    const response = questionResponses[currentQuestionIdx];
    const canRetake = (response?.retakes || 0) < activeInterview.maxRetakes;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-lg font-semibold text-center">{t.asyncInterview.review}</h3>

            {/* Video playback placeholder */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-teal-900/80 to-emerald-900/80 dark:from-teal-950 dark:to-emerald-950 aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ms-0.5" />
                </div>
                {response?.duration && (
                  <span className="text-xs text-white/70">{formatDuration(response.duration)}</span>
                )}
              </div>
            </div>

            {/* Question info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-blue-700 border-slate-200/30 shrink-0">
                {getQuestionTypeLabel(question.type)}
              </Badge>
              <p className="text-sm text-muted-foreground">{question.text}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setRecordingTime(0);
                  setCurrentStep('question');
                }}
              >
                <ChevronLeft className="w-4 h-4 me-1" />
                {t.asyncInterview.previous}
              </Button>
              <div className="flex items-center gap-2">
                {canRetake && (
                  <Button
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={handleRetake}
                  >
                    <RotateCcw className="w-4 h-4 me-1" />
                    {t.asyncInterview.retake}
                  </Button>
                )}
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIdx < activeInterview.questions.length - 1 ? (
                    <>
                      {t.asyncInterview.next}
                      <ChevronRight className="w-4 h-4 ms-1" />
                    </>
                  ) : (
                    <>
                      {t.asyncInterview.submitAll}
                      <CheckCircle2 className="w-4 h-4 ms-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render completion step
  const renderCompletion = () => (
    <div className="max-w-lg mx-auto animate-fade-in-up">
      <Card className="border-border/50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br bg-blue-600 flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">{t.asyncInterview.completionTitle}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t.asyncInterview.completionMessage}
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
            onClick={handleBackToList}
          >
            {t.common.back}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Render based on step
  const renderContent = () => {
    switch (currentStep) {
      case 'instructions':
        return renderInstructions();
      case 'question':
        return renderQuestion();
      case 'recording':
        return renderRecording();
      case 'review':
        return renderReview();
      case 'completion':
        return renderCompletion();
      default:
        return renderInterviewList();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.asyncInterview.submitAll}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.asyncInterview.submitConfirmation}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitAll}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t.asyncInterview.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              {t.asyncInterview.aiFeedback}
            </DialogTitle>
          </DialogHeader>
          {feedbackInterview && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pe-2 custom-scrollbar">
              {feedbackInterview.questions.map((question, idx) => {
                const response = feedbackInterview.responses.find((r) => r.questionIndex === idx);
                return (
                  <Card key={idx} className="border-border/50">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-blue-700 border-slate-200/30 shrink-0">
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                        <p className="text-sm">{question.text}</p>
                      </div>
                      {response ? (
                        <div className="space-y-1.5">
                          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-teal-900/80 to-emerald-900/80 dark:from-teal-950 dark:to-emerald-950 h-28 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="relative flex items-center gap-2">
                              <Play className="w-5 h-5 text-white/70" />
                              <span className="text-xs text-white/60">{formatDuration(response.duration)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t.asyncInterview.aiScore}:</span>
                            <span className={cn(
                              'text-sm font-bold',
                              (response.aiScore || 0) >= 85 ? 'text-emerald-600' :
                              (response.aiScore || 0) >= 70 ? 'text-blue-600' :
                              'text-amber-600'
                            )}>
                              {response.aiScore}%
                            </span>
                          </div>
                          {response.aiFeedback && (
                            <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                              {response.aiFeedback}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t.asyncInterview.noFeedback}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
