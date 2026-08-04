'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Interview = {
  id: string;
  title: string;
  description: string | null;
  job: string;
  company: string;
  deadline: string;
  status: string;
  questions: unknown[];
  maxRetakes: number;
  timePerQuestion: number;
  completedAt: string | null;
  responses: Array<{
    questionIndex: number;
    duration: number;
    aiScore: number | null;
    aiFeedback: string | null;
    retakes: number;
  }>;
};

type Payload = { pending: Interview[]; completed: Interview[] };

const empty: Payload = { pending: [], completed: [] };

export default function VideoInterviewCandidateContent() {
  const [data, setData] = useState<Payload>(empty);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/candidate/video-interviews', {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Unable to load video interviews');
      setData(await response.json());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load video interviews',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Video interviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review asynchronous interview assignments and completed feedback.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Recording submission is not enabled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The previous timer-only simulation was removed. Recording will be
              enabled after secure media capture, upload, retention, and consent
              controls are implemented.
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

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Pending assignments</h2>
          <Badge variant="secondary">{data.pending.length}</Badge>
        </div>

        {data.pending.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No pending video interviews</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New assignments will appear here when a recruiter sends one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.pending.map((interview) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{interview.title}</CardTitle>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {interview.company} · {interview.job}
                      </p>
                    </div>
                    <Badge>{interview.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {interview.description && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {interview.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Questions</p>
                      <p className="mt-1 font-semibold">
                        {interview.questions.length}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="mt-1 font-semibold">
                        {interview.deadline
                          ? new Date(interview.deadline).toLocaleDateString()
                          : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" disabled>
                    <Video className="me-2 h-4 w-4" />
                    Recording unavailable
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Completed interviews</h2>
          <Badge variant="secondary">{data.completed.length}</Badge>
        </div>

        {data.completed.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No completed video interviews yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.completed.map((interview) => {
              const scores = interview.responses
                .map((response) => response.aiScore)
                .filter((score): score is number => score !== null);
              const average = scores.length
                ? Math.round(
                    scores.reduce((total, score) => total + score, 0) /
                      scores.length,
                  )
                : null;

              return (
                <Card key={interview.id}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{interview.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {interview.company} · {interview.job}
                      </p>
                      {interview.completedAt && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Completed{' '}
                          {new Date(interview.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {average === null ? 'No score' : `${average}%`}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
