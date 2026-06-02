// @ts-nocheck
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Users,
  Send,
  TrendingUp,
  Plus,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockCampaigns, mockJobs } from './mock-data';
import CreateCampaignDialog from './create-campaign-dialog';
import type { SourcingCampaign, CampaignStatus } from './types';

interface CampaignsTabProps {
  ts: Record<string, string>;
  commonCancel: string;
}

export default function CampaignsTab({ ts, commonCancel }: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<SourcingCampaign[]>(mockCampaigns);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignJobId, setNewCampaignJobId] = useState('');
  const [newCampaignSkills, setNewCampaignSkills] = useState('');
  const [newCampaignExperience, setNewCampaignExperience] = useState('');
  const [newCampaignLocation, setNewCampaignLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const campaignStats = useMemo(() => ({
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    totalMatched: campaigns.reduce((sum, c) => sum + c.matchedCount, 0),
    contacted: campaigns.reduce((sum, c) => sum + c.contactedCount, 0),
    responded: campaigns.reduce((sum, c) => sum + c.respondedCount, 0),
  }), [campaigns]);

  const resetCampaignForm = () => {
    setNewCampaignName('');
    setNewCampaignJobId('');
    setNewCampaignSkills('');
    setNewCampaignExperience('');
    setNewCampaignLocation('');
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sourcing-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName,
          jobId: newCampaignJobId || null,
          criteria: {
            skills: newCampaignSkills.split(',').map(s => s.trim()).filter(Boolean),
            experience: newCampaignExperience ? parseInt(newCampaignExperience) : undefined,
            location: newCampaignLocation || undefined,
          },
          companyId: 'demo-company',
        }),
      });
      const data = await res.json();
      const job = mockJobs.find(j => j.id === newCampaignJobId);
      const newCampaign: SourcingCampaign = {
        id: data.id || `c${Date.now()}`,
        name: newCampaignName,
        jobId: newCampaignJobId || null,
        jobTitle: job?.title || null,
        criteria: {
          skills: newCampaignSkills.split(',').map(s => s.trim()).filter(Boolean),
          experience: newCampaignExperience ? parseInt(newCampaignExperience) : undefined,
          location: newCampaignLocation || undefined,
        },
        matchedCount: data.matchedCount || 0,
        contactedCount: 0,
        respondedCount: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      toast.success(ts.campaignCreated);
      setCreateDialogOpen(false);
      resetCampaignForm();
    } catch {
      toast.error(ts.campaignCreateError);
    } finally {
      setCreating(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'complete' | 'delete') => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      if (action !== 'delete') {
        await fetch(`/api/sourcing-campaigns/${campaignId}?XTransformPort=3000`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action === 'pause' ? 'PAUSED' : action === 'resume' ? 'ACTIVE' : 'COMPLETED',
          }),
        });
      } else {
        await fetch(`/api/sourcing-campaigns/${campaignId}?XTransformPort=3000`, { method: 'DELETE' });
      }

      setCampaigns(prev => {
        if (action === 'delete') return prev.filter(c => c.id !== campaignId);
        return prev.map(c =>
          c.id === campaignId
            ? { ...c, status: action === 'pause' ? 'PAUSED' : action === 'resume' ? 'ACTIVE' as CampaignStatus : 'COMPLETED' as CampaignStatus }
            : c
        );
      });

      const messages: Record<string, string> = {
        pause: ts.campaignPaused,
        resume: ts.campaignResumed,
        complete: ts.campaignCompleted,
        delete: ts.campaignDeleted,
      };
      toast.success(messages[action]);
    } catch {
      toast.error(ts.campaignUpdateError);
    }
  };

  const statusBadgeClass: Record<CampaignStatus, string> = {
    ACTIVE: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
    PAUSED: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
    COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ts.activeCampaigns}</p>
                <p className="text-xl font-bold">{campaignStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ts.totalMatched}</p>
                <p className="text-xl font-bold">{campaignStats.totalMatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ts.contacted}</p>
                <p className="text-xl font-bold">{campaignStats.contacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ts.responded}</p>
                <p className="text-xl font-bold">{campaignStats.responded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
        >
          <Plus className="h-4 w-4 me-2" />
          {ts.createCampaign}
        </Button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((campaign, idx) => (
          <Card key={campaign.id} className="border-border/50 card-animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{campaign.name}</p>
                  {campaign.jobTitle && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="h-3 w-3" />
                      {campaign.jobTitle}
                    </p>
                  )}
                </div>
                <Badge className={cn('text-[10px]', statusBadgeClass[campaign.status])}>
                  {ts[`status${campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}` as string] || campaign.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {campaign.criteria.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] border-slate-200 text-blue-700">
                    {skill}
                  </Badge>
                ))}
                {campaign.criteria.experience && (
                  <Badge variant="outline" className="text-[10px] border-amber-200 dark:border-amber-800 text-amber-700">
                    {campaign.criteria.experience}+ yrs
                  </Badge>
                )}
                {campaign.criteria.location && (
                  <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-2.5 w-2.5 me-0.5" />{campaign.criteria.location}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold text-blue-600">{campaign.matchedCount}</p>
                  <p className="text-[10px] text-muted-foreground">{ts.matchedCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold text-amber-600">{campaign.contactedCount}</p>
                  <p className="text-[10px] text-muted-foreground">{ts.contactedCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold text-emerald-600">{campaign.respondedCount}</p>
                  <p className="text-[10px] text-muted-foreground">{ts.respondedCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {campaign.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-amber-200 dark:border-amber-800 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                    onClick={() => handleCampaignAction(campaign.id, 'pause')}
                  >
                    <Pause className="h-3 w-3 me-1" />{ts.pauseCampaign}
                  </Button>
                )}
                {campaign.status === 'PAUSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                    onClick={() => handleCampaignAction(campaign.id, 'resume')}
                  >
                    <Play className="h-3 w-3 me-1" />{ts.resumeCampaign}
                  </Button>
                )}
                {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    onClick={() => handleCampaignAction(campaign.id, 'complete')}
                  >
                    <CheckCircle2 className="h-3 w-3 me-1" />{ts.completeCampaign}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 ms-auto"
                  onClick={() => handleCampaignAction(campaign.id, 'delete')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        newCampaignName={newCampaignName}
        setNewCampaignName={setNewCampaignName}
        newCampaignJobId={newCampaignJobId}
        setNewCampaignJobId={setNewCampaignJobId}
        newCampaignSkills={newCampaignSkills}
        setNewCampaignSkills={setNewCampaignSkills}
        newCampaignExperience={newCampaignExperience}
        setNewCampaignExperience={setNewCampaignExperience}
        newCampaignLocation={newCampaignLocation}
        setNewCampaignLocation={setNewCampaignLocation}
        creating={creating}
        commonCancel={commonCancel}
        ts={ts}
        onCreate={handleCreateCampaign}
      />
    </div>
  );
}
