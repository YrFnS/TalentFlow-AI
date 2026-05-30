// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import {
  Globe,
  Eye,
  MousePointerClick,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Briefcase,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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
  isActive: boolean;
  postingCount: number;
  config?: string;
  createdAt: string;
}

interface JobBoardPosting {
  id: string;
  jobId: string;
  boardId: string;
  status: 'PENDING' | 'POSTED' | 'FAILED' | 'EXPIRED' | 'REMOVED';
  externalId: string | null;
  externalUrl: string | null;
  postedAt: string | null;
  expiresAt: string | null;
  views: number;
  clicks: number;
  applications: number;
  error: string | null;
  createdAt: string;
  board: { id: string; name: string; logo: string | null; isActive: boolean };
  job: { id: string; title: string };
}

interface Job {
  id: string;
  title: string;
  status: string;
}

interface AnalyticsData {
  totalPostings: number;
  totalViews: number;
  totalClicks: number;
  totalApplications: number;
  byBoard: {
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
  }[];
}

const BOARD_COLORS: Record<string, string> = {
  LinkedIn: 'bg-blue-600',
  Indeed: 'bg-indigo-600',
  Glassdoor: 'bg-green-600',
  ZipRecruiter: 'bg-purple-600',
  AngelList: 'bg-rose-600',
  Bayt: 'bg-amber-600',
  NaukriGulf: 'bg-cyan-600',
  Dice: 'bg-red-600',
  Monster: 'bg-teal-600',
  SimplyHired: 'bg-orange-600',
};

const BOARD_REACH: Record<string, number> = {
  LinkedIn: 81000000,
  Indeed: 300000000,
  Glassdoor: 57000000,
  ZipRecruiter: 20000000,
  AngelList: 8000000,
  Bayt: 40000000,
  NaukriGulf: 15000000,
  Dice: 5000000,
  Monster: 29000000,
  SimplyHired: 10000000,
};

function getBoardInitials(name: string): string {
  if (!name) return '?';
  const words = name.split(/[\s/]+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getStatusBadge(status: string, t: Record<string, string>) {
  switch (status) {
    case 'POSTED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
          <CheckCircle2 className="w-3 h-3 me-1" />
          {t.posted}
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0">
          <Clock className="w-3 h-3 me-1" />
          {t.pending}
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-0">
          <XCircle className="w-3 h-3 me-1" />
          {t.failed}
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0">
          <AlertTriangle className="w-3 h-3 me-1" />
          {t.expired}
        </Badge>
      );
    case 'REMOVED':
      return (
        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0">
          <XCircle className="w-3 h-3 me-1" />
          {t.removed}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function JobBoardsContent() {
  const { t } = useI18n();
  const jt = t.jobBoards as Record<string, string>;

  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [postings, setPostings] = useState<JobBoardPosting[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const companyId = 'demo-company-id';

  const fetchData = useCallback(async () => {
    try {
      // Seed boards first if needed
      await fetch('/api/job-boards/seed', { method: 'POST' });

      const [boardsRes, analyticsRes] = await Promise.all([
        fetch('/api/job-boards'),
        fetch(`/api/job-boards/analytics?companyId=${companyId}`),
      ]);

      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.boards || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Fetch jobs for the company
      const jobsRes = await fetch(`/api/jobs?companyId=${companyId}`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobList = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
        setJobs(jobList.filter((j: Job) => j.status === 'OPEN' || j.status === 'DRAFT'));
      }

      // Fetch all postings
      const allPostings: JobBoardPosting[] = [];
      for (const job of jobs.slice(0, 20)) {
        const pRes = await fetch(`/api/jobs/${job.id}/postings`);
        if (pRes.ok) {
          const pData = await pRes.json();
          allPostings.push(...(pData.postings || []));
        }
      }
      setPostings(allPostings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, jobs]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Seed boards first
      await fetch('/api/job-boards/seed', { method: 'POST' });

      const [boardsRes, analyticsRes] = await Promise.all([
        fetch('/api/job-boards'),
        fetch(`/api/job-boards/analytics?companyId=${companyId}`),
      ]);

      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.boards || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Fetch jobs
      try {
        const jobsRes = await fetch(`/api/jobs?companyId=${companyId}`);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const jobList = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
          setJobs(jobList.filter((j: Job) => j.status === 'OPEN' || j.status === 'DRAFT'));
        }
      } catch {
        // Jobs fetch failed, continue with empty list
      }

      setLoading(false);
    };

    init();
  }, [companyId]);

  // Re-fetch postings when jobs list is available
  useEffect(() => {
    if (jobs.length === 0) return;

    const fetchPostings = async () => {
      const allPostings: JobBoardPosting[] = [];
      for (const job of jobs.slice(0, 20)) {
        try {
          const pRes = await fetch(`/api/jobs/${job.id}/postings`);
          if (pRes.ok) {
            const pData = await pRes.json();
            allPostings.push(...(pData.postings || []));
          }
        } catch {
          // Continue
        }
      }
      setPostings(allPostings);
    };

    fetchPostings();
  }, [jobs]);

  const handlePostToBoards = async () => {
    if (!selectedJob) {
      toast.error(jt.selectJob);
      return;
    }
    if (selectedBoardIds.length === 0) {
      toast.error(jt.selectBoards);
      return;
    }

    setPosting(true);
    setPostingProgress(0);

    try {
      const totalSteps = selectedBoardIds.length;
      let completed = 0;

      // Simulate progressive posting
      const progressInterval = setInterval(() => {
        completed = Math.min(completed + 1, totalSteps);
        setPostingProgress(Math.round((completed / totalSteps) * 100));
        if (completed >= totalSteps) {
          clearInterval(progressInterval);
        }
      }, 1200);

      const res = await fetch(`/api/jobs/${selectedJob}/post-to-boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardIds: selectedBoardIds }),
      });

      clearInterval(progressInterval);
      setPostingProgress(100);

      if (res.ok) {
        toast.success(jt.postedSuccessfully);
        setDialogOpen(false);
        setSelectedBoardIds([]);
        setSelectedJob('');
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(jt.postingFailed);
      }
    } catch {
      toast.error(jt.postingFailed);
    } finally {
      setPosting(false);
      setPostingProgress(0);
    }
  };

  const toggleBoardSelection = (boardId: string) => {
    setSelectedBoardIds((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  const filteredPostings = postings.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.board.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const activeBoards = boards.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{jt.title}</h1>
          <p className="text-muted-foreground mt-1">{jt.subtitle}</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          <Globe className="w-4 h-4" />
          {jt.postToBoards}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover-lift animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{jt.activeBoards}</p>
                <p className="text-2xl font-bold">{activeBoards}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{jt.totalPostings}</p>
                <p className="text-2xl font-bold">{analytics?.totalPostings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-950">
                <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{jt.totalViews}</p>
                <p className="text-2xl font-bold">{formatNumber(analytics?.totalViews || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{jt.totalApplications}</p>
                <p className="text-2xl font-bold">{analytics?.totalApplications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Board Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{jt.boardAnalytics}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {boards.map((board) => {
            const boardAnalytics = analytics?.byBoard.find(
              (b) => b.boardId === board.id
            );
            const colorClass = BOARD_COLORS[board.name] || 'bg-gray-600';
            const reach = BOARD_REACH[board.name] || 0;

            return (
              <Card
                key={board.id}
                className="card-hover-lift animate-fade-in-up cursor-pointer transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg text-white text-sm font-bold ${colorClass}`}
                    >
                      {getBoardInitials(board.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{board.name}</h3>
                        {board.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {jt.estimatedReach}: {formatNumber(reach)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{jt.views}</p>
                      <p className="text-sm font-semibold">
                        {boardAnalytics?.views || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{jt.clicks}</p>
                      <p className="text-sm font-semibold">
                        {boardAnalytics?.clicks || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{jt.applications}</p>
                      <p className="text-sm font-semibold">
                        {boardAnalytics?.applications || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {boardAnalytics?.postingCount || 0} {jt.postings || 'postings'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Posting History Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{jt.postingHistory}</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 h-9 w-48"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder={jt.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.common.all}</SelectItem>
                <SelectItem value="POSTED">{jt.posted}</SelectItem>
                <SelectItem value="PENDING">{jt.pending}</SelectItem>
                <SelectItem value="FAILED">{jt.failed}</SelectItem>
                <SelectItem value="EXPIRED">{jt.expired}</SelectItem>
                <SelectItem value="REMOVED">{jt.removed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredPostings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">{jt.noPostings}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.jobs.jobTitle}</TableHead>
                      <TableHead>{jt.selectBoards}</TableHead>
                      <TableHead>{jt.status}</TableHead>
                      <TableHead className="text-center">{jt.views}</TableHead>
                      <TableHead className="text-center">{jt.clicks}</TableHead>
                      <TableHead className="text-center">{jt.applications}</TableHead>
                      <TableHead>{t.interviews.date}</TableHead>
                      <TableHead>{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPostings.map((posting) => {
                      const boardColor = BOARD_COLORS[posting.board.name] || 'bg-gray-600';
                      return (
                        <TableRow key={posting.id}>
                          <TableCell className="font-medium">
                            {posting.job.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center justify-center w-6 h-6 rounded text-white text-[10px] font-bold ${boardColor}`}
                              >
                                {getBoardInitials(posting.board.name)}
                              </div>
                              <span className="text-sm">{posting.board.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(posting.status, jt)}</TableCell>
                          <TableCell className="text-center">{posting.views}</TableCell>
                          <TableCell className="text-center">{posting.clicks}</TableCell>
                          <TableCell className="text-center">{posting.applications}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {posting.postedAt
                              ? new Date(posting.postedAt).toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {posting.externalUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                asChild
                              >
                                <a
                                  href={posting.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {t.common.view}
                                </a>
                              </Button>
                            )}
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
      </div>

      {/* Post to Boards Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              {jt.postToBoards}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Job Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{jt.selectJob}</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder={jt.selectJob} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.length > 0 ? (
                    jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-jobs" disabled>
                      No open jobs available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Board Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{jt.selectBoards}</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                {boards.map((board) => {
                  const colorClass = BOARD_COLORS[board.name] || 'bg-gray-600';
                  const reach = BOARD_REACH[board.name] || 0;
                  const isSelected = selectedBoardIds.includes(board.id);

                  return (
                    <div
                      key={board.id}
                      onClick={() => toggleBoardSelection(board.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                          : 'border-border hover:border-teal-300'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleBoardSelection(board.id)}
                      />
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded text-white text-[10px] font-bold shrink-0 ${colorClass}`}
                      >
                        {getBoardInitials(board.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{board.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatNumber(reach)} {jt.estimatedReach?.split(' ')[0] || 'reach'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedBoardIds.length > 0 && (
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  {selectedBoardIds.length} board(s) selected
                </p>
              )}
            </div>

            {/* Progress */}
            {posting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  {jt.posting}
                </div>
                <Progress value={postingProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={posting}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handlePostToBoards}
              disabled={posting || !selectedJob || selectedBoardIds.length === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {jt.posting}
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  {jt.postNow}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
