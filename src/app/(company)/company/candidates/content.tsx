// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Search,
  UserSearch,
  Filter,
  Sparkles,
  Mail,
  MapPin,
  Briefcase,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  User,
  FileText,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface CandidateProfile {
  id: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string | null;
  experienceYears: number | null;
  currentTitle: string | null;
  availability: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null };
  applications: Array<{
    id: string;
    status: string;
    job: { id: string; title: string };
  }>;
}

export default function CandidatesPage() {
  const { t } = useI18n();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterAvailability, setFilterAvailability] = useState<string>('all');

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.currentTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesAvailability =
      filterAvailability === 'all' || c.availability === filterAvailability;
    return matchesSearch && matchesAvailability;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const handleBulkAction = async (action: 'shortlist' | 'reject') => {
    // In a real app, this would call an API
    setSelectedIds(new Set());
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return '';
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return '';
    if (score >= 85) return 'bg-emerald-50';
    if (score >= 70) return 'bg-slate-50';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  const parseSkills = (skills: string | null): string[] => {
    if (!skills) return [];
    try {
      return JSON.parse(skills);
    } catch {
      return skills.split(',').map((s) => s.trim());
    }
  };

  const getMatchScore = (candidate: CandidateProfile): number | null => {
    // Generate a pseudo-random but consistent score based on candidate data
    if (candidate.applications.length > 0) {
      // Use a deterministic score based on candidate id hash
      const hash = candidate.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return 65 + (hash % 30);
    }
    return null;
  };

  const availabilityLabels: Record<string, string> = {
    open: 'Open to Work',
    employed: 'Employed',
    not_looking: 'Not Looking',
  };

  const availabilityColors: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700',
    employed: 'bg-teal-100 text-blue-700',
    not_looking: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.candidates.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {candidates.length} candidates in your talent pool
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('shortlist')}
                className="text-emerald-600 border-emerald-300 dark:border-emerald-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 me-1.5" />
                {t.candidates.shortlist}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                className="text-destructive border-red-300 dark:border-red-800"
              >
                <XCircle className="w-3.5 h-3.5 me-1.5" />
                {t.candidates.reject}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <Select value={filterAvailability} onValueChange={setFilterAvailability}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open to Work</SelectItem>
            <SelectItem value="employed">Employed</SelectItem>
            <SelectItem value="not_looking">Not Looking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Candidates Table */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <CardContent className="py-12 text-center">
            <UserSearch className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No candidates found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try adjusting your search terms' : 'Candidates will appear here when they apply to your jobs'}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xs">Candidate</TableHead>
                <TableHead className="text-xs">{t.candidates.matchScore}</TableHead>
                <TableHead className="text-xs">{t.candidates.skills}</TableHead>
                <TableHead className="text-xs">{t.candidates.experience}</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Applications</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => {
                const matchScore = getMatchScore(candidate);
                const skills = parseSkills(candidate.skills);
                return (
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer hover:bg-accent/30"
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(candidate.id)}
                        onCheckedChange={() => toggleSelect(candidate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-teal-100 text-blue-700 text-xs">
                            {candidate.user.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{candidate.user.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.currentTitle || candidate.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {matchScore ? (
                        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold w-fit', getScoreBg(matchScore), getScoreColor(matchScore))}>
                          <Sparkles className="w-3 h-3" />
                          {matchScore}%
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {candidate.experienceYears ? `${candidate.experienceYears} yrs` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', availabilityColors[candidate.availability || 'open'] || '')}
                      >
                        {availabilityLabels[candidate.availability || 'open'] || candidate.availability}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{candidate.applications.length}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedCandidate(candidate); setSheetOpen(true); }}>
                            <User className="w-4 h-4 me-2" />View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 me-2" />Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 me-2" />View Resume
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-emerald-600">
                            <CheckCircle2 className="w-4 h-4 me-2" />{t.candidates.shortlist}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="w-4 h-4 me-2" />{t.candidates.reject}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Candidate Profile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] p-0">
          {selectedCandidate && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-teal-100 text-blue-700">
                      {selectedCandidate.user.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-start">
                    <p className="font-semibold">{selectedCandidate.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.currentTitle || 'No title'}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.contactInfo}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCandidate.user.email}</span>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">📞</span>
                        <span>{selectedCandidate.phone}</span>
                      </div>
                    )}
                    {selectedCandidate.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedCandidate.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* AI Match Score */}
                {getMatchScore(selectedCandidate) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.aiMatchScore}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-blue-600">{getMatchScore(selectedCandidate)}%</span>
                        <Badge className="bg-teal-100 text-blue-700">High Match</Badge>
                      </div>
                      <Progress value={getMatchScore(selectedCandidate)!} className="h-1.5" />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Skills */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.skills}</h4>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(selectedCandidate.skills).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Experience */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.experience}</h4>
                  <p className="text-sm">
                    {selectedCandidate.experienceYears
                      ? `${selectedCandidate.experienceYears} years of professional experience`
                      : 'Experience not specified'}
                  </p>
                </div>

                <Separator />

                {/* Application History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.candidates.applicationHistory}</h4>
                  {selectedCandidate.applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.applications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{app.job.title}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {app.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Bio */}
                {selectedCandidate.bio && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.bio}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  <CheckCircle2 className="w-4 h-4 me-2" />
                  {t.candidates.shortlist}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <XCircle className="w-4 h-4 me-2" />
                  {t.candidates.reject}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
