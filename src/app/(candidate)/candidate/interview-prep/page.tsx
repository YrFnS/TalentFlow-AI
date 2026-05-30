// @ts-nocheck
'use client'

import React, { useState } from 'react';
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
} from 'lucide-react';

const upcomingInterviews: {
  id: number;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  type: string;
  typeColor: string;
}[] = [];

const behavioralQuestions: string[] = [];

const technicalQuestions: string[] = [];

const interviewTips: {
  icon: typeof Search;
  title: string;
  tip: string;
  gradient: string;
}[] = [];

const previousSessions: { id: number; date: string; type: string; score: number; duration: string }[] = [];

export default function InterviewPrepPage() {
  const { t } = useI18n();
  const [interviewType, setInterviewType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [expandedBehavioral, setExpandedBehavioral] = useState(false);
  const [expandedTechnical, setExpandedTechnical] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingInterviews.map((interview) => (
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
                  <Badge variant="secondary" className={`text-[10px] border-0 ${interview.typeColor}`}>
                    {interview.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {interview.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {interview.time}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs h-8"
                >
                  <Play className="w-3 h-3 me-1" />
                  {t.interviewPrep.startPrep}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
                <SelectTrigger>
                  <SelectValue placeholder={t.interviewPrep.selectType} />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder={t.interviewPrep.selectDifficulty} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">{t.interviewPrep.junior}</SelectItem>
                  <SelectItem value="midLevel">{t.interviewPrep.midLevel}</SelectItem>
                  <SelectItem value="senior">{t.interviewPrep.senior}</SelectItem>
                  <SelectItem value="staff">{t.interviewPrep.staff}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4 me-2" />
            {t.interviewPrep.startMock}
          </Button>
        </div>
      </Card>

      {/* Common Questions Bank */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.questionsBank}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Behavioral Questions */}
          <Card className="border-border/50">
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => setExpandedBehavioral(!expandedBehavioral)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-500" />
                  <CardTitle className="text-sm font-semibold">
                    {t.interviewPrep.behavioral} ({behavioralQuestions.length})
                  </CardTitle>
                </div>
                {expandedBehavioral ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedBehavioral && (
              <CardContent className="pt-0 space-y-2">
                {behavioralQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{q}</p>
                    <Button size="sm" variant="ghost" className="shrink-0 h-7 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30">
                      <Sparkles className="w-3 h-3 me-1" />
                      {t.interviewPrep.practiceWithAI}
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Technical Questions */}
          <Card className="border-border/50">
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => setExpandedTechnical(!expandedTechnical)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-teal-500" />
                  <CardTitle className="text-sm font-semibold">
                    {t.interviewPrep.technical} ({technicalQuestions.length})
                  </CardTitle>
                </div>
                {expandedTechnical ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedTechnical && (
              <CardContent className="pt-0 space-y-2">
                {technicalQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{q}</p>
                    <Button size="sm" variant="ghost" className="shrink-0 h-7 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30">
                      <Sparkles className="w-3 h-3 me-1" />
                      {t.interviewPrep.practiceWithAI}
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Interview Tips */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.tips}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {interviewTips.map((tip, i) => {
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

      {/* Previous Sessions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.interviewPrep.previousSessions}</h2>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground">{t.interviewPrep.date}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground">{t.interviewPrep.type}</th>
                    <th className="text-center p-3 text-xs font-medium text-muted-foreground">{t.interviewPrep.score}</th>
                    <th className="text-start p-3 text-xs font-medium text-muted-foreground">{t.interviewPrep.duration}</th>
                    <th className="text-end p-3 text-xs font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {previousSessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm">{session.date}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px] border-0 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                          {session.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className={`w-3 h-3 ${session.score >= 80 ? 'text-emerald-500 fill-emerald-500' : session.score >= 70 ? 'text-amber-500 fill-amber-500' : 'text-red-500 fill-red-500'}`} />
                          <span className="text-sm font-medium">{session.score}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{session.duration}</td>
                      <td className="p-3 text-end">
                        <Button size="sm" variant="ghost" className="text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 h-7">
                          {t.interviewPrep.review}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
