'use client';

import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Route,
  Briefcase,
  Building2,
  Calendar,
  Trophy,
  Target,
  Sparkles,
  Lightbulb,
  ArrowUpRight,
  Clock,
  Star,
  FileText,
  Inbox,
} from 'lucide-react';

export default function CareerPathPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
          <Route className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.careerPath.title}</h1>
          <p className="text-sm text-muted-foreground">{t.careerPath.subtitle}</p>
        </div>
      </div>

      {/* Current Position */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/30 dark:to-emerald-950/30 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-lg">{t.careerPath.currentPosition}</h2>
                <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">Current</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Update your profile to see your current position details.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Career Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">{t.careerPath.timeline}</CardTitle>
          <CardDescription>{t.careerPath.timelineDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No career timeline yet. Add your work experience to build your career path.</p>
            <Button variant="outline" className="mt-3" asChild>
              <a href="/candidate/profile">Add Experience</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Career Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-600" />
              {t.careerPath.shortTermGoals}
            </CardTitle>
            <CardDescription className="text-xs">1-2 {t.careerPath.years}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Target className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Set your short-term career goals.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              {t.careerPath.longTermGoals}
            </CardTitle>
            <CardDescription className="text-xs">3-5 {t.careerPath.years}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Target className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Set your long-term career goals.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills to Develop */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            {t.careerPath.skillsToDevelop}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Add skills to your profile to see personalized recommendations.</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href="/candidate/profile">Update Skills</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Career Insights */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/30 dark:to-emerald-950/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.careerPath.aiInsights}</h2>
              <p className="text-xs text-muted-foreground">{t.careerPath.aiInsightsDesc}</p>
            </div>
          </div>

          <div className="text-center py-8 rounded-xl border border-dashed border-border/50 bg-background/30">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Generate AI Career Insights</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Configure your AI provider to generate personalized career recommendations, role suggestions, and skill development paths.
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" asChild>
              <a href="/candidate/ai-tools">
                <Sparkles className="h-3.5 w-3.5" />
                Go to AI Tools
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
