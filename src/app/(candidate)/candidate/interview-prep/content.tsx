'use client';
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Calendar,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Play,
  Star,
  Code,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Search,
  Target,
  Award,
  BarChart3,
  Inbox,
} from 'lucide-react';

export default function InterviewPrepPage() {
  const { t } = useI18n();
  const [interviewType, setInterviewType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [expandedBehavioral, setExpandedBehavioral] = useState(false);
  const [expandedTechnical, setExpandedTechnical] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const res = await fetch('/api/candidate/interviews');
        if (res.ok) {
          const data = await res.json();
          setUpcomingInterviews(data);
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  const [interviewTips, setInterviewTips] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.interviewPrep.title}</h1>
          <p className="text-sm text-muted-foreground">{t.interviewPrep.subtitle}</p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.upcoming}</h2>
        {upcomingInterviews.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No upcoming interviews scheduled.</p>
              <p className="mt-1 text-xs text-muted-foreground">Keep applying to jobs and your interviews will appear here.</p>
              <Button variant="outline" className="mt-3" asChild>
                <a href="/candidate/jobs">{t.candidate.searchJobs}</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingInterviews.map((interview: any) => (
              <Card key={interview.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{interview.jobTitle}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {interview.company}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] border-0 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                      {interview.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{interview.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interview.time}</span>
                  </div>
                  <Button size="sm" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs h-8">
                    <Play className="w-3 h-3 me-1" />{t.interviewPrep.startPrep}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Mock Interview */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/30 dark:to-emerald-950/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.interviewPrep.mockInterview}</h2>
              <p className="text-xs text-muted-foreground">Practice with AI-powered feedback</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">{t.interviewPrep.selectType}</label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger><SelectValue placeholder={t.interviewPrep.selectType} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{t.interviewPrep.technical}</SelectItem>
                  <SelectItem value="behavioral">{t.interviewPrep.behavioral}</SelectItem>
                  <SelectItem value="caseStudy">{t.interviewPrep.caseStudy}</SelectItem>
                  <SelectItem value="systemDesign">{t.interviewPrep.systemDesign}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">{t.interviewPrep.selectDifficulty}</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue placeholder={t.interviewPrep.selectDifficulty} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">{t.interviewPrep.junior}</SelectItem>
                  <SelectItem value="midLevel">{t.interviewPrep.midLevel}</SelectItem>
                  <SelectItem value="senior">{t.interviewPrep.senior}</SelectItem>
                  <SelectItem value="staff">{t.interviewPrep.staff}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg">
            <Sparkles className="w-4 h-4 me-2" />{t.interviewPrep.startMock}
          </Button>
        </div>
      </Card>

      {/* Common Questions Bank - Empty state with AI placeholder */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.questionsBank}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-500" />
                <CardTitle className="text-sm font-semibold">{t.interviewPrep.behavioral}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Generate behavioral questions with AI</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                  <a href="/candidate/ai-tools"><Sparkles className="w-3.5 h-3.5" />Generate</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-teal-500" />
                <CardTitle className="text-sm font-semibold">{t.interviewPrep.technical}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Generate technical questions with AI</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                  <a href="/candidate/ai-tools"><Sparkles className="w-3.5 h-3.5" />Generate</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interview Tips */}
      {interviewTips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t.interviewPrep.tips}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {interviewTips.map((tip: any, i: number) => {
              const Icon = tip.icon;
              return (
                <Card key={i} className="border-border/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 space-y-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${tip.gradient} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-sm">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Previous Sessions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.previousSessions}</h2>
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No previous interview sessions yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Start a mock interview to see your session history and scores.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
