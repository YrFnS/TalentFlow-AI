// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Calendar,
  Bookmark,
  Eye,
  Search,
  User,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  CheckCircle2,
  FileText,
  Star,
  Briefcase,
  Target,
  Award,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  user: { id: string; name: string; email: string; image: string | null } | null;
  profile: {
    id: string;
    phone: string | null;
    location: string | null;
    currentTitle: string | null;
    skills: string[];
    experienceYears: number | null;
    resumeUrl: string | null;
  } | null;
  stats: {
    applicationsSent: number;
    interviewsScheduled: number;
    savedJobs: number;
    profileViews: number;
  };
  applicationPipeline: { statusKey: string; count: number }[];
  recentActivity: {
    type: string;
    title: string;
    jobTitle: string;
    company: string;
    time: string;
    status: string;
  }[];
  recommendedJobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    match: number;
    posted: string;
    skills: string[];
  }[];
  profileCompleteness: number;
  profileSteps: { label: string; done: boolean }[];
}

const statConfigs = [
  { icon: Send, key: 'applicationsSent' },
  { icon: Calendar, key: 'interviewsScheduled' },
  { icon: Bookmark, key: 'savedJobs' },
  { icon: Eye, key: 'profileViews' },
];

const activityIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  applied: { icon: Send, color: 'text-blue-600 bg-blue-50' },
  interview: { icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  screening: { icon: FileText, color: 'text-slate-600 bg-slate-50' },
  saved: { icon: Bookmark, color: 'text-amber-600 bg-amber-50' },
  view: { icon: Eye, color: 'text-slate-600 bg-slate-50' },
};

export default function CandidateDashboard() {
  const { t, dir } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/candidate/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const statLabelMap: Record<string, string> = {
    applicationsSent: t.candidate.applicationsSent,
    interviewsScheduled: t.candidate.interviewsScheduled,
    savedJobs: t.candidate.savedJobs,
    profileViews: t.candidate.profileViews,
  };

  const pipelineLabelMap: Record<string, string> = {
    applied: t.candidate.applied,
    screening: t.candidate.screening,
    interview: t.candidate.interview,
    offered: t.candidate.offered,
    rejected: t.candidate.rejected,
  };

  const userName = data?.user?.name || '';
  const stats = data?.stats || { applicationsSent: 0, interviewsScheduled: 0, savedJobs: 0, profileViews: 0 };
  const pipeline = data?.applicationPipeline || [];
  const activities = data?.recentActivity || [];
  const recommendedJobs = data?.recommendedJobs || [];
  const profileCompleteness = data?.profileCompleteness || 0;
  const profileSteps = data?.profileSteps || [];

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {t.candidate.welcomeBack}, <span className="text-blue-600">{userName || t.candidate.welcomeBack.split(',')[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.candidate.recentActivity} — {t.dashboard.overview}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
            <Link href="/candidate/profile">
              <User className="h-4 w-4" />
              {t.candidate.updateProfile}
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/candidate/jobs">
              <Search className="h-4 w-4" />
              {t.candidate.searchJobs}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfigs.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof typeof stats] || 0;
          return (
            <Card key={stat.key} className="border border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {statLabelMap[stat.key]}
                    </p>
                    <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
                    {stat.key === 'profileViews' && value > 0 && (
                      <div className="mt-1 flex items-center text-xs text-emerald-600">
                        <TrendingUp className="h-3 w-3 me-1" />
                        +12% this week
                      </div>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Jobs */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">{t.candidate.recommendedJobs}</CardTitle>
                  <CardDescription>Based on your profile and preferences</CardDescription>
                </div>
                <Badge className="bg-blue-600 text-white border-0 text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No recommended jobs yet. Start exploring to find your match!</p>
                  <Button asChild className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/candidate/explore">{t.candidate.searchJobs}</Link>
                  </Button>
                </div>
              ) : (
                recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-card hover:bg-accent/50 hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                          {job.company.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {job.company}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{job.type}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {job.posted}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      {job.salary && (
                        <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-700 border-0">
                          {job.salary}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium text-slate-700">{job.match}%</span>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" asChild>
                          <Link href={`/candidate/jobs/${job.id}`}>{t.candidate.quickApply}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">{t.candidate.recentActivity}</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No recent activity yet. Start applying to jobs!</p>
                  <Button asChild className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/candidate/jobs">{t.candidate.searchJobs}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity, index) => {
                    const iconConfig = activityIconMap[activity.type] || activityIconMap.applied;
                    const Icon = iconConfig.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconConfig.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{activity.title} {activity.jobTitle}</p>
                          <p className="text-xs text-muted-foreground">{activity.company}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Application Status Pipeline */}
          <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">{t.candidate.applicationStatus}</CardTitle>
              <CardDescription>Mini pipeline overview</CardDescription>
            </CardHeader>
            <CardContent>
              {pipeline.length === 0 || pipeline.every(p => p.count === 0) ? (
                <div className="text-center py-6">
                  <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No applications yet</p>
                  <Button asChild size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/candidate/jobs">{t.candidate.searchJobs}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipeline.map((stage, i) => {
                    const total = pipeline.reduce((sum, s) => sum + s.count, 0);
                    const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${stage.statusKey === 'rejected' ? 'bg-red-400' : 'bg-blue-500'}`} />
                        <span className="text-sm flex-1">{pipelineLabelMap[stage.statusKey] || stage.statusKey}</span>
                        <span className="text-[10px] text-muted-foreground">{percentage}%</span>
                        <Badge variant="secondary" className="font-semibold text-xs">
                          {stage.count}
                        </Badge>
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Total Active</span>
                      <span className="font-semibold text-slate-900">{total}</span>
                    </div>
                    <Progress value={total > 0 ? 75 : 0} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Completeness */}
          <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">{t.candidate.profileCompleteness}</CardTitle>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Target className="h-3 w-3 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700">{profileCompleteness}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                    <circle cx="60" cy="60" r="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" fill="none" />
                    <circle
                      cx="60" cy="60" r="50"
                      stroke="#2563eb"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${profileCompleteness * 3.14} ${100 * 3.14}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
                <Progress value={profileCompleteness} className="h-2.5" />
                <div className="space-y-2 mt-3">
                  {profileSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={step.done ? '' : 'text-muted-foreground'}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/candidate/profile">{t.candidate.updateProfile}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">{t.candidate.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/jobs">
                  <Search className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.searchJobs}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/profile">
                  <User className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.updateProfile}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-10 border-dashed hover:bg-slate-50 hover:border-slate-300" size="sm">
                <Link href="/candidate/ai-tools">
                  <Sparkles className="h-4 w-4 text-slate-600" />
                  <span>{t.candidate.aiResumeAnalysis}</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
