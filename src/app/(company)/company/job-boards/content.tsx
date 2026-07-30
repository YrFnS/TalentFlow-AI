'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  Link2,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface JobBoard {
  id: string;
  name: string;
  logo: string | null;
  apiBaseUrl: string | null;
  integrationStatus: 'CONNECTED' | 'MANUAL';
  companyPostingCount: number;
}

interface Job {
  id: string;
  title: string;
  status: string;
  location: string | null;
  publishedAt: string | null;
}

interface Posting {
  id: string;
  jobId: string;
  boardId: string;
  status: 'PENDING' | 'POSTED' | 'FAILED' | 'EXPIRED' | 'REMOVED';
  externalUrl: string | null;
  postedAt: string | null;
  expiresAt: string | null;
  views: number;
  clicks: number;
  applications: number;
  error: string | null;
  updatedAt: string;
  board: { id: string; name: string; logo: string | null };
  job: { id: string; title: string };
}

interface Analytics {
  totalPostings: number;
  totalViews: number;
  totalClicks: number;
  totalApplications: number;
  byBoard: Array<{
    boardId: string;
    boardName: string;
    postingCount: number;
    views: number;
    clicks: number;
    applications: number;
    posted: number;
    pending: number;
    failed: number;
    expired: number;
    removed: number;
  }>;
}

const emptyAnalytics: Analytics = {
  totalPostings: 0,
  totalViews: 0,
  totalClicks: 0,
  totalApplications: 0,
  byBoard: [],
};

const statusClass: Record<Posting['status'], string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  POSTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  FAILED: 'bg-destructive/10 text-destructive',
  EXPIRED: 'bg-muted text-muted-foreground',
  REMOVED: 'bg-muted text-muted-foreground',
};

export default function JobBoardsContent() {
  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>(emptyAnalytics);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);

  const [manualPosting, setManualPosting] = useState<Posting | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [updatingPostingId, setUpdatingPostingId] = useState<string | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/job-boards', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load job boards'),
        );
      }
      const data = await response.json();
      setBoards(Array.isArray(data.boards) ? data.boards : []);
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setPostings(Array.isArray(data.postings) ? data.postings : []);
      setAnalytics(data.analytics || emptyAnalytics);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to load job boards',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredPostings = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return postings.filter((posting) => {
      const matchesStatus =
        statusFilter === 'ALL' || posting.status === statusFilter;
      const matchesSearch =
        !query ||
        posting.job.title.toLocaleLowerCase().includes(query) ||
        posting.board.name.toLocaleLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [postings, searchQuery, statusFilter]);

  function toggleBoard(boardId: string, checked: boolean) {
    setSelectedBoardIds((current) =>
      checked
        ? [...new Set([...current, boardId])]
        : current.filter((id) => id !== boardId),
    );
  }

  async function preparePostings() {
    if (!selectedJob) {
      toast.error('Select an open job');
      return;
    }
    if (selectedBoardIds.length === 0) {
      toast.error('Select at least one job board');
      return;
    }

    setPreparing(true);
    try {
      const response = await apiFetch(
        `/api/jobs/${selectedJob}/post-to-boards`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardIds: selectedBoardIds }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to prepare postings'),
        );
      }
      const data = await response.json();
      toast.success(data.message || 'Posting records prepared');
      setPrepareDialogOpen(false);
      setSelectedJob('');
      setSelectedBoardIds([]);
      await load(true);
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to prepare postings',
      );
    } finally {
      setPreparing(false);
    }
  }

  async function updatePosting(
    posting: Posting,
    status: 'POSTED' | 'FAILED' | 'REMOVED',
    url?: string,
  ) {
    setUpdatingPostingId(posting.id);
    try {
      const response = await apiFetch(`/api/jobs/${posting.jobId}/postings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postingId: posting.id,
          status,
          externalUrl: url || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to update posting'),
        );
      }
      toast.success(
        status === 'POSTED'
          ? 'Posting marked as live'
          : status === 'REMOVED'
            ? 'Posting marked as removed'
            : 'Posting marked as failed',
      );
      setManualPosting(null);
      setExternalUrl('');
      await load(true);
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to update posting',
      );
    } finally {
      setUpdatingPostingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
        <Card className="h-72 animate-pulse bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Job boards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track external job-board postings without pretending an integration
            exists. Connected publishing can be enabled board by board later.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setPrepareDialogOpen(true)}
            disabled={jobs.length === 0 || boards.length === 0}
          >
            <Plus className="me-2 h-4 w-4" />
            Prepare posting
          </Button>
        </div>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Manual tracking mode</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecting a board creates a tenant-scoped tracking record. No
              external API is called until a verified board integration is
              configured. After publishing manually, add the public URL and mark
              the record as posted.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Posting records',
            value: analytics.totalPostings,
            icon: FileCheck2,
          },
          { label: 'Views', value: analytics.totalViews, icon: Eye },
          {
            label: 'Clicks',
            value: analytics.totalClicks,
            icon: MousePointerClick,
          },
          {
            label: 'Attributed applications',
            value: analytics.totalApplications,
            icon: BarChart3,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {boards.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No job-board catalog is configured. A platform administrator must
              provision it through a trusted migration or Prisma seed.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{board.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {board.companyPostingCount} company posting records
                    </p>
                  </div>
                  <Badge
                    variant={
                      board.integrationStatus === 'CONNECTED'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {board.integrationStatus === 'CONNECTED'
                      ? 'Connected'
                      : 'Manual'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base">Posting records</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder="Search job or board"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['ALL', 'PENDING', 'POSTED', 'FAILED', 'EXPIRED', 'REMOVED'].map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'ALL' ? 'All statuses' : status}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPostings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No posting records match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Metrics</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPostings.map((posting) => (
                    <TableRow key={posting.id}>
                      <TableCell>
                        <p className="font-medium">{posting.job.title}</p>
                        {posting.error && (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                            {posting.error}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{posting.board.name}</TableCell>
                      <TableCell>
                        <Badge className={statusClass[posting.status]}>
                          {posting.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {posting.views} views · {posting.clicks} clicks ·{' '}
                          {posting.applications} applications
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(posting.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {posting.externalUrl && (
                            <Button asChild variant="ghost" size="icon">
                              <a
                                href={posting.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Open external posting"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {posting.status !== 'POSTED' &&
                            posting.status !== 'REMOVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setManualPosting(posting);
                                  setExternalUrl(posting.externalUrl || '');
                                }}
                              >
                                <Link2 className="me-1.5 h-3.5 w-3.5" />
                                Mark posted
                              </Button>
                            )}
                          {posting.status !== 'REMOVED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={updatingPostingId === posting.id}
                              onClick={() =>
                                void updatePosting(posting, 'REMOVED')
                              }
                              aria-label="Mark posting removed"
                            >
                              {updatingPostingId === posting.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={prepareDialogOpen} onOpenChange={setPrepareDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare job-board tracking</DialogTitle>
            <DialogDescription>
              This creates manual tracking records only. It does not publish to
              external services.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Published job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an open job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                      {job.location ? ` · ${job.location}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Boards</Label>
              <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                {boards.map((board) => (
                  <label
                    key={board.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedBoardIds.includes(board.id)}
                      onCheckedChange={(checked) =>
                        toggleBoard(board.id, checked === true)
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {board.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {board.integrationStatus === 'CONNECTED'
                          ? 'Connected'
                          : 'Manual tracking'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrepareDialogOpen(false)}
              disabled={preparing}
            >
              Cancel
            </Button>
            <Button onClick={() => void preparePostings()} disabled={preparing}>
              {preparing ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="me-2 h-4 w-4" />
              )}
              Create tracking records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(manualPosting)}
        onOpenChange={(open) => {
          if (!open && !updatingPostingId) setManualPosting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark manual posting as live</DialogTitle>
            <DialogDescription>
              Confirm that {manualPosting?.job.title || 'the job'} was published
              to {manualPosting?.board.name || 'the selected board'} and store its
              public URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="external-posting-url">Public posting URL</Label>
            <Input
              id="external-posting-url"
              type="url"
              placeholder="https://example.com/jobs/123"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualPosting(null)}
              disabled={Boolean(updatingPostingId)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!manualPosting) return;
                void updatePosting(manualPosting, 'POSTED', externalUrl);
              }}
              disabled={Boolean(updatingPostingId) || !externalUrl.trim()}
            >
              {updatingPostingId ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" />
              )}
              Mark as posted
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
