'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
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
import type {
  CampaignStatus,
  SourcingCampaign,
  SourcingJob,
} from './types';

interface CampaignsTabProps {
  ts: Record<string, string>;
  commonCancel: string;
}

const statusStyles: Record<CampaignStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PAUSED: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  COMPLETED: 'bg-muted text-muted-foreground',
};

export default function CampaignsTab({
  ts,
  commonCancel,
}: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<SourcingCampaign[]>([]);
  const [jobs, setJobs] = useState<SourcingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignJobId, setNewCampaignJobId] = useState('none');
  const [newCampaignSkills, setNewCampaignSkills] = useState('');
  const [newCampaignExperienceMin, setNewCampaignExperienceMin] = useState('');
  const [newCampaignExperienceMax, setNewCampaignExperienceMax] = useState('');
  const [newCampaignLocation, setNewCampaignLocation] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);

  const campaignStats = useMemo(
    () => ({
      active: campaigns.filter((campaign) => campaign.status === 'ACTIVE').length,
      totalMatched: campaigns.reduce(
        (sum, campaign) => sum + campaign.matchedCount,
        0,
      ),
      contacted: campaigns.reduce(
        (sum, campaign) => sum + campaign.contactedCount,
        0,
      ),
      responded: campaigns.reduce(
        (sum, campaign) => sum + campaign.respondedCount,
        0,
      ),
    }),
    [campaigns],
  );

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/sourcing-campaigns', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load campaigns'),
        );
      }
      const data = await response.json();
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to load campaigns',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetCampaignForm() {
    setNewCampaignName('');
    setNewCampaignJobId('none');
    setNewCampaignSkills('');
    setNewCampaignExperienceMin('');
    setNewCampaignExperienceMax('');
    setNewCampaignLocation('');
  }

  async function handleCreateCampaign() {
    if (!newCampaignName.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await apiFetch('/api/sourcing-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName,
          jobId: newCampaignJobId === 'none' ? null : newCampaignJobId,
          criteria: {
            skills: newCampaignSkills,
            experienceMin: newCampaignExperienceMin || undefined,
            experienceMax: newCampaignExperienceMax || undefined,
            location: newCampaignLocation || undefined,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to create campaign'),
        );
      }
      const data = await response.json();
      setCampaigns((current) => [data.campaign, ...current]);
      toast.success(ts.campaignCreated || 'Campaign created');
      setCreateDialogOpen(false);
      resetCampaignForm();
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to create campaign',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCampaignAction(
    campaign: SourcingCampaign,
    action: 'pause' | 'resume' | 'complete' | 'delete',
  ) {
    if (
      action === 'delete' &&
      !window.confirm(`Delete “${campaign.name}”? This cannot be undone.`)
    ) {
      return;
    }

    setBusyCampaignId(campaign.id);
    try {
      const response = await apiFetch(
        `/api/sourcing-campaigns/${campaign.id}`,
        action === 'delete'
          ? { method: 'DELETE' }
          : {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status:
                  action === 'pause'
                    ? 'PAUSED'
                    : action === 'resume'
                      ? 'ACTIVE'
                      : 'COMPLETED',
              }),
            },
      );
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to update campaign'),
        );
      }

      if (action === 'delete') {
        setCampaigns((current) =>
          current.filter((item) => item.id !== campaign.id),
        );
      } else {
        const data = await response.json();
        setCampaigns((current) =>
          current.map((item) =>
            item.id === campaign.id ? data.campaign : item,
          ),
        );
      }
      toast.success(
        action === 'delete'
          ? ts.campaignDeleted || 'Campaign deleted'
          : ts.campaignUpdateSuccess || 'Campaign updated',
      );
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to update campaign',
      );
    } finally {
      setBusyCampaignId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {ts.campaignsTab || 'Sourcing campaigns'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Match former applicants using deterministic profile and application
            data. Campaigns never cross company boundaries.
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
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {ts.createCampaign || 'Create campaign'}
          </Button>
        </div>
      </div>

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
            label: ts.activeCampaigns || 'Active campaigns',
            value: campaignStats.active,
            icon: Target,
          },
          {
            label: ts.totalMatched || 'Matched candidates',
            value: campaignStats.totalMatched,
            icon: Users,
          },
          {
            label: ts.contacted || 'Contacted',
            value: campaignStats.contacted,
            icon: TrendingUp,
          },
          {
            label: ts.responded || 'Responded',
            value: campaignStats.responded,
            icon: CheckCircle2,
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

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No sourcing campaigns yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a campaign to match eligible former applicants from your
              company’s own history.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => {
            const busy = busyCampaignId === campaign.id;
            return (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {campaign.name}
                      </CardTitle>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {campaign.jobTitle || 'General talent pool'}
                      </p>
                    </div>
                    <Badge className={statusStyles[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border p-3">
                      <p className="text-xl font-bold">{campaign.matchedCount}</p>
                      <p className="text-[10px] text-muted-foreground">Matched</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xl font-bold">
                        {campaign.contactedCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Contacted
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xl font-bold">
                        {campaign.respondedCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Responded
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {campaign.criteria.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                    {campaign.criteria.location && (
                      <Badge variant="outline" className="text-[10px]">
                        {campaign.criteria.location}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                    {campaign.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleCampaignAction(campaign, 'pause')
                        }
                        disabled={busy}
                      >
                        <Pause className="me-1.5 h-3.5 w-3.5" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'PAUSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleCampaignAction(campaign, 'resume')
                        }
                        disabled={busy}
                      >
                        <Play className="me-1.5 h-3.5 w-3.5" />
                        Resume
                      </Button>
                    )}
                    {campaign.status !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleCampaignAction(campaign, 'complete')
                        }
                        disabled={busy}
                      >
                        <CheckCircle2 className="me-1.5 h-3.5 w-3.5" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        void handleCampaignAction(campaign, 'delete')
                      }
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="me-1.5 h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create sourcing campaign</DialogTitle>
            <DialogDescription>
              Candidates are matched only from this company’s previous
              applications. Current hires and existing applicants to the selected
              job are excluded.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="campaign-name">Campaign name</Label>
              <Input
                id="campaign-name"
                maxLength={160}
                value={newCampaignName}
                onChange={(event) => setNewCampaignName(event.target.value)}
                placeholder="Backend engineering alumni"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Target job</Label>
              <Select
                value={newCampaignJobId}
                onValueChange={setNewCampaignJobId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General talent campaign</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} · {job.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="campaign-skills">Skills</Label>
              <Input
                id="campaign-skills"
                value={newCampaignSkills}
                onChange={(event) => setNewCampaignSkills(event.target.value)}
                placeholder="Node.js, PostgreSQL, AWS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-exp-min">Minimum experience</Label>
              <Input
                id="campaign-exp-min"
                type="number"
                min={0}
                max={80}
                value={newCampaignExperienceMin}
                onChange={(event) =>
                  setNewCampaignExperienceMin(event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-exp-max">Maximum experience</Label>
              <Input
                id="campaign-exp-max"
                type="number"
                min={0}
                max={80}
                value={newCampaignExperienceMax}
                onChange={(event) =>
                  setNewCampaignExperienceMax(event.target.value)
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="campaign-location">Location</Label>
              <Input
                id="campaign-location"
                value={newCampaignLocation}
                onChange={(event) => setNewCampaignLocation(event.target.value)}
                placeholder="Remote"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              {commonCancel || 'Cancel'}
            </Button>
            <Button
              onClick={() => void handleCreateCampaign()}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="me-2 h-4 w-4" />
              )}
              Create campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
