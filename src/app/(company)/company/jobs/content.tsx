'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Briefcase,
  Calendar,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Job = {
  id: string;
  title: string;
  jobType: string;
  status: string;
  location: string | null;
  isRemote: boolean;
  openings: number;
  createdAt: string;
  _count: { applications: number };
};

const statuses = ['all', 'OPEN', 'DRAFT', 'PAUSED', 'CLOSED'] as const;
const statusStyle: Record<string, string> = {
  OPEN: 'bg-emerald-500/10 text-emerald-700',
  DRAFT: 'bg-muted text-muted-foreground',
  PAUSED: 'bg-amber-500/10 text-amber-700',
  CLOSED: 'bg-destructive/10 text-destructive',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export default function JobsPage() {
  const { user, validateSession } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statuses)[number]>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [error, setError] = useState('');
  const [archiving, setArchiving] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/jobs', { cache: 'no-store' });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to load jobs'));
      setJobs(await response.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER'].includes(user?.role || '');
  const filtered = useMemo(() => jobs.filter((job) => {
    const matchesStatus = status === 'all' || job.status === status;
    const term = query.trim().toLowerCase();
    return matchesStatus && (!term || job.title.toLowerCase().includes(term) || job.location?.toLowerCase().includes(term));
  }), [jobs, query, status]);

  const counts = useMemo(() => Object.fromEntries(statuses.map((item) => [item, item === 'all' ? jobs.length : jobs.filter((job) => job.status === item).length])), [jobs]);

  async function archive(job: Job) {
    if (!confirm(`Archive “${job.title}”? Candidates will no longer see this job.`)) return;
    setArchiving(job.id);
    try {
      const response = await apiFetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to archive job'));
      setJobs((current) => current.filter((item) => item.id !== job.id));
      toast.success('Job archived');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to archive job');
    } finally {
      setArchiving(null);
    }
  }

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index} className="h-44 animate-pulse bg-muted/40" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Jobs</h1><p className="mt-1 text-sm text-muted-foreground">Create openings, review activity, and manage publication status.</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}Refresh</Button>{canEdit && <Button asChild size="sm"><Link href="/company/jobs/create"><Plus className="me-2 h-4 w-4" />Create job</Link></Button>}</div>
      </div>

      {error && <Card className="border-destructive/40"><CardContent className="flex items-center justify-between gap-3 p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button></CardContent></Card>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" placeholder="Search jobs or locations" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="flex flex-col gap-2 sm:flex-row"><Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}><TabsList className="flex-wrap">{statuses.map((item) => <TabsTrigger key={item} value={item}>{item === 'all' ? 'All' : item[0] + item.slice(1).toLowerCase()} ({counts[item]})</TabsTrigger>)}</TabsList></Tabs><div className="flex rounded-md border"><Button size="icon" variant={view === 'grid' ? 'secondary' : 'ghost'} onClick={() => setView('grid')}><LayoutGrid className="h-4 w-4" /></Button><Button size="icon" variant={view === 'table' ? 'secondary' : 'ghost'} onClick={() => setView('table')}><List className="h-4 w-4" /></Button></div></div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Briefcase className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">No jobs found</p><p className="mt-1 text-sm text-muted-foreground">{query || status !== 'all' ? 'Change the filters to see more jobs.' : 'Create the first job for this company.'}</p>{canEdit && <Button asChild className="mt-4"><Link href="/company/jobs/create"><Plus className="me-2 h-4 w-4" />Create job</Link></Button>}</CardContent></Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => <Card key={job.id} className="transition-shadow hover:shadow-md"><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{job.title}</h2><p className="mt-1 text-xs text-muted-foreground">Created {new Date(job.createdAt).toLocaleDateString()}</p></div><Badge className={statusStyle[job.status]}>{job.status}</Badge></div><div className="space-y-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location || 'No location'}{job.isRemote ? ' · Remote' : ''}</p><p className="flex items-center gap-2"><Users className="h-4 w-4" />{job._count.applications} applicants · {job.openings} openings</p><p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{job.jobType.replaceAll('_', ' ')}</p></div><div className="flex justify-end gap-2 border-t pt-3"><Button asChild variant="ghost" size="sm"><Link href={`/company/jobs/${job.id}`}><Eye className="me-2 h-4 w-4" />View</Link></Button>{canEdit && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void archive(job)} disabled={archiving === job.id}>{archiving === job.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Archive className="me-2 h-4 w-4" />}Archive</Button>}</div></CardContent></Card>)}
        </div>
      ) : (
        <Card><Table><TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Status</TableHead><TableHead>Location</TableHead><TableHead>Applicants</TableHead><TableHead>Created</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((job) => <TableRow key={job.id}><TableCell><p className="font-medium">{job.title}</p><p className="text-xs text-muted-foreground">{job.jobType.replaceAll('_', ' ')}</p></TableCell><TableCell><Badge className={statusStyle[job.status]}>{job.status}</Badge></TableCell><TableCell>{job.location || '—'}{job.isRemote ? ' · Remote' : ''}</TableCell><TableCell>{job._count.applications}</TableCell><TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell><TableCell><div className="flex justify-end"><Button asChild variant="ghost" size="icon"><Link href={`/company/jobs/${job.id}`}><Eye className="h-4 w-4" /></Link></Button>{canEdit && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => void archive(job)}><Archive className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></Card>
      )}
    </div>
  );
}
