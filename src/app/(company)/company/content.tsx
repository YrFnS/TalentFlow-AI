'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type Dashboard = {
  company: { name: string } | null;
  stats: {
    activeJobs: number;
    totalApplications: number;
    interviewsToday: number;
    hiredThisMonth: number;
  };
  trend: Array<{ date: string; applications: number }>;
  funnel: Array<{ stage: string; count: number }>;
  recentApplications: Array<{
    id: string;
    status: string;
    matchScore: number | null;
    candidate: { user: { name: string; image?: string | null } };
    job: { title: string };
  }>;
  upcomingInterviews: Array<{
    id: string;
    type: string;
    scheduledAt: string;
    candidate: { name: string; image?: string | null };
    jobTitle: string;
    interviewers: string[];
  }>;
};

const empty: Dashboard = {
  company: null,
  stats: { activeJobs: 0, totalApplications: 0, interviewsToday: 0, hiredThisMonth: 0 },
  trend: [],
  funnel: [],
  recentApplications: [],
  upcomingInterviews: [],
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function CompanyDashboard() {
  const { user, validateSession } = useAuth();
  const [data, setData] = useState<Dashboard>(empty);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load dashboard');
      setData(await response.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const maxTrend = Math.max(1, ...data.trend.map((item) => item.applications));
  const maxFunnel = Math.max(1, ...data.funnel.map((item) => item.count));
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user?.role || '');
  const cards = useMemo(
    () => [
      { label: 'Active jobs', value: data.stats.activeJobs, icon: Briefcase },
      { label: 'Applications', value: data.stats.totalApplications, icon: FileText },
      { label: 'Interviews today', value: data.stats.interviewsToday, icon: Video },
      { label: 'Hired this month', value: data.stats.hiredThisMonth, icon: UserCheck },
    ],
    [data.stats],
  );

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-80" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1><p className="mt-1 text-sm text-muted-foreground">Live hiring activity for {data.company?.name || user?.companyName || 'your company'}.</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}Refresh</Button>{canCreate && <Button asChild size="sm"><Link href="/company/jobs/create"><Plus className="me-2 h-4 w-4" />Post job</Link></Button>}</div>
      </div>

      {error && <Card className="border-destructive/40"><CardContent className="flex items-center justify-between gap-3 p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button></CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div></CardContent></Card>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle className="text-base">Applications · last 7 days</CardTitle></CardHeader><CardContent>{data.trend.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No application activity yet.</p> : <div className="flex h-48 items-end gap-2">{data.trend.map((item) => <div key={item.date} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-medium">{item.applications}</span><div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max(4, (item.applications / maxTrend) * 140)}px` }} /><span className="text-[10px] text-muted-foreground">{new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span></div>)}</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Hiring funnel</CardTitle></CardHeader><CardContent className="space-y-4">{data.funnel.map((item) => <div key={item.stage}><div className="mb-1 flex items-center justify-between text-sm"><span>{item.stage.replaceAll('_', ' ')}</span><span className="font-medium">{item.count}</span></div><Progress value={(item.count / maxFunnel) * 100} /></div>)}{data.funnel.every((item) => item.count === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No candidates in the funnel.</p>}</CardContent></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Recent applications</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/company/applications">View all<ArrowUpRight className="ms-1 h-3 w-3" /></Link></Button></CardHeader><CardContent>{data.recentApplications.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Applications will appear here.</p> : <div className="space-y-3">{data.recentApplications.map((application) => <div key={application.id} className="flex items-center gap-3 rounded-lg border p-3"><Avatar><AvatarImage src={application.candidate.user.image || undefined} /><AvatarFallback>{initials(application.candidate.user.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{application.candidate.user.name}</p><p className="truncate text-xs text-muted-foreground">{application.job.title}</p></div><Badge variant="outline">{application.status}</Badge></div>)}</div>}</CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Upcoming interviews</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/company/interviews">View all<ArrowUpRight className="ms-1 h-3 w-3" /></Link></Button></CardHeader><CardContent>{data.upcomingInterviews.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center"><Calendar className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No interviews scheduled this week.</p></div> : <div className="space-y-3">{data.upcomingInterviews.map((interview) => <div key={interview.id} className="flex items-center gap-3 rounded-lg border p-3"><Avatar><AvatarImage src={interview.candidate.image || undefined} /><AvatarFallback>{initials(interview.candidate.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{interview.candidate.name}</p><p className="truncate text-xs text-muted-foreground">{interview.jobTitle} · {new Date(interview.scheduledAt).toLocaleString()}</p></div><Badge variant="secondary">{interview.type}</Badge></div>)}</div>}</CardContent></Card>
      </div>

      <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div><div><p className="font-medium">Recruiting workspace</p><p className="text-sm text-muted-foreground">Manage jobs, candidates, interviews, and offers from one place.</p></div></div><Button asChild variant="outline"><Link href="/company/pipeline">Open pipeline</Link></Button></CardContent></Card>
    </div>
  );
}
