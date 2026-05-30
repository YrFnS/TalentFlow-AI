// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Sparkles,
  Loader2,
  Users,
  Send,
  Mail,
  MailOpen,
  MousePointerClick,
  CalendarDays,
  Briefcase,
  MapPin,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// ===== Types =====
interface PastCandidate {
  id: string;
  name: string;
  currentTitle: string;
  location: string;
  experienceYears: number;
  skills: string[];
  matchScore: number;
  lastActive: string;
  matchReasons: string[];
  appliedBefore: string;
  availability: 'available' | 'not_available' | 'open_to_work';
}

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

interface SourcingCampaign {
  id: string;
  name: string;
  jobId: string | null;
  jobTitle: string | null;
  criteria: {
    skills: string[];
    experience?: number;
    location?: string;
  };
  matchedCount: number;
  contactedCount: number;
  respondedCount: number;
  status: CampaignStatus;
  createdAt: string;
}

type EngagementEventType = 'EMAIL_SENT' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'INTERVIEW_SCHEDULED' | 'APPLIED' | 'VIEWED_PROFILE';

interface EngagementEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  type: EngagementEventType;
  campaignName: string | null;
  details: string;
  date: string;
}

// ===== Mock Data =====
const mockPastCandidates: PastCandidate[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    currentTitle: 'Senior Full-Stack Developer',
    location: 'San Francisco, CA',
    experienceYears: 8,
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    matchScore: 92,
    lastActive: '2025-02-15',
    matchReasons: ['React Expert', '8+ Years Exp', 'Previously Interviewed'],
    appliedBefore: 'Senior Frontend Engineer — Jan 2025',
    availability: 'open_to_work',
  },
  {
    id: '2',
    name: 'Priya Patel',
    currentTitle: 'Product Designer Lead',
    location: 'Remote',
    experienceYears: 6,
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'CSS'],
    matchScore: 87,
    lastActive: '2025-01-28',
    matchReasons: ['Design Systems', 'Remote Ready', 'High Interview Score'],
    appliedBefore: 'UX Designer — Nov 2024',
    availability: 'available',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    currentTitle: 'DevOps Engineer',
    location: 'Austin, TX',
    experienceYears: 5,
    skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],
    matchScore: 84,
    lastActive: '2025-03-01',
    matchReasons: ['DevOps Skills', 'AWS Certified', 'Cultural Fit'],
    appliedBefore: 'Cloud Engineer — Dec 2024',
    availability: 'available',
  },
  {
    id: '4',
    name: 'Sophie Chen',
    currentTitle: 'Data Scientist',
    location: 'New York, NY',
    experienceYears: 4,
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Visualization'],
    matchScore: 79,
    lastActive: '2024-12-20',
    matchReasons: ['ML Experience', 'Python Skills', 'Strong Portfolio'],
    appliedBefore: 'ML Engineer — Sep 2024',
    availability: 'not_available',
  },
  {
    id: '5',
    name: 'Omar Al-Farsi',
    currentTitle: 'Backend Developer',
    location: 'Dubai, UAE',
    experienceYears: 7,
    skills: ['Java', 'Spring Boot', 'Microservices', 'Redis', 'MongoDB'],
    matchScore: 76,
    lastActive: '2025-02-05',
    matchReasons: ['Backend Expert', '7+ Years Exp', 'International'],
    appliedBefore: 'Senior Backend Dev — Oct 2024',
    availability: 'open_to_work',
  },
  {
    id: '6',
    name: 'Emma Williams',
    currentTitle: 'Engineering Manager',
    location: 'London, UK',
    experienceYears: 10,
    skills: ['Leadership', 'Agile', 'React', 'Node.js', 'Strategy'],
    matchScore: 73,
    lastActive: '2025-01-10',
    matchReasons: ['Leadership', 'Tech Background', 'Previously Offered'],
    appliedBefore: 'Tech Lead — Aug 2024',
    availability: 'available',
  },
];

const mockCampaigns: SourcingCampaign[] = [
  {
    id: 'c1',
    name: 'Senior Frontend Engineer Search',
    jobId: 'j1',
    jobTitle: 'Senior Frontend Engineer',
    criteria: { skills: ['React', 'TypeScript', 'Next.js'], experience: 5, location: 'Remote' },
    matchedCount: 24,
    contactedCount: 18,
    respondedCount: 9,
    status: 'ACTIVE',
    createdAt: '2025-02-20',
  },
  {
    id: 'c2',
    name: 'Product Designer Pipeline',
    jobId: 'j2',
    jobTitle: 'Product Designer',
    criteria: { skills: ['Figma', 'User Research', 'Design Systems'], experience: 3, location: 'San Francisco' },
    matchedCount: 15,
    contactedCount: 12,
    respondedCount: 6,
    status: 'ACTIVE',
    createdAt: '2025-02-15',
  },
  {
    id: 'c3',
    name: 'DevOps Talent Pool',
    jobId: null,
    jobTitle: null,
    criteria: { skills: ['Kubernetes', 'Docker', 'CI/CD', 'AWS'], experience: 4 },
    matchedCount: 32,
    contactedCount: 20,
    respondedCount: 11,
    status: 'PAUSED',
    createdAt: '2025-01-10',
  },
  {
    id: 'c4',
    name: 'Data Science Interns 2025',
    jobId: 'j3',
    jobTitle: 'Data Science Intern',
    criteria: { skills: ['Python', 'Machine Learning', 'SQL'], experience: 0, location: 'New York' },
    matchedCount: 45,
    contactedCount: 30,
    respondedCount: 22,
    status: 'COMPLETED',
    createdAt: '2024-11-01',
  },
];

const mockEngagementEvents: EngagementEvent[] = [
  { id: 'e1', candidateId: '1', candidateName: 'Alex Rivera', type: 'EMAIL_SENT', campaignName: 'Senior Frontend Engineer Search', details: 'Initial outreach email sent', date: '2025-03-03T10:30:00Z' },
  { id: 'e2', candidateId: '2', candidateName: 'Priya Patel', type: 'EMAIL_OPENED', campaignName: 'Product Designer Pipeline', details: 'Email opened on mobile', date: '2025-03-03T09:15:00Z' },
  { id: 'e3', candidateId: '3', candidateName: 'Marcus Johnson', type: 'EMAIL_CLICKED', campaignName: 'DevOps Talent Pool', details: 'Clicked job link in email', date: '2025-03-02T16:45:00Z' },
  { id: 'e4', candidateId: '4', candidateName: 'Sophie Chen', type: 'INTERVIEW_SCHEDULED', campaignName: 'Data Science Interns 2025', details: 'Phone screen scheduled for March 10', date: '2025-03-02T14:20:00Z' },
  { id: 'e5', candidateId: '5', candidateName: 'Omar Al-Farsi', type: 'APPLIED', campaignName: 'Senior Frontend Engineer Search', details: 'Applied through campaign link', date: '2025-03-02T11:00:00Z' },
  { id: 'e6', candidateId: '6', candidateName: 'Emma Williams', type: 'VIEWED_PROFILE', campaignName: null, details: 'Viewed company career page', date: '2025-03-01T15:30:00Z' },
  { id: 'e7', candidateId: '1', candidateName: 'Alex Rivera', type: 'EMAIL_OPENED', campaignName: 'Senior Frontend Engineer Search', details: 'Email opened 2nd time', date: '2025-03-01T10:00:00Z' },
  { id: 'e8', candidateId: '2', candidateName: 'Priya Patel', type: 'INTERVIEW_SCHEDULED', campaignName: 'Product Designer Pipeline', details: 'Design challenge sent', date: '2025-02-28T13:45:00Z' },
  { id: 'e9', candidateId: '3', candidateName: 'Marcus Johnson', type: 'EMAIL_SENT', campaignName: 'DevOps Talent Pool', details: 'Follow-up email sent', date: '2025-02-27T09:30:00Z' },
  { id: 'e10', candidateId: '4', candidateName: 'Sophie Chen', type: 'APPLIED', campaignName: 'Data Science Interns 2025', details: 'Submitted application via re-engagement', date: '2025-02-26T17:00:00Z' },
];

const mockJobs = [
  { id: 'j1', title: 'Senior Frontend Engineer' },
  { id: 'j2', title: 'Product Designer' },
  { id: 'j3', title: 'Data Science Intern' },
  { id: 'j4', title: 'Backend Developer' },
  { id: 'j5', title: 'DevOps Engineer' },
];

// ===== Circular Progress Component =====
function CircularProgress({ value, size = 56, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-teal-500';
    return 'text-amber-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className={cn('transition-all duration-700', getColor(value))}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', getColor(value))}>{value}%</span>
    </div>
  );
}

// ===== Engagement Event Icon =====
function EngagementIcon({ type }: { type: EngagementEventType }) {
  switch (type) {
    case 'EMAIL_SENT': return <Send className="h-4 w-4" />;
    case 'EMAIL_OPENED': return <MailOpen className="h-4 w-4" />;
    case 'EMAIL_CLICKED': return <MousePointerClick className="h-4 w-4" />;
    case 'INTERVIEW_SCHEDULED': return <CalendarDays className="h-4 w-4" />;
    case 'APPLIED': return <Briefcase className="h-4 w-4" />;
    case 'VIEWED_PROFILE': return <Eye className="h-4 w-4" />;
  }
}

function EngagementColor({ type }: { type: EngagementEventType }) {
  switch (type) {
    case 'EMAIL_SENT': return 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400';
    case 'EMAIL_OPENED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
    case 'EMAIL_CLICKED': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400';
    case 'INTERVIEW_SCHEDULED': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    case 'APPLIED': return 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400';
    case 'VIEWED_PROFILE': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

// ===== Main Content =====
export default function SourcingContent() {
  const { t } = useI18n();
  const tr = t.talentRediscovery as Record<string, string>;
  const ts = t.sourcing as Record<string, string>;

  const [activeTab, setActiveTab] = useState('rediscovery');

  // Rediscovery state
  const [searchSkills, setSearchSkills] = useState('');
  const [searchExpMin, setSearchExpMin] = useState('');
  const [searchExpMax, setSearchExpMax] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PastCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // AI recommendation state
  const [selectedJobId, setSelectedJobId] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<PastCandidate[]>([]);
  const [hasRecommended, setHasRecommended] = useState(false);

  // Campaign state
  const [campaigns, setCampaigns] = useState<SourcingCampaign[]>(mockCampaigns);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignJobId, setNewCampaignJobId] = useState('');
  const [newCampaignSkills, setNewCampaignSkills] = useState('');
  const [newCampaignExperience, setNewCampaignExperience] = useState('');
  const [newCampaignLocation, setNewCampaignLocation] = useState('');
  const [creating, setCreating] = useState(false);

  // Engagement state
  const [engagementFilter, setEngagementFilter] = useState<EngagementEventType | 'ALL'>('ALL');

  // === Computed ===
  const campaignStats = useMemo(() => ({
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    totalMatched: campaigns.reduce((sum, c) => sum + c.matchedCount, 0),
    contacted: campaigns.reduce((sum, c) => sum + c.contactedCount, 0),
    responded: campaigns.reduce((sum, c) => sum + c.respondedCount, 0),
  }), [campaigns]);

  const filteredEvents = useMemo(() => {
    if (engagementFilter === 'ALL') return mockEngagementEvents;
    return mockEngagementEvents.filter(e => e.type === engagementFilter);
  }, [engagementFilter]);

  // === Handlers ===
  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/talent-rediscovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: searchSkills,
          experienceMin: searchExpMin ? parseInt(searchExpMin) : undefined,
          experienceMax: searchExpMax ? parseInt(searchExpMax) : undefined,
          location: searchLocation,
          jobTitle: searchJobTitle,
          companyId: 'demo-company',
        }),
      });
      const data = await res.json();
      setSearchResults(data.candidates || mockPastCandidates);
    } catch {
      setSearchResults(mockPastCandidates);
      toast.error(tr.searching);
    } finally {
      setSearching(false);
    }
  };

  const handleRecommend = async () => {
    if (!selectedJobId) {
      toast.error(tr.noJobSelected);
      return;
    }
    setRecommending(true);
    setHasRecommended(true);
    try {
      const res = await fetch('/api/talent-rediscovery/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, companyId: 'demo-company' }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || mockPastCandidates.slice(0, 4));
      toast.success(tr.recommendSuccess);
    } catch {
      setRecommendations(mockPastCandidates.slice(0, 4));
    } finally {
      setRecommending(false);
    }
  };

  const handleReEngage = (candidate: PastCandidate) => {
    toast.success(tr.reEngageSuccess);
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

  const resetCampaignForm = () => {
    setNewCampaignName('');
    setNewCampaignJobId('');
    setNewCampaignSkills('');
    setNewCampaignExperience('');
    setNewCampaignLocation('');
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

  const getEventTypeLabel = (type: EngagementEventType): string => {
    const map: Record<string, string> = {
      EMAIL_SENT: ts.emailSent,
      EMAIL_OPENED: ts.emailOpened,
      EMAIL_CLICKED: ts.emailClicked,
      INTERVIEW_SCHEDULED: ts.interviewScheduled,
      APPLIED: ts.applied,
      VIEWED_PROFILE: ts.viewedProfile,
    };
    return map[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvailabilityBadge = (availability: PastCandidate['availability']) => {
    switch (availability) {
      case 'available': return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-[10px]">{tr.available}</Badge>;
      case 'open_to_work': return <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-[10px]">{tr.openToWork}</Badge>;
      case 'not_available': return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 text-[10px]">{tr.notAvailable}</Badge>;
    }
  };

  const statusBadgeClass: Record<CampaignStatus, string> = {
    ACTIVE: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
    PAUSED: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
    COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  };

  // ===== Render =====
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{tr.title}</h1>
            <p className="text-sm text-muted-foreground">{tr.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="rediscovery" className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            {tr.rediscoveryTab}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            {tr.campaignsTab}
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            {tr.engagementTab}
          </TabsTrigger>
        </TabsList>

        {/* ===== REDISCOVERY TAB ===== */}
        <TabsContent value="rediscovery" className="space-y-6">
          {/* Search Form */}
          <Card className="border-border/50 card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {tr.searchCandidates}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground">{tr.skillsLabel}</label>
                  <Input
                    placeholder={tr.skillsPlaceholder}
                    value={searchSkills}
                    onChange={(e) => setSearchSkills(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{tr.experienceMinLabel}</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={searchExpMin}
                    onChange={(e) => setSearchExpMin(e.target.value)}
                    className="h-9 text-sm"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{tr.experienceMaxLabel}</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={searchExpMax}
                    onChange={(e) => setSearchExpMax(e.target.value)}
                    className="h-9 text-sm"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{tr.locationLabel}</label>
                  <Input
                    placeholder={tr.locationPlaceholder}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{tr.jobTitleLabel}</label>
                  <Input
                    placeholder={tr.jobTitlePlaceholder}
                    value={searchJobTitle}
                    onChange={(e) => setSearchJobTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 h-9"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Search className="h-4 w-4 me-2" />}
                    {searching ? tr.searching : tr.searchBtn}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {tr.searchResults}
                <Badge variant="outline" className="text-[10px]">{searchResults.length}</Badge>
              </h3>
              {searchResults.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{tr.noResults}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((candidate, idx) => (
                    <Card key={candidate.id} className="border-border/50 card-hover-lift animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{candidate.currentTitle}</p>
                            </div>
                          </div>
                          <CircularProgress value={candidate.matchScore} />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{candidate.experienceYears}y exp</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {candidate.matchReasons.map((reason) => (
                            <Badge key={reason} className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-[10px]">
                              {reason}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{tr.appliedBefore}:</span> {candidate.appliedBefore}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            {getAvailabilityBadge(candidate.availability)}
                            <span className="text-[10px] text-muted-foreground">{tr.lastActive}: {formatDate(candidate.lastActive)}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 h-8 text-xs"
                          onClick={() => handleReEngage(candidate)}
                        >
                          <Send className="h-3 w-3 me-1.5" />
                          {tr.reEngage}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Recommendation Section */}
          <Card className="border-border/50 card-hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {tr.aiRecommendation}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{tr.aiRecommendationDesc}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{tr.selectJob}</label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={tr.noJobSelected} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleRecommend}
                  disabled={recommending}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 h-9"
                >
                  {recommending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Sparkles className="h-4 w-4 me-2" />}
                  {recommending ? tr.recommending : tr.recommendBtn}
                </Button>
              </div>

              {hasRecommended && recommendations.length > 0 && (
                <div className="space-y-3 pt-2">
                  {recommendations.map((rec, idx) => (
                    <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 animate-fade-in-up" style={{ animationDelay: `${idx * 75}ms` }}>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px]">
                          {getInitials(rec.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{rec.name}</p>
                          <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 text-[10px]">
                            {rec.matchScore}% {tr.matchScore}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{rec.currentTitle}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 shrink-0"
                        onClick={() => handleReEngage(rec)}
                      >
                        <Send className="h-3 w-3 me-1" />
                        {tr.reEngage}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SOURCING CAMPAIGNS TAB ===== */}
        <TabsContent value="campaigns" className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 card-hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ts.activeCampaigns}</p>
                    <p className="text-xl font-bold">{campaignStats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ts.totalMatched}</p>
                    <p className="text-xl font-bold">{campaignStats.totalMatched}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ts.contacted}</p>
                    <p className="text-xl font-bold">{campaignStats.contacted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-[0.06]" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
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
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 me-2" />
              {ts.createCampaign}
            </Button>
          </div>

          {/* Campaign Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((campaign, idx) => (
              <Card key={campaign.id} className="border-border/50 card-hover-lift animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
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
                      <Badge key={skill} variant="outline" className="text-[10px] border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                        {skill}
                      </Badge>
                    ))}
                    {campaign.criteria.experience && (
                      <Badge variant="outline" className="text-[10px] border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
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
                      <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{campaign.matchedCount}</p>
                      <p className="text-[10px] text-muted-foreground">{ts.matchedCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{campaign.contactedCount}</p>
                      <p className="text-[10px] text-muted-foreground">{ts.contactedCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{campaign.respondedCount}</p>
                      <p className="text-[10px] text-muted-foreground">{ts.respondedCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {campaign.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                      >
                        <Pause className="h-3 w-3 me-1" />{ts.pauseCampaign}
                      </Button>
                    )}
                    {campaign.status === 'PAUSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                      >
                        <Play className="h-3 w-3 me-1" />{ts.resumeCampaign}
                      </Button>
                    )}
                    {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-teal-600" />
                  {ts.createCampaign}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{ts.campaignName}</label>
                  <Input
                    placeholder={ts.campaignNamePlaceholder}
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{ts.selectJobOptional}</label>
                  <Select value={newCampaignJobId} onValueChange={setNewCampaignJobId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={ts.noJobLinked} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{ts.criteriaSkills}</label>
                  <Input
                    placeholder={ts.criteriaSkillsPlaceholder}
                    value={newCampaignSkills}
                    onChange={(e) => setNewCampaignSkills(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">{ts.criteriaExperience}</label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={newCampaignExperience}
                      onChange={(e) => setNewCampaignExperience(e.target.value)}
                      className="h-9 text-sm"
                      min={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">{ts.criteriaLocation}</label>
                    <Input
                      placeholder={ts.criteriaLocationPlaceholder}
                      value={newCampaignLocation}
                      onChange={(e) => setNewCampaignLocation(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">{t.common.cancel}</Button>
                </DialogClose>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
                  onClick={handleCreateCampaign}
                  disabled={creating || !newCampaignName.trim()}
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
                  {creating ? ts.creating : ts.createBtn}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== ENGAGEMENT TAB ===== */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-muted-foreground shrink-0">{ts.filterByType}:</span>
            {(['ALL', 'EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'INTERVIEW_SCHEDULED', 'APPLIED', 'VIEWED_PROFILE'] as const).map((type) => (
              <Button
                key={type}
                variant={engagementFilter === type ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 text-[10px] shrink-0',
                  engagementFilter === type
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-0'
                    : 'border-border/50'
                )}
                onClick={() => setEngagementFilter(type)}
              >
                {type === 'ALL' ? ts.allTypes : getEventTypeLabel(type)}
              </Button>
            ))}
          </div>

          {/* Timeline */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {ts.eventTimeline}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{ts.noEvents}</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute start-5 top-2 bottom-2 w-px bg-border/50" />

                  {filteredEvents.map((event, idx) => (
                    <div key={event.id} className="relative flex items-start gap-4 py-3 animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                      {/* Dot */}
                      <div className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        EngagementColor({ type: event.type })
                      )}>
                        <EngagementIcon type={event.type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2 border-b border-border/20 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{event.candidateName}</span>
                            <Badge className={cn('text-[10px] border-0', EngagementColor({ type: event.type }))}>
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(event.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.details}</p>
                        {event.campaignName && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1">
                            <Target className="h-2.5 w-2.5" />{event.campaignName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
