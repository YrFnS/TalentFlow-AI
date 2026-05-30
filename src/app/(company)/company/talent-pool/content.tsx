'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  FileText,
  Briefcase,
  Star,
  Clock,
  Tag,
  Filter,
  Eye,
  UserPlus,
  UserMinus,
  Send,
  Calendar,
  StickyNote,
  ChevronDown,
  Grid3X3,
  List,
  ArrowRight,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ========================
// Types
// ========================

type PoolCategory = 'Silver' | 'Gold' | 'Platinum' | 'General';

interface Pool {
  id: string;
  name: string;
  description: string;
  category: PoolCategory;
  memberCount: number;
  lastActivity: string;
  memberIds: string[];
}

interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  skills: string[];
  matchScore: number;
  lastContacted: string;
  poolIds: string[];
  email: string;
  availability: string;
  tags: string[];
  activityTimeline: ActivityEntry[];
}

interface ActivityEntry {
  id: string;
  type: 'email' | 'call' | 'note' | 'job' | 'pool';
  description: string;
  date: string;
}

// ========================
// Category config
// ========================

const categoryColors: Record<PoolCategory, string> = {
  Silver: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0',
  Gold: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Platinum: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0',
  General: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
};

const categoryIcons: Record<PoolCategory, string> = {
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  General: '📋',
};

// ========================
// Mock Data
// ========================

const mockPools: Pool[] = [
  {
    id: 'pool-1',
    name: 'Senior Engineers',
    description: 'Experienced software engineers with 5+ years of expertise in modern tech stacks',
    category: 'Gold',
    memberCount: 12,
    lastActivity: '2 hours ago',
    memberIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'],
  },
  {
    id: 'pool-2',
    name: 'Design Talent',
    description: 'Creative designers with strong UX/UI and product design skills',
    category: 'Silver',
    memberCount: 8,
    lastActivity: '1 day ago',
    memberIds: ['c3', 'c5', 'c7', 'c9', 'c11', 'c13', 'c14', 'c15'],
  },
  {
    id: 'pool-3',
    name: 'Product Leaders',
    description: 'Strategic product managers and leaders with proven track records',
    category: 'Platinum',
    memberCount: 5,
    lastActivity: '3 days ago',
    memberIds: ['c1', 'c6', 'c10', 'c13', 'c15'],
  },
  {
    id: 'pool-4',
    name: 'General Pipeline',
    description: 'All promising candidates for general opportunities and future roles',
    category: 'General',
    memberCount: 25,
    lastActivity: '5 hours ago',
    memberIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15'],
  },
];

const mockCandidates: Candidate[] = [
  {
    id: 'c1', name: 'Sarah Chen', currentTitle: 'Senior Software Engineer', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], matchScore: 94, lastContacted: '2 days ago', poolIds: ['pool-1', 'pool-3', 'pool-4'], email: 'sarah.chen@email.com', availability: 'Open to offers', tags: ['Tech Lead', 'Full-Stack'],
    activityTimeline: [
      { id: 'a1', type: 'email', description: 'Sent follow-up email about Senior Architect role', date: '2 days ago' },
      { id: 'a2', type: 'call', description: 'Phone screening for Engineering Manager position', date: '1 week ago' },
      { id: 'a3', type: 'pool', description: 'Added to Senior Engineers pool', date: '2 weeks ago' },
    ],
  },
  {
    id: 'c2', name: 'Marcus Johnson', currentTitle: 'Backend Developer', skills: ['Python', 'Django', 'PostgreSQL', 'Docker'], matchScore: 88, lastContacted: '1 day ago', poolIds: ['pool-1', 'pool-4'], email: 'marcus.j@email.com', availability: 'Actively looking', tags: ['Backend', 'DevOps'],
    activityTimeline: [
      { id: 'a4', type: 'email', description: 'Shared job description for Lead Backend role', date: '1 day ago' },
      { id: 'a5', type: 'note', description: 'Strong system design skills, great culture fit', date: '5 days ago' },
    ],
  },
  {
    id: 'c3', name: 'Aisha Patel', currentTitle: 'Full-Stack Engineer', skills: ['React', 'Python', 'MongoDB', 'GraphQL'], matchScore: 91, lastContacted: '3 days ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'aisha.p@email.com', availability: 'Open to offers', tags: ['Full-Stack', 'Design'],
    activityTimeline: [
      { id: 'a6', type: 'call', description: 'Technical discussion about microservices architecture', date: '3 days ago' },
    ],
  },
  {
    id: 'c4', name: 'Tom Anderson', currentTitle: 'DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'], matchScore: 85, lastContacted: '5 days ago', poolIds: ['pool-1', 'pool-4'], email: 'tom.a@email.com', availability: 'Passive', tags: ['DevOps', 'Cloud'],
    activityTimeline: [
      { id: 'a7', type: 'email', description: 'Initial outreach email sent', date: '5 days ago' },
      { id: 'a8', type: 'pool', description: 'Added to Senior Engineers pool', date: '1 week ago' },
    ],
  },
  {
    id: 'c5', name: 'Priya Sharma', currentTitle: 'UI/UX Designer', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], matchScore: 92, lastContacted: '1 day ago', poolIds: ['pool-2', 'pool-4'], email: 'priya.s@email.com', availability: 'Actively looking', tags: ['Design', 'UX Research'],
    activityTimeline: [
      { id: 'a9', type: 'email', description: 'Sent portfolio review invitation', date: '1 day ago' },
      { id: 'a10', type: 'call', description: 'Design challenge discussion', date: '4 days ago' },
      { id: 'a11', type: 'note', description: 'Exceptional design thinking and attention to detail', date: '1 week ago' },
    ],
  },
  {
    id: 'c6', name: 'David Kim', currentTitle: 'Product Manager', skills: ['Strategy', 'Agile', 'Data Analysis', 'Leadership'], matchScore: 89, lastContacted: '4 days ago', poolIds: ['pool-3', 'pool-4'], email: 'david.k@email.com', availability: 'Open to offers', tags: ['Product', 'Strategy'],
    activityTimeline: [
      { id: 'a12', type: 'call', description: 'Discussed VP of Product opportunity', date: '4 days ago' },
      { id: 'a13', type: 'pool', description: 'Added to Product Leaders pool', date: '2 weeks ago' },
    ],
  },
  {
    id: 'c7', name: 'Emma Wilson', currentTitle: 'Frontend Developer', skills: ['Vue.js', 'TypeScript', 'CSS', 'Testing'], matchScore: 83, lastContacted: '1 week ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'emma.w@email.com', availability: 'Passive', tags: ['Frontend', 'Vue'],
    activityTimeline: [
      { id: 'a14', type: 'email', description: 'Follow-up on open Frontend Lead position', date: '1 week ago' },
    ],
  },
  {
    id: 'c8', name: 'Carlos Ruiz', currentTitle: 'Data Engineer', skills: ['Spark', 'Python', 'SQL', 'Airflow'], matchScore: 86, lastContacted: '3 days ago', poolIds: ['pool-1', 'pool-4'], email: 'carlos.r@email.com', availability: 'Actively looking', tags: ['Data', 'Engineering'],
    activityTimeline: [
      { id: 'a15', type: 'note', description: 'Strong ETL pipeline experience, great for Data Platform team', date: '3 days ago' },
    ],
  },
  {
    id: 'c9', name: 'Lisa Park', currentTitle: 'Product Designer', skills: ['Figma', 'Sketch', 'User Testing', 'Branding'], matchScore: 90, lastContacted: '2 days ago', poolIds: ['pool-2', 'pool-4'], email: 'lisa.p@email.com', availability: 'Open to offers', tags: ['Design', 'Branding'],
    activityTimeline: [
      { id: 'a16', type: 'email', description: 'Sent offer for Senior Product Designer role', date: '2 days ago' },
      { id: 'a17', type: 'call', description: 'Salary negotiation discussion', date: '5 days ago' },
    ],
  },
  {
    id: 'c10', name: 'Omar Hassan', currentTitle: 'Engineering Manager', skills: ['Leadership', 'React', 'System Design', 'Mentoring'], matchScore: 95, lastContacted: '6 hours ago', poolIds: ['pool-1', 'pool-3', 'pool-4'], email: 'omar.h@email.com', availability: 'Actively looking', tags: ['Leadership', 'Management'],
    activityTimeline: [
      { id: 'a18', type: 'call', description: 'Final round interview for VP Engineering', date: '6 hours ago' },
      { id: 'a19', type: 'email', description: 'Shared company culture deck and benefits', date: '1 day ago' },
      { id: 'a20', type: 'pool', description: 'Added to Product Leaders pool', date: '3 days ago' },
    ],
  },
  {
    id: 'c11', name: 'Sophie Taylor', currentTitle: 'Mobile Developer', skills: ['React Native', 'Swift', 'Kotlin', 'Firebase'], matchScore: 82, lastContacted: '1 week ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'sophie.t@email.com', availability: 'Passive', tags: ['Mobile', 'Cross-Platform'],
    activityTimeline: [
      { id: 'a21', type: 'email', description: 'Connected on LinkedIn, shared open roles', date: '1 week ago' },
    ],
  },
  {
    id: 'c12', name: 'Ryan Cooper', currentTitle: 'Cloud Architect', skills: ['AWS', 'GCP', 'Microservices', 'Security'], matchScore: 87, lastContacted: '4 days ago', poolIds: ['pool-1', 'pool-4'], email: 'ryan.c@email.com', availability: 'Open to offers', tags: ['Cloud', 'Architecture'],
    activityTimeline: [
      { id: 'a22', type: 'call', description: 'Technical architecture discussion', date: '4 days ago' },
      { id: 'a23', type: 'note', description: '10+ years cloud experience, AWS certified', date: '1 week ago' },
    ],
  },
  {
    id: 'c13', name: 'Fatima Al-Rashid', currentTitle: 'Director of Product', skills: ['Strategy', 'OKRs', 'Team Building', 'Analytics'], matchScore: 96, lastContacted: '1 day ago', poolIds: ['pool-3', 'pool-4'], email: 'fatima.a@email.com', availability: 'Open to offers', tags: ['Leadership', 'Product'],
    activityTimeline: [
      { id: 'a24', type: 'email', description: 'Sent CPO opportunity details', date: '1 day ago' },
      { id: 'a25', type: 'call', description: 'Executive interview round 1', date: '3 days ago' },
    ],
  },
  {
    id: 'c14', name: 'James Liu', currentTitle: 'ML Engineer', skills: ['PyTorch', 'NLP', 'MLOps', 'Python'], matchScore: 84, lastContacted: '5 days ago', poolIds: ['pool-1', 'pool-4'], email: 'james.l@email.com', availability: 'Passive', tags: ['ML', 'AI'],
    activityTimeline: [
      { id: 'a26', type: 'email', description: 'Shared ML team growth plans', date: '5 days ago' },
    ],
  },
  {
    id: 'c15', name: 'Nadia Volkov', currentTitle: 'Head of Design', skills: ['Design Systems', 'Leadership', 'Research', 'Figma'], matchScore: 93, lastContacted: '2 days ago', poolIds: ['pool-2', 'pool-3', 'pool-4'], email: 'nadia.v@email.com', availability: 'Actively looking', tags: ['Design Leadership', 'UX'],
    activityTimeline: [
      { id: 'a27', type: 'call', description: 'VP Design role discussion', date: '2 days ago' },
      { id: 'a28', type: 'pool', description: 'Added to Product Leaders pool', date: '1 week ago' },
      { id: 'a29', type: 'note', description: 'Built design org from 3 to 20 people at current company', date: '2 weeks ago' },
    ],
  },
];

const recentActivities: { id: string; description: string; time: string; type: string }[] = [
  { id: 'ra1', description: 'Omar Hassan completed final interview for VP Engineering', time: '6 hours ago', type: 'interview' },
  { id: 'ra2', description: 'Fatima Al-Rashid responded to CPO opportunity', time: '1 day ago', type: 'email' },
  { id: 'ra3', description: 'Lisa Park received offer for Senior Product Designer', time: '2 days ago', type: 'offer' },
  { id: 'ra4', description: '3 candidates added to Senior Engineers pool', time: '3 days ago', type: 'pool' },
  { id: 'ra5', description: 'Nadia Volkov scheduled for VP Design interview', time: '2 days ago', type: 'interview' },
];

// ========================
// Component
// ========================

export default function TalentPoolContent() {
  const { t } = useI18n();
  const tp = t.talentPool as Record<string, string>;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPool, setFilterPool] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSkills, setFilterSkills] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [newPoolCategory, setNewPoolCategory] = useState<PoolCategory>('General');

  const [addToPoolOpen, setAddToPoolOpen] = useState(false);
  const [selectedCandidateForPool, setSelectedCandidateForPool] = useState<Candidate | null>(null);
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);
  const [addToPoolNotes, setAddToPoolNotes] = useState('');
  const [addToPoolTags, setAddToPoolTags] = useState('');

  const [engageOpen, setEngageOpen] = useState(false);
  const [engageCandidate, setEngageCandidate] = useState<Candidate | null>(null);
  const [engageAction, setEngageAction] = useState<'email' | 'call' | 'note' | 'job' | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [noteText, setNoteText] = useState('');
  const [reassignJob, setReassignJob] = useState('');

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(null);

  const [pools, setPools] = useState<Pool[]>(mockPools);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);

  // Stats
  const stats = useMemo(() => ({
    totalCandidates: candidates.length,
    activePools: pools.length,
    engagedThisMonth: candidates.filter(c => c.lastContacted.includes('day') || c.lastContacted.includes('hour')).length,
    avgTimeInPool: '47 days',
  }), [candidates, pools]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesTitle = c.currentTitle.toLowerCase().includes(q);
        const matchesSkills = c.skills.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesSkills) return false;
      }
      if (filterPool !== 'all' && !c.poolIds.includes(filterPool)) return false;
      if (filterCategory !== 'all') {
        const poolsInCategory = pools.filter(p => p.category === filterCategory).map(p => p.id);
        if (!c.poolIds.some(pid => poolsInCategory.includes(pid))) return false;
      }
      if (filterSkills) {
        const skillQ = filterSkills.toLowerCase();
        if (!c.skills.some(s => s.toLowerCase().includes(skillQ))) return false;
      }
      if (filterAvailability !== 'all' && c.availability !== filterAvailability) return false;
      return true;
    });
  }, [candidates, searchQuery, filterPool, filterCategory, filterSkills, filterAvailability, pools]);

  // Handlers
  const handleCreatePool = () => {
    if (!newPoolName.trim()) return;
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name: newPoolName,
      description: newPoolDescription,
      category: newPoolCategory,
      memberCount: 0,
      lastActivity: 'Just now',
      memberIds: [],
    };
    setPools(prev => [...prev, newPool]);
    setCreatePoolOpen(false);
    setNewPoolName('');
    setNewPoolDescription('');
    setNewPoolCategory('General');
    toast.success(tp.createPool + ' ✓');
  };

  const handleAddToPool = () => {
    if (!selectedCandidateForPool || selectedPoolIds.length === 0) return;
    setCandidates(prev => prev.map(c => {
      if (c.id === selectedCandidateForPool.id) {
        return { ...c, poolIds: [...new Set([...c.poolIds, ...selectedPoolIds])] };
      }
      return c;
    }));
    setPools(prev => prev.map(p => {
      if (selectedPoolIds.includes(p.id)) {
        return { ...p, memberCount: p.memberCount + 1, lastActivity: 'Just now' };
      }
      return p;
    }));
    setAddToPoolOpen(false);
    setSelectedPoolIds([]);
    setAddToPoolNotes('');
    setAddToPoolTags('');
    toast.success(tp.addToPool + ' ✓');
  };

  const handleRemoveFromPool = (candidateId: string, poolId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { ...c, poolIds: c.poolIds.filter(id => id !== poolId) };
      }
      return c;
    }));
    setPools(prev => prev.map(p => {
      if (p.id === poolId) {
        return { ...p, memberCount: Math.max(0, p.memberCount - 1) };
      }
      return p;
    }));
    toast.success(tp.removeFromPool + ' ✓');
  };

  const handleEngage = () => {
    if (!engageCandidate || !engageAction) return;
    const actionLabels: Record<string, string> = {
      email: tp.sendEmail,
      call: tp.scheduleCall,
      note: tp.addNote,
      job: tp.reassignJob,
    };
    toast.success(`${actionLabels[engageAction]} ✓`);
    setEngageOpen(false);
    setEngageAction(null);
    setEmailBody('');
    setCallNotes('');
    setNoteText('');
    setReassignJob('');
  };

  const openEngage = (candidate: Candidate) => {
    setEngageCandidate(candidate);
    setEngageOpen(true);
    setEngageAction(null);
  };

  const openAddToPool = (candidate: Candidate) => {
    setSelectedCandidateForPool(candidate);
    setSelectedPoolIds(candidate.poolIds);
    setAddToPoolNotes('');
    setAddToPoolTags('');
    setAddToPoolOpen(true);
  };

  const openProfile = (candidate: Candidate) => {
    setProfileCandidate(candidate);
    setProfileOpen(true);
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'note': return StickyNote;
      case 'job': return Briefcase;
      case 'pool': return Users;
      default: return FileText;
    }
  };

  const activityColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950';
      case 'call': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950';
      case 'note': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950';
      case 'job': return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950';
      case 'pool': return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{tp.title}</h1>
            <p className="text-sm text-muted-foreground">{tp.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={() => setCreatePoolOpen(true)}
        >
          <Plus className="h-4 w-4 me-2" />
          {tp.createPool}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.totalCandidates}</p>
                <p className="text-xl font-bold">{stats.totalCandidates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.activePools}</p>
                <p className="text-xl font-bold">{stats.activePools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.engagedMonth}</p>
                <p className="text-xl font-bold">{stats.engagedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.avgTimeInPool}</p>
                <p className="text-xl font-bold">{stats.avgTimeInPool}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pools Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          {tp.activePools}
        </h2>
        {pools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pools.map(pool => (
              <Card
                key={pool.id}
                className="border-border/50 card-hover-lift cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-all"
                onClick={() => { setFilterPool(pool.id === filterPool ? 'all' : pool.id); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{categoryIcons[pool.category]}</span>
                      <h3 className="font-semibold text-sm truncate">{pool.name}</h3>
                    </div>
                    <Badge className={cn('text-[10px]', categoryColors[pool.category])}>
                      {tp[`category${pool.category}`] || pool.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {pool.memberCount} {tp.members}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {pool.lastActivity}
                    </div>
                  </div>
                  {filterPool === pool.id && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                        ✓ Filtering
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{tp.noPools}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Candidate List Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {tp.totalCandidates} ({filteredCandidates.length})
          </h2>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
              <TabsList className="h-8">
                <TabsTrigger value="grid" className="text-xs px-2 h-6">
                  <Grid3X3 className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs px-2 h-6">
                  <List className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tp.searchCandidates}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/50"
            />
          </div>
          <Select value={filterPool} onValueChange={setFilterPool}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder={tp.filterByPool} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tp.filterByPool}</SelectItem>
              {pools.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={tp.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tp.category}</SelectItem>
              <SelectItem value="Silver">{tp.categorySilver}</SelectItem>
              <SelectItem value="Gold">{tp.categoryGold}</SelectItem>
              <SelectItem value="Platinum">{tp.categoryPlatinum}</SelectItem>
              <SelectItem value="General">{tp.categoryGeneral}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Availability</SelectItem>
              <SelectItem value="Actively looking">Actively looking</SelectItem>
              <SelectItem value="Open to offers">Open to offers</SelectItem>
              <SelectItem value="Passive">Passive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={tp.filterBySkills}
            value={filterSkills}
            onChange={(e) => setFilterSkills(e.target.value)}
            className="w-32 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/50"
          />
          {(filterPool !== 'all' || filterCategory !== 'all' || filterAvailability !== 'all' || filterSkills || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setFilterPool('all'); setFilterCategory('all'); setFilterAvailability('all'); setFilterSkills(''); setSearchQuery(''); }}
            >
              <X className="h-3 w-3 me-1" />
              {t.common.clearFilters}
            </Button>
          )}
        </div>

        {/* Candidate Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCandidates.map(candidate => (
              <Card key={candidate.id} className="border-border/50 card-hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">{candidate.name}</h3>
                        <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 shrink-0 ms-2">
                          {candidate.matchScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{candidate.currentTitle}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.skills.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{candidate.skills.length - 4}
                      </Badge>
                    )}
                  </div>

                  {/* Pool Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.poolIds.map(pid => {
                      const pool = pools.find(p => p.id === pid);
                      if (!pool) return null;
                      return (
                        <Badge key={pid} className={cn('text-[10px] gap-0.5', categoryColors[pool.category])}>
                          {pool.name}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Tags */}
                  {candidate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {candidate.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tp.lastContacted}: {candidate.lastContacted}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{candidate.availability}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-t border-border/30 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs flex-1"
                      onClick={() => openAddToPool(candidate)}
                    >
                      <UserPlus className="h-3 w-3 me-1" />
                      {tp.addToPool}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs flex-1 text-teal-600 dark:text-teal-400 hover:text-teal-700"
                      onClick={() => openEngage(candidate)}
                    >
                      <Mail className="h-3 w-3 me-1" />
                      {tp.engage}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => openProfile(candidate)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">{tp.title}</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">Skills</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">Match</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">{tp.lastContacted}</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">Pools</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">{tp.category}</th>
                      <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map(candidate => (
                      <tr
                        key={candidate.id}
                        className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => openProfile(candidate)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[9px]">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium block">{candidate.name}</span>
                              <span className="text-[10px] text-muted-foreground">{candidate.currentTitle}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map(s => (
                              <Badge key={s} variant="outline" className="text-[9px] px-1 py-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                            {candidate.matchScore}%
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-muted-foreground">{candidate.lastContacted}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {candidate.poolIds.slice(0, 2).map(pid => {
                              const pool = pools.find(p => p.id === pid);
                              return pool ? (
                                <Badge key={pid} className={cn('text-[9px]', categoryColors[pool.category])}>
                                  {pool.name}
                                </Badge>
                              ) : null;
                            })}
                            {candidate.poolIds.length > 2 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                +{candidate.poolIds.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {candidate.availability}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openAddToPool(candidate)}>
                              <UserPlus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400" onClick={() => openEngage(candidate)}>
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openProfile(candidate)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">{tp.noCandidates}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCandidates.length === 0 && viewMode === 'grid' && (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{tp.noCandidates}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Nurture Activities */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          Recent Nurture Activities
        </h2>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-muted/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                    {activity.type === 'interview' ? <Phone className="h-3.5 w-3.5" /> :
                     activity.type === 'email' ? <Mail className="h-3.5 w-3.5" /> :
                     activity.type === 'offer' ? <Briefcase className="h-3.5 w-3.5" /> :
                     <Users className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =================== DIALOGS =================== */}

      {/* Create Pool Dialog */}
      <Dialog open={createPoolOpen} onOpenChange={setCreatePoolOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              {tp.createPool}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{tp.poolName}</label>
              <Input
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder={tp.poolName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tp.poolDescription}</label>
              <Textarea
                value={newPoolDescription}
                onChange={(e) => setNewPoolDescription(e.target.value)}
                placeholder={tp.poolDescription}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tp.category}</label>
              <Select value={newPoolCategory} onValueChange={(v) => setNewPoolCategory(v as PoolCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silver">{tp.categorySilver}</SelectItem>
                  <SelectItem value="Gold">{tp.categoryGold}</SelectItem>
                  <SelectItem value="Platinum">{tp.categoryPlatinum}</SelectItem>
                  <SelectItem value="General">{tp.categoryGeneral}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleCreatePool}
              disabled={!newPoolName.trim()}
            >
              {tp.createPool}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Pool Dialog */}
      <Dialog open={addToPoolOpen} onOpenChange={setAddToPoolOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              {tp.addToPool}
            </DialogTitle>
          </DialogHeader>
          {selectedCandidateForPool && (
            <div className="space-y-4 py-2">
              {/* Candidate Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[10px]">
                    {getInitials(selectedCandidateForPool.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedCandidateForPool.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidateForPool.currentTitle}</p>
                </div>
              </div>

              {/* Pool Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{tp.selectPools}</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pools.map(pool => {
                    const isSelected = selectedPoolIds.includes(pool.id);
                    return (
                      <label
                        key={pool.id}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/30'
                            : 'border-border/50 hover:border-teal-200 dark:hover:border-teal-800'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPoolIds(prev => [...prev, pool.id]);
                            } else {
                              setSelectedPoolIds(prev => prev.filter(id => id !== pool.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{pool.name}</span>
                            <Badge className={cn('text-[9px]', categoryColors[pool.category])}>
                              {tp[`category${pool.category}`] || pool.category}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{pool.memberCount} {tp.members}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{tp.notes}</label>
                <Textarea
                  value={addToPoolNotes}
                  onChange={(e) => setAddToPoolNotes(e.target.value)}
                  placeholder={tp.notes}
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{tp.tags}</label>
                <Input
                  value={addToPoolTags}
                  onChange={(e) => setAddToPoolTags(e.target.value)}
                  placeholder={tp.tags}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleAddToPool}
              disabled={selectedPoolIds.length === 0}
            >
              <UserPlus className="h-3.5 w-3.5 me-1.5" />
              {tp.addToPool}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Engage Dialog */}
      <Dialog open={engageOpen} onOpenChange={setEngageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600" />
              {tp.engage} — {engageCandidate?.name}
            </DialogTitle>
          </DialogHeader>
          {engageCandidate && (
            <div className="space-y-4 py-2">
              {/* Action Selection */}
              {!engageAction && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950"
                    onClick={() => { setEngageAction('email'); setEmailTemplate('general'); setEmailBody(`Dear ${engageCandidate.name},\n\nI hope this message finds you well...`); }}
                  >
                    <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-medium">{tp.sendEmail}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    onClick={() => { setEngageAction('call'); setCallNotes(''); }}
                  >
                    <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium">{tp.scheduleCall}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                    onClick={() => { setEngageAction('note'); setNoteText(''); }}
                  >
                    <StickyNote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium">{tp.addNote}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-950"
                    onClick={() => { setEngageAction('job'); setReassignJob(''); }}
                  >
                    <Briefcase className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium">{tp.reassignJob}</span>
                  </Button>
                </div>
              )}

              {/* Email Action */}
              {engageAction === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEngageAction(null)}>
                      ← Back
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template</label>
                    <Select value={emailTemplate} onValueChange={(v) => {
                      setEmailTemplate(v);
                      const templates: Record<string, string> = {
                        general: `Dear ${engageCandidate.name},\n\nI hope this message finds you well. We have some exciting opportunities that match your profile...`,
                        followup: `Hi ${engageCandidate.name},\n\nI wanted to follow up on our previous conversation about opportunities at TechVision...`,
                        opportunity: `Dear ${engageCandidate.name},\n\nA new position has opened up that I think would be a great fit for your skills...`,
                      };
                      setEmailBody(templates[v] || '');
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Outreach</SelectItem>
                        <SelectItem value="followup">Follow Up</SelectItem>
                        <SelectItem value="opportunity">New Opportunity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
                    onClick={handleEngage}
                  >
                    <Send className="h-3.5 w-3.5 me-1.5" />
                    {tp.sendEmail}
                  </Button>
                </div>
              )}

              {/* Call Action */}
              {engageAction === 'call' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEngageAction(null)}>
                      ← Back
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tp.notes}</label>
                    <Textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="Call agenda and notes..."
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    onClick={handleEngage}
                  >
                    <Calendar className="h-3.5 w-3.5 me-1.5" />
                    {tp.scheduleCall}
                  </Button>
                </div>
              )}

              {/* Note Action */}
              {engageAction === 'note' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEngageAction(null)}>
                      ← Back
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tp.addNote}</label>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note about this candidate..."
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                    onClick={handleEngage}
                  >
                    <StickyNote className="h-3.5 w-3.5 me-1.5" />
                    {tp.addNote}
                  </Button>
                </div>
              )}

              {/* Reassign to Job Action */}
              {engageAction === 'job' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEngageAction(null)}>
                      ← Back
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tp.reassignJob}</label>
                    <Select value={reassignJob} onValueChange={setReassignJob}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sr-frontend">Senior Frontend Engineer</SelectItem>
                        <SelectItem value="product-designer">Product Designer</SelectItem>
                        <SelectItem value="vp-eng">VP of Engineering</SelectItem>
                        <SelectItem value="data-eng">Data Engineer</SelectItem>
                        <SelectItem value="devops-lead">DevOps Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700"
                    onClick={handleEngage}
                  >
                    <Briefcase className="h-3.5 w-3.5 me-1.5" />
                    {tp.reassignJob}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile / Activity Timeline Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              {tp.viewProfile}
            </DialogTitle>
          </DialogHeader>
          {profileCandidate && (
            <div className="space-y-6 py-2">
              {/* Candidate Info */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-lg">
                        {getInitials(profileCandidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{profileCandidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{profileCandidate.currentTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                          {profileCandidate.matchScore}% Match
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{profileCandidate.availability}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => { setProfileOpen(false); openAddToPool(profileCandidate); }}>
                        <UserPlus className="h-3 w-3 me-1" />
                        {tp.addToPool}
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-teal-600 dark:text-teal-400" onClick={() => { setProfileOpen(false); openEngage(profileCandidate); }}>
                        <Mail className="h-3 w-3 me-1" />
                        {tp.engage}
                      </Button>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {profileCandidate.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {profileCandidate.tags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{tp.tags}</p>
                      <div className="flex flex-wrap gap-1">
                        {profileCandidate.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                            <Tag className="h-2.5 w-2.5 me-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pools */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{tp.activePools}</p>
                    <div className="flex flex-wrap gap-1">
                      {profileCandidate.poolIds.map(pid => {
                        const pool = pools.find(p => p.id === pid);
                        if (!pool) return null;
                        return (
                          <div key={pid} className="flex items-center gap-1">
                            <Badge className={cn('text-[10px] gap-0.5', categoryColors[pool.category])}>
                              {pool.name}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
                              onClick={() => handleRemoveFromPool(profileCandidate.id, pool.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profileCandidate.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tp.lastContacted}: {profileCandidate.lastContacted}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {tp.activityTimeline}
                </h3>
                {profileCandidate.activityTimeline.length > 0 ? (
                  <div className="space-y-3">
                    {profileCandidate.activityTimeline.map(entry => {
                      const Icon = activityIcon(entry.type);
                      return (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', activityColor(entry.type))}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{entry.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{entry.date}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{tp.noCandidates}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
