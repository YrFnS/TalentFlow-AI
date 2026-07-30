'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Eye,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  UserRoundCheck,
  UserSearch,
  Users,
} from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CandidateApplication = {
  id: string;
  status: string;
  matchScore: number | null;
  appliedAt: string;
  job: {
    id: string;
    title: string;
  };
};

type Candidate = {
  id: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string | null;
  experienceYears: number | null;
  currentTitle: string | null;
  availability: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  applications: CandidateApplication[];
};

type StatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
};

const availabilityLabels: Record<string, string> = {
  open: 'Open to work',
  employed: 'Employed',
  not_looking: 'Not looking',
  'not-looking': 'Not looking',
  'open-offers': 'Open to offers',
};

const statusStyles: Record<string, string> = {
  APPLIED: 'bg-slate-500/10 text-slate-700',
  SCREENING: 'bg-blue-500/10 text-blue-700',
  INTERVIEW: 'bg-amber-500/10 text-amber-700',
  OFFERED: 'bg-violet-500/10 text-violet-700',
  HIRED: 'bg-emerald-500/10 text-emerald-700',
  REJECTED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-muted text-muted-foreground',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function parseSkills(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Support legacy comma-separated values.
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function bestMatch(candidate: Candidate): number | null {
  const scores = candidate.applications
    .map((application) => application.matchScore)
    .filter((score): score is number => score !== null);
  return scores.length ? Math.max(...scores) : null;
}

function latestApplication(candidate: Candidate): CandidateApplication | null {
  return candidate.applications[0] || null;
}

export default function CandidatesContent() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [selected, setSelected] = useState<Candidate | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/candidates', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load candidates'),
        );
      }
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to load candidates',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const normalizedAvailability = candidate.availability || 'open';
      if (
        availability !== 'all' &&
        normalizedAvailability !== availability
      ) {
        return false;
      }

      if (!term) return true;
      return (
        candidate.user.name.toLowerCase().includes(term) ||
        candidate.user.email.toLowerCase().includes(term) ||
        candidate.currentTitle?.toLowerCase().includes(term) ||
        candidate.location?.toLowerCase().includes(term) ||
        parseSkills(candidate.skills).some((skill) =>
          skill.toLowerCase().includes(term),
        )
      );
    });
  }, [availability, candidates, query]);

  const stats = useMemo(
    () => ({
      total: candidates.length,
      open: candidates.filter(
        (candidate) => (candidate.availability || 'open') === 'open',
      ).length,
      interviewing: candidates.filter((candidate) =>
        candidate.applications.some(
          (application) => application.status === 'INTERVIEW',
        ),
      ).length,
      hired: candidates.filter((candidate) =>
        candidate.applications.some(
          (application) => application.status === 'HIRED',
        ),
      ).length,
    }),
    [candidates],
  );

  const statCards: StatCard[] = [
    { label: 'Total candidates', value: stats.total, icon: Users },
    { label: 'Open to work', value: stats.open, icon: UserSearch },
    { label: 'Interviewing', value: stats.interviewing, icon: Briefcase },
    { label: 'Hired', value: stats.hired, icon: UserRoundCheck },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidates who applied to jobs in your company.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
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

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Search name, email, title, location, or skill"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All availability</SelectItem>
            <SelectItem value="open">Open to work</SelectItem>
            <SelectItem value="employed">Employed</SelectItem>
            <SelectItem value="not_looking">Not looking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <UserSearch className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No candidates found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Candidates appear here after applying to one of your jobs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Best AI match</TableHead>
                  <TableHead>Latest application</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((candidate) => {
                  const skills = parseSkills(candidate.skills);
                  const score = bestMatch(candidate);
                  const latest = latestApplication(candidate);

                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={candidate.user.image || undefined} />
                            <AvatarFallback>
                              {initials(candidate.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {candidate.user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {candidate.currentTitle || candidate.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {candidate.location || 'Not provided'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-64 flex-wrap gap-1">
                          {skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 3 && (
                            <Badge variant="outline">+{skills.length - 3}</Badge>
                          )}
                          {skills.length === 0 && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {score === null ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            {Math.round(score)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {latest ? (
                          <div>
                            <p className="text-sm font-medium">{latest.job.title}</p>
                            <Badge
                              className={`mt-1 ${statusStyles[latest.status] || ''}`}
                            >
                              {latest.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelected(candidate)}
                          aria-label={`View ${candidate.user.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.user.image || undefined} />
                    <AvatarFallback>{initials(selected.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selected.user.name}</SheetTitle>
                    <SheetDescription>
                      {selected.currentTitle || 'Candidate profile'}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted"
                    href={`mailto:${selected.user.email}`}
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{selected.user.email}</span>
                  </a>
                  <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    {selected.location || 'Location not provided'}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Availability</p>
                  <Badge className="mt-2" variant="secondary">
                    {availabilityLabels[selected.availability || 'open'] ||
                      selected.availability ||
                      'Open to work'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium">Experience</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.experienceYears === null
                      ? 'Not provided'
                      : `${selected.experienceYears} year${
                          selected.experienceYears === 1 ? '' : 's'
                        }`}
                  </p>
                </div>

                {selected.bio && (
                  <div>
                    <p className="text-sm font-medium">Profile summary</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {selected.bio}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {parseSkills(selected.skills).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {parseSkills(selected.skills).length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        No skills added.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Applications</p>
                  <div className="mt-2 space-y-2">
                    {selected.applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {application.job.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={statusStyles[application.status] || ''}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
