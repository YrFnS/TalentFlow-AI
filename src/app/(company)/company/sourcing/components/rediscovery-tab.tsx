'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import CandidateCard from './candidate-card';
import type { PastCandidate, SourcingJob } from './types';

interface RediscoveryTabProps {
  tr: Record<string, string>;
  formatDate: (dateStr: string) => string;
  getAvailabilityBadge: (
    availability: PastCandidate['availability'],
  ) => React.ReactNode;
}

export default function RediscoveryTab({
  tr,
  formatDate,
  getAvailabilityBadge,
}: RediscoveryTabProps) {
  const [searchSkills, setSearchSkills] = useState('');
  const [searchExpMin, setSearchExpMin] = useState('');
  const [searchExpMax, setSearchExpMax] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PastCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [jobs, setJobs] = useState<SourcingJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<PastCandidate[]>([]);
  const [hasRecommended, setHasRecommended] = useState(false);

  const [selectedCandidate, setSelectedCandidate] =
    useState<PastCandidate | null>(null);
  const [engagementJobId, setEngagementJobId] = useState('none');
  const [engagementMessage, setEngagementMessage] = useState('');
  const [engagingCandidateId, setEngagingCandidateId] = useState<string | null>(
    null,
  );

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const response = await fetch('/api/jobs?status=OPEN', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to load jobs'));
      }
      const payload = await response.json();
      const records = Array.isArray(payload) ? payload : payload.jobs || [];
      setJobs(
        records
          .filter((job: SourcingJob) => job.status === 'OPEN')
          .map((job: SourcingJob) => ({
            id: job.id,
            title: job.title,
            status: job.status,
          })),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load jobs');
    } finally {
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function handleSearch() {
    setSearching(true);
    setHasSearched(true);
    try {
      const response = await apiFetch('/api/talent-rediscovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: searchSkills,
          experienceMin: searchExpMin || undefined,
          experienceMax: searchExpMax || undefined,
          location: searchLocation,
          jobTitle: searchJobTitle,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to search candidates'),
        );
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data.candidates) ? data.candidates : []);
    } catch (error) {
      setSearchResults([]);
      toast.error(
        error instanceof Error ? error.message : 'Unable to search candidates',
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleRecommend() {
    if (!selectedJobId) {
      toast.error(tr.noJobSelected || 'Select a job first');
      return;
    }

    setRecommending(true);
    setHasRecommended(true);
    try {
      const response = await apiFetch('/api/talent-rediscovery/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to generate recommendations'),
        );
      }
      const data = await response.json();
      setRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : [],
      );
      toast.success(
        data.recommendations?.length
          ? tr.recommendSuccess || 'Recommendations generated'
          : 'No eligible previous candidates matched this role',
      );
    } catch (error) {
      setRecommendations([]);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to generate recommendations',
      );
    } finally {
      setRecommending(false);
    }
  }

  function openReEngagement(candidate: PastCandidate) {
    setSelectedCandidate(candidate);
    setEngagementJobId(selectedJobId || 'none');
    setEngagementMessage('');
  }

  async function handleReEngage() {
    if (!selectedCandidate) return;
    setEngagingCandidateId(selectedCandidate.id);
    try {
      const response = await apiFetch('/api/talent-rediscovery/re-engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          jobId: engagementJobId === 'none' ? undefined : engagementJobId,
          message: engagementMessage || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to contact candidate'),
        );
      }
      const data = await response.json();
      toast.success(
        data.emailSent
          ? tr.reEngageSuccess || 'Candidate contacted successfully'
          : 'Candidate notified in TalentFlow; email delivery failed',
      );
      setSelectedCandidate(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to contact candidate',
      );
    } finally {
      setEngagingCandidateId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            {tr.searchCandidates || 'Search previous candidates'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="rediscovery-skills">
                {tr.skillsLabel || 'Skills'}
              </Label>
              <Input
                id="rediscovery-skills"
                placeholder={tr.skillsPlaceholder || 'React, TypeScript, SQL'}
                value={searchSkills}
                onChange={(event) => setSearchSkills(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rediscovery-title">Job title</Label>
              <Input
                id="rediscovery-title"
                placeholder="Product designer"
                value={searchJobTitle}
                onChange={(event) => setSearchJobTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rediscovery-min">Minimum experience</Label>
              <Input
                id="rediscovery-min"
                type="number"
                min={0}
                max={80}
                value={searchExpMin}
                onChange={(event) => setSearchExpMin(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rediscovery-max">Maximum experience</Label>
              <Input
                id="rediscovery-max"
                type="number"
                min={0}
                max={80}
                value={searchExpMax}
                onChange={(event) => setSearchExpMax(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-4">
              <Label htmlFor="rediscovery-location">
                {tr.locationLabel || 'Location'}
              </Label>
              <Input
                id="rediscovery-location"
                placeholder={tr.locationPlaceholder || 'Baghdad, Remote, Dubai'}
                value={searchLocation}
                onChange={(event) => setSearchLocation(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => void handleSearch()}
                disabled={searching}
              >
                {searching ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="me-2 h-4 w-4" />
                )}
                {tr.search || 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Search results</h2>
            <span className="text-sm text-muted-foreground">
              {searchResults.length}
            </span>
          </div>
          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No eligible previous candidates matched these criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                  tr={tr}
                  formatDate={formatDate}
                  getAvailabilityBadge={getAvailabilityBadge}
                  onReEngage={openReEngagement}
                  busy={engagingCandidateId === candidate.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Recommend previous candidates for a job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    jobsLoading ? 'Loading jobs…' : 'Select an open job'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void loadJobs()}
              disabled={jobsLoading}
              aria-label="Refresh jobs"
            >
              <RefreshCw
                className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              onClick={() => void handleRecommend()}
              disabled={recommending || !selectedJobId}
            >
              {recommending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="me-2 h-4 w-4" />
              )}
              Recommend
            </Button>
          </div>

          {hasRecommended &&
            (recommendations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No eligible candidates were found. Candidates already hired or
                already applied to this job are excluded.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {recommendations.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    tr={tr}
                    formatDate={formatDate}
                    getAvailabilityBadge={getAvailabilityBadge}
                    onReEngage={openReEngagement}
                    busy={engagingCandidateId === candidate.id}
                  />
                ))}
              </div>
            ))}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedCandidate)}
        onOpenChange={(open) => {
          if (!open && !engagingCandidateId) setSelectedCandidate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Re-engage {selectedCandidate?.name || 'candidate'}
            </DialogTitle>
            <DialogDescription>
              This creates an in-app notification, sends an email through the
              configured provider, and records the outreach in engagement history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Opportunity</Label>
              <Select
                value={engagementJobId}
                onValueChange={setEngagementJobId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General opportunity</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="engagement-message">Message</Label>
              <Textarea
                id="engagement-message"
                rows={5}
                maxLength={4000}
                placeholder="Leave blank to use a professional default message."
                value={engagementMessage}
                onChange={(event) => setEngagementMessage(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCandidate(null)}
              disabled={Boolean(engagingCandidateId)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleReEngage()}
              disabled={Boolean(engagingCandidateId)}
            >
              {engagingCandidateId ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="me-2 h-4 w-4" />
              )}
              Send outreach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
