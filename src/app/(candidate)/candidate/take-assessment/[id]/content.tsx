'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import {
  Brain,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Award,
  Target,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Question {
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  skillId: string;
  difficulty: string;
  points?: number;
}

interface SkillScore {
  skillId: string;
  skillName: string;
  correct: number;
  total: number;
  score: number;
}

interface AssessmentResult {
  id: string;
  score: number;
  overallLevel: string;
  skillScores: SkillScore[];
  aiFeedback: Record<string, string>;
  passed: boolean;
  passingScore: number;
}

interface AssessmentInfo {
  id: string;
  title: string;
  description?: string;
  skills: { name: string; category: string }[];
  questions: Question[];
  timeLimitMinutes: number | null;
  passingScore: number;
  type: string;
  isActive: boolean;
}

export default function TakeAssessmentContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const sa = t.skillAssessment;

  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/skill-assessments/${assessmentId}`);
      if (res.ok) {
        const data = await res.json();
        const a = data.assessment;
        setAssessment(a);
        if (a.timeLimitMinutes) {
          setTimeLeft(a.timeLimitMinutes * 60);
        }
      } else {
        toast.error('Assessment not found');
      }
    } catch {
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId, fetchAssessment]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);

    try {
      const answerArray = assessment.questions.map((_, idx) => answers[idx] || '');
      const res = await fetch(`/api/skill-assessments/${assessmentId}/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        setSubmitted(true);
        toast.success(sa.assessmentCompleted);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit assessment');
      }
    } catch {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400';
      case 'SOFT_SKILL': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
      case 'DOMAIN': return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
      case 'TOOL': return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400';
      case 'CERTIFICATION': return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return 'text-teal-600 dark:text-teal-400';
      case 'ADVANCED': return 'text-emerald-600 dark:text-emerald-400';
      case 'INTERMEDIATE': return 'text-amber-600 dark:text-amber-400';
      case 'BEGINNER': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">Assessment Not Found</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              This assessment may have been removed or is no longer available.
            </p>
            <Button
              onClick={() => router.push('/candidate/assessments')}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 me-2" />
              {sa.goBack}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results after submission
  if (submitted && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up py-4">
        {/* Result Header */}
        <Card className={`border-2 ${result.passed ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
          <CardContent className="p-6 text-center">
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 ${
              result.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/50'
                : 'bg-red-50 dark:bg-red-950/50'
            }`}>
              {result.passed ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {result.passed ? sa.passed : sa.failed}!
            </h2>
            <p className="text-muted-foreground mt-1">{sa.assessmentCompleted}</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{result.score}%</p>
                <p className="text-xs text-muted-foreground">{sa.yourScore}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{result.passingScore}%</p>
                <p className="text-xs text-muted-foreground">{sa.passingScore}</p>
              </div>
            </div>
            <div className="mt-3">
              <Badge className={`text-sm ${getLevelColor(result.overallLevel)}`}>
                <Award className="h-3.5 w-3.5 me-1" />
                {result.overallLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        {result.skillScores && result.skillScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-500" />
                {sa.skillBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.skillScores.map((ss, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ss.skillName}</span>
                    <span className="font-mono text-muted-foreground">{ss.score}%</span>
                  </div>
                  <Progress
                    value={ss.score}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Feedback */}
        {result.aiFeedback && Object.keys(result.aiFeedback).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-500" />
                {sa.aiFeedback}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(result.aiFeedback).map(([skill, feedback], idx) => (
                <div key={idx} className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30">
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{skill}</p>
                  <p className="text-sm text-muted-foreground mt-1">{feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => router.push('/candidate/assessments')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {sa.goBack}
          </Button>
        </div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ = questions[currentQuestion];
  const progressPercent = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Assessment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{assessment.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {assessment.skills.slice(0, 4).map((skill, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className={`text-[10px] ${getCategoryColor(skill.category)}`}
              >
                {skill.name}
              </Badge>
            ))}
            {assessment.skills.length > 4 && (
              <Badge variant="secondary" className="text-[10px]">
                +{assessment.skills.length - 4}
              </Badge>
            )}
          </div>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            timeLeft < 60
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              : 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            <span className="text-xs">{sa.timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentQuestion + 1} {sa.questionOf} {questions.length}
          </span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Navigation Dots */}
      <div className="flex items-center gap-1 flex-wrap">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentQuestion(idx)}
            className={`h-7 w-7 rounded-full text-xs font-medium transition-all ${
              idx === currentQuestion
                ? 'bg-teal-600 text-white'
                : answers[idx] !== undefined
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground hover:bg-teal-50 dark:hover:bg-teal-950/30'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      {currentQ && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {currentQ.type}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {currentQ.difficulty}
              </Badge>
            </div>
            <CardTitle className="text-lg mt-2">
              {currentQ.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Multiple Choice */}
            {(currentQ.type === 'MULTIPLE_CHOICE' || currentQ.type === 'TRUE_FALSE') && currentQ.options && currentQ.options.length > 0 ? (
              <RadioGroup
                value={answers[currentQuestion] || ''}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion]: value }))
                }
              >
                <div className="space-y-2">
                  {currentQ.options.map((option, idx) => (
                    <Label
                      key={idx}
                      htmlFor={`option-${idx}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        answers[currentQuestion] === option
                          ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-700'
                          : 'hover:border-teal-200 dark:hover:border-teal-800'
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <span className="text-sm">{option}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              /* Short Answer / Open-ended */
              <div className="space-y-2">
                <Textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion]: e.target.value,
                    }))
                  }
                  placeholder="Type your answer here..."
                  rows={5}
                  className="resize-none"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {sa.previousQuestion}
        </Button>

        <div className="flex gap-2">
          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              {sa.nextQuestion}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {sa.submitAssessment}
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sa.submitAssessment}</DialogTitle>
            <DialogDescription>{sa.submitConfirm}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {answeredCount}/{questions.length} questions answered
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  {questions.length - answeredCount} questions are still unanswered.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
              {sa.goBack}
            </Button>
            <Button
              onClick={() => {
                setShowSubmitConfirm(false);
                handleSubmit();
              }}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  Submitting...
                </>
              ) : (
                sa.submitAssessment
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
