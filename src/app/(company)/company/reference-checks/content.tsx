// @ts-nocheck
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
  ShieldCheck,
  Star,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Plus,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Trash2,
  Loader2,
  Building2,
  Briefcase,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Types
type ReferenceCheckStatus = 'Pending' | 'Sent' | 'Completed' | 'Expired' | 'Declined';

interface ReferenceCheckQuestion {
  id: string;
  question: string;
  response?: string;
}

interface ReferenceCheckItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidateCurrentTitle: string;
  referenceName: string;
  referenceEmail: string;
  referencePhone: string;
  referenceTitle: string;
  referenceCompany: string;
  relationship: string;
  questions: ReferenceCheckQuestion[];
  responses?: ReferenceCheckQuestion[];
  rating: number | null;
  status: ReferenceCheckStatus;
  sentDate: string;
  completedDate: string;
  expiresAt: string;
  token: string;
}

interface MockApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: string;
}

// Status color mapping
const statusColors: Record<ReferenceCheckStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Sent: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
  Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0',
  Expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0',
  Declined: 'bg-red-50 text-red-700 dark:bg-red-950 border-0',
};

const statusIcons: Record<ReferenceCheckStatus, React.ElementType> = {
  Pending: Clock,
  Sent: Send,
  Completed: CheckCircle2,
  Expired: AlertCircle,
  Declined: XCircle,
};

// Default questions
const defaultQuestions = [
  'How would you describe their work ethic?',
  'What are their key strengths?',
  'Areas for improvement?',
  'Would you rehire them?',
  'How do they handle pressure?',
];

// Mock applications (HIRED/OFFERED status)
const mockApplications: MockApplication[] = [
  { id: 'app-1', candidateName: 'Sarah Chen', jobTitle: 'Senior Frontend Engineer', status: 'HIRED' },
  { id: 'app-2', candidateName: 'Marcus Brown', jobTitle: 'Product Designer', status: 'OFFERED' },
  { id: 'app-3', candidateName: 'Priya Sharma', jobTitle: 'Backend Developer', status: 'HIRED' },
  { id: 'app-4', candidateName: 'Aisha Mohamed', jobTitle: 'Data Analyst', status: 'OFFERED' },
  { id: 'app-5', candidateName: 'David Kim', jobTitle: 'DevOps Engineer', status: 'HIRED' },
];

// Mock reference check data
const mockReferenceChecks: ReferenceCheckItem[] = [
  {
    id: 'rc-1',
    applicationId: 'app-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@email.com',
    candidateCurrentTitle: 'Frontend Developer',
    referenceName: 'Tom Anderson',
    referenceEmail: 'tom.a@techcorp.com',
    referencePhone: '+1-555-0101',
    referenceTitle: 'Engineering Manager',
    referenceCompany: 'TechCorp',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Exceptional work ethic. Always delivers on time and goes above expectations.',
        'Strong technical skills, excellent communicator, great team player.',
        'Could improve on delegating tasks — tends to take on too much herself.',
        'Absolutely, without hesitation. She is a top performer.',
        'Handles pressure extremely well. Stays calm and focused during crunch periods.',
      ][i],
    })),
    rating: 5,
    status: 'Completed',
    sentDate: '2025-01-15',
    completedDate: '2025-01-18',
    expiresAt: '2025-01-29',
    token: 'token-rc-1',
  },
  {
    id: 'rc-2',
    applicationId: 'app-2',
    candidateName: 'Marcus Brown',
    candidateEmail: 'marcus.b@email.com',
    candidateCurrentTitle: 'UX Designer',
    referenceName: 'Linda Park',
    referenceEmail: 'linda.p@designstudio.com',
    referencePhone: '+1-555-0102',
    referenceTitle: 'Creative Director',
    referenceCompany: 'DesignStudio',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Very dedicated and passionate about design. Meets deadlines consistently.',
        'Creative thinking, user empathy, and strong visual design skills.',
        'Sometimes struggles with stakeholder management in contentious feedback sessions.',
        'Yes, I would rehire Marcus. A valuable team member.',
        'Performs well under pressure, though can be a bit perfectionist when rushed.',
      ][i],
    })),
    rating: 4,
    status: 'Completed',
    sentDate: '2025-01-10',
    completedDate: '2025-01-14',
    expiresAt: '2025-01-24',
    token: 'token-rc-2',
  },
  {
    id: 'rc-3',
    applicationId: 'app-3',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.s@email.com',
    candidateCurrentTitle: 'Software Engineer',
    referenceName: 'James Wilson',
    referenceEmail: 'james.w@dataflow.io',
    referencePhone: '+1-555-0103',
    referenceTitle: 'Senior Engineer',
    referenceCompany: 'DataFlow',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Solid work ethic. Reliable and consistent performer.',
        'Backend architecture, problem-solving, and mentoring junior developers.',
        'Could take more initiative in proposing new ideas beyond assigned tasks.',
        'Yes, she would be a great addition to any engineering team.',
        'Stays composed under pressure and helps the team stay on track.',
      ][i],
    })),
    rating: 4,
    status: 'Completed',
    sentDate: '2025-01-08',
    completedDate: '2025-01-12',
    expiresAt: '2025-01-22',
    token: 'token-rc-3',
  },
  {
    id: 'rc-4',
    applicationId: 'app-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@email.com',
    candidateCurrentTitle: 'Frontend Developer',
    referenceName: 'Emily Zhang',
    referenceEmail: 'emily.z@startupxyz.com',
    referencePhone: '+1-555-0104',
    referenceTitle: 'Product Manager',
    referenceCompany: 'StartupXYZ',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Pending',
    sentDate: '',
    completedDate: '',
    expiresAt: '2025-03-10',
    token: 'token-rc-4',
  },
  {
    id: 'rc-5',
    applicationId: 'app-4',
    candidateName: 'Aisha Mohamed',
    candidateEmail: 'aisha.m@email.com',
    candidateCurrentTitle: 'Data Analyst',
    referenceName: 'Robert Lee',
    referenceEmail: 'robert.l@bigdata.co',
    referencePhone: '+1-555-0105',
    referenceTitle: 'VP of Analytics',
    referenceCompany: 'BigData Co',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Pending',
    sentDate: '',
    completedDate: '',
    expiresAt: '2025-03-12',
    token: 'token-rc-5',
  },
  {
    id: 'rc-6',
    applicationId: 'app-5',
    candidateName: 'David Kim',
    candidateEmail: 'david.k@email.com',
    candidateCurrentTitle: 'DevOps Engineer',
    referenceName: 'Sophie Taylor',
    referenceEmail: 'sophie.t@cloudnine.dev',
    referencePhone: '+1-555-0106',
    referenceTitle: 'CTO',
    referenceCompany: 'CloudNine',
    relationship: 'Direct Report',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Sent',
    sentDate: '2025-02-20',
    completedDate: '',
    expiresAt: '2025-03-06',
    token: 'token-rc-6',
  },
  {
    id: 'rc-7',
    applicationId: 'app-2',
    candidateName: 'Marcus Brown',
    candidateEmail: 'marcus.b@email.com',
    candidateCurrentTitle: 'UX Designer',
    referenceName: 'Carlos Ruiz',
    referenceEmail: 'carlos.r@pixelcraft.com',
    referencePhone: '+1-555-0107',
    referenceTitle: 'Lead Designer',
    referenceCompany: 'PixelCraft',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Sent',
    sentDate: '2025-02-18',
    completedDate: '',
    expiresAt: '2025-03-04',
    token: 'token-rc-7',
  },
  {
    id: 'rc-8',
    applicationId: 'app-3',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.s@email.com',
    candidateCurrentTitle: 'Software Engineer',
    referenceName: 'Fatima Al-Rashid',
    referenceEmail: 'fatima.ar@oldcorp.com',
    referencePhone: '+1-555-0108',
    referenceTitle: 'HR Director',
    referenceCompany: 'OldCorp',
    relationship: 'Other',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Expired',
    sentDate: '2024-12-01',
    completedDate: '',
    expiresAt: '2024-12-15',
    token: 'token-rc-8',
  },
];

// Star Rating Component
function StarRating({ rating, max = 5, size = 'sm' }: { rating: number | null; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  if (rating === null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  );
}

// Status Timeline Component
function StatusTimeline({ status, t }: { status: ReferenceCheckStatus; t: Record<string, string> }) {
  const steps = [
    { key: 'requested', label: t.pending || 'Requested', completed: true },
    { key: 'sent', label: t.sent || 'Sent', completed: ['Sent', 'Completed', 'Expired', 'Declined'].includes(status) },
    { key: 'inProgress', label: t.inProgress || 'In Progress', completed: ['Completed', 'Declined'].includes(status) },
    { key: 'completed', label: t.completed || 'Completed', completed: status === 'Completed' },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                step.completed
                  ? 'bg-slate-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 min-w-[24px] mt-[-16px]',
                steps[i + 1].completed
                  ? 'bg-slate-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ReferenceChecksContent() {
  const { t } = useI18n();
  const rt = t.referenceChecks as Record<string, string>;

  const [filterStatus, setFilterStatus] = useState<ReferenceCheckStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<ReferenceCheckItem | null>(null);
  const [referenceChecks, setReferenceChecks] = useState<ReferenceCheckItem[]>(mockReferenceChecks);

  // Create form state
  const [formApplicationId, setFormApplicationId] = useState('');
  const [formRefName, setFormRefName] = useState('');
  const [formRefEmail, setFormRefEmail] = useState('');
  const [formRefPhone, setFormRefPhone] = useState('');
  const [formRefTitle, setFormRefTitle] = useState('');
  const [formRefCompany, setFormRefCompany] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  const [formQuestions, setFormQuestions] = useState<string[]>([...defaultQuestions]);
  const [formExpiryDate, setFormExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Computed values
  const filteredChecks = useMemo(() => {
    return referenceChecks.filter((rc) => {
      if (filterStatus !== 'all' && rc.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          rc.candidateName.toLowerCase().includes(q) ||
          rc.referenceName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterStatus, searchQuery, referenceChecks]);

  const stats = useMemo(() => {
    const completed = referenceChecks.filter((r) => r.status === 'Completed');
    const ratingsSum = completed.reduce((sum, r) => sum + (r.rating || 0), 0);
    return {
      total: referenceChecks.length,
      pending: referenceChecks.filter((r) => r.status === 'Pending').length,
      completed: completed.length,
      avgRating: completed.length > 0 ? (ratingsSum / completed.length).toFixed(1) : '0',
    };
  }, [referenceChecks]);

  // Derived form values
  const selectedApplication = useMemo(() => {
    return mockApplications.find((a) => a.id === formApplicationId);
  }, [formApplicationId]);

  // Handlers
  const openDetail = (rc: ReferenceCheckItem) => {
    setSelectedCheck(rc);
    setDetailOpen(true);
  };

  const handleSendRequest = () => {
    if (!formApplicationId || !formRefName || !formRefEmail || !formRelationship) {
      toast.error(rt.validationError || 'Please fill in all required fields');
      return;
    }

    const app = mockApplications.find((a) => a.id === formApplicationId);
    if (!app) return;

    const newCheck: ReferenceCheckItem = {
      id: `rc-${Date.now()}`,
      applicationId: formApplicationId,
      candidateName: app.candidateName,
      candidateEmail: `${app.candidateName.toLowerCase().replace(' ', '.')}@email.com`,
      candidateCurrentTitle: '',
      referenceName: formRefName,
      referenceEmail: formRefEmail,
      referencePhone: formRefPhone,
      referenceTitle: formRefTitle,
      referenceCompany: formRefCompany,
      relationship: formRelationship,
      questions: formQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
      rating: null,
      status: 'Sent',
      sentDate: new Date().toISOString().split('T')[0],
      completedDate: '',
      expiresAt: formExpiryDate,
      token: `token-${Date.now()}`,
    };

    setReferenceChecks((prev) => [newCheck, ...prev]);
    toast.success(rt.requestSent || 'Reference check request sent');
    resetForm();
    setCreateOpen(false);
  };

  const handleResendRequest = (rc: ReferenceCheckItem) => {
    setReferenceChecks((prev) =>
      prev.map((r) =>
        r.id === rc.id
          ? { ...r, status: 'Sent' as ReferenceCheckStatus, sentDate: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast.success(rt.resendRequest || 'Request resent');
    setDetailOpen(false);
  };

  const handleMarkExpired = (rc: ReferenceCheckItem) => {
    setReferenceChecks((prev) =>
      prev.map((r) =>
        r.id === rc.id ? { ...r, status: 'Expired' as ReferenceCheckStatus } : r
      )
    );
    toast.success(rt.markExpired || 'Marked as expired');
    setDetailOpen(false);
  };

  const handleSendReminder = (rc: ReferenceCheckItem) => {
    toast.success(rt.sendReminder || 'Reminder sent');
  };

  const addQuestion = () => {
    setFormQuestions((prev) => [...prev, '']);
  };

  const updateQuestion = (index: number, value: string) => {
    setFormQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const removeQuestion = (index: number) => {
    setFormQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormApplicationId('');
    setFormRefName('');
    setFormRefEmail('');
    setFormRefPhone('');
    setFormRefTitle('');
    setFormRefCompany('');
    setFormRelationship('');
    setFormQuestions([...defaultQuestions]);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setFormExpiryDate(d.toISOString().split('T')[0]);
  };

  const allStatuses: (ReferenceCheckStatus | 'all')[] = ['all', 'Pending', 'Sent', 'Completed', 'Expired', 'Declined'];

  const getStatusLabel = (status: ReferenceCheckStatus): string => {
    const key = status.toLowerCase() as string;
    return rt[key] || status;
  };

  const getRelationshipLabel = (rel: string): string => {
    const keyMap: Record<string, string> = {
      Manager: rt.relationshipManager,
      Colleague: rt.relationshipColleague,
      'Direct Report': rt.relationshipDirectReport,
      Other: rt.relationshipOther,
    };
    return keyMap[rel] || rel;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{rt.title}</h1>
            <p className="text-sm text-muted-foreground">{rt.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          {rt.requestReference}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br bg-blue-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{rt.totalRequests}</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{rt.pendingRequests}</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{rt.completedRequests}</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{rt.averageRating}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-bold">{stats.avgRating}</p>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReferenceCheckStatus | 'all')}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={rt.status} />
          </SelectTrigger>
          <SelectContent>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? (rt.allStatuses || 'All Statuses') : getStatusLabel(s as ReferenceCheckStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={rt.searchPlaceholder || 'Search candidate or reference...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Reference Checks Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            {rt.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.candidateName}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.referenceName}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{rt.relationship}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{rt.company}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.status}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">{rt.rating}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">{rt.sentDate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">{rt.completedDate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{rt.actions || t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredChecks.map((rc) => {
                  const StatusIcon = statusIcons[rc.status];
                  return (
                    <tr
                      key={rc.id}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => openDetail(rc)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-600 text-white text-[9px]">
                              {getInitials(rc.candidateName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium block">{rc.candidateName}</span>
                            <span className="text-[10px] text-muted-foreground">{rc.candidateEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="text-sm font-medium block">{rc.referenceName}</span>
                          <span className="text-[10px] text-muted-foreground">{rc.referenceEmail}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-sm">{getRelationshipLabel(rc.relationship)}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-sm">{rc.referenceCompany}</span>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px] gap-1', statusColors[rc.status])}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(rc.status)}
                        </Badge>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <StarRating rating={rc.rating} />
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{rc.sentDate || '\u2014'}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{rc.completedDate || '\u2014'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openDetail(rc)}
                          >
                            <Eye className="h-3 w-3 me-1" />
                            {rt.viewDetails}
                          </Button>
                          {(rc.status === 'Pending' || rc.status === 'Sent') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => handleSendReminder(rc)}
                            >
                              <RefreshCw className="h-3 w-3 me-1" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredChecks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{rt.noReferenceChecks}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reference Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {rt.viewDetails}
            </DialogTitle>
          </DialogHeader>
          {selectedCheck && (
            <div className="space-y-6 py-2">
              {/* Status Timeline */}
              <div className="flex justify-center py-2">
                <StatusTimeline status={selectedCheck.status} t={rt} />
              </div>

              {/* Candidate Info Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    {rt.candidateName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(selectedCheck.candidateName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-semibold">{selectedCheck.candidateName}</p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedCheck.candidateEmail}
                      </div>
                      {selectedCheck.candidateCurrentTitle && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" />
                          {selectedCheck.candidateCurrentTitle}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reference Info Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    {rt.referenceName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.referenceName}</p>
                        <p className="font-medium">{selectedCheck.referenceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.referenceEmail}</p>
                        <p className="font-medium">{selectedCheck.referenceEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.referencePhone}</p>
                        <p className="font-medium">{selectedCheck.referencePhone || '\u2014'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.referenceTitle}</p>
                        <p className="font-medium">{selectedCheck.referenceTitle || '\u2014'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.company}</p>
                        <p className="font-medium">{selectedCheck.referenceCompany || '\u2014'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{rt.relationship}</p>
                        <p className="font-medium">{getRelationshipLabel(selectedCheck.relationship)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating Display */}
              {selectedCheck.rating !== null && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      {rt.rating}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-3">
                      <StarRating rating={selectedCheck.rating} size="lg" />
                      <span className="text-2xl font-bold text-blue-600">{selectedCheck.rating}/5</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions & Responses */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  {rt.questions} & {rt.responses}
                </h3>
                <div className="space-y-3">
                  {(selectedCheck.responses || selectedCheck.questions).map((item, i) => (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-blue-700 mb-1">
                          {i + 1}. {item.question}
                        </p>
                        {item.response ? (
                          <p className="text-sm text-muted-foreground">{item.response}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {rt.noResponse || 'No response yet'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {(selectedCheck.status === 'Pending' || selectedCheck.status === 'Sent' || selectedCheck.status === 'Expired') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                    onClick={() => handleResendRequest(selectedCheck)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {rt.resendRequest}
                  </Button>
                )}
                {(selectedCheck.status === 'Pending' || selectedCheck.status === 'Sent') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                    onClick={() => handleMarkExpired(selectedCheck)}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {rt.markExpired}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Reference Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              {rt.requestReference}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Select Application */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.selectApplication} *</label>
              <Select value={formApplicationId} onValueChange={setFormApplicationId}>
                <SelectTrigger>
                  <SelectValue placeholder={rt.selectApplication} />
                </SelectTrigger>
                <SelectContent>
                  {mockApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.candidateName} — {app.jobTitle} ({app.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-filled Candidate Name */}
            {selectedApplication && (
              <Card className="border-border/50 animate-fade-in-up">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(selectedApplication.candidateName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{selectedApplication.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{selectedApplication.jobTitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reference Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.referenceName} *</label>
                <Input
                  value={formRefName}
                  onChange={(e) => setFormRefName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.referenceEmail} *</label>
                <Input
                  type="email"
                  value={formRefEmail}
                  onChange={(e) => setFormRefEmail(e.target.value)}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.referencePhone}</label>
                <Input
                  value={formRefPhone}
                  onChange={(e) => setFormRefPhone(e.target.value)}
                  placeholder="+1-555-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.referenceTitle}</label>
                <Input
                  value={formRefTitle}
                  onChange={(e) => setFormRefTitle(e.target.value)}
                  placeholder="Engineering Manager"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.company}</label>
                <Input
                  value={formRefCompany}
                  onChange={(e) => setFormRefCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{rt.relationship} *</label>
                <Select value={formRelationship} onValueChange={setFormRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder={rt.relationship} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">{rt.relationshipManager}</SelectItem>
                    <SelectItem value="Colleague">{rt.relationshipColleague}</SelectItem>
                    <SelectItem value="Direct Report">{rt.relationshipDirectReport}</SelectItem>
                    <SelectItem value="Other">{rt.relationshipOther}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  {rt.questions}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                  onClick={addQuestion}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {rt.addQuestion}
                </Button>
              </div>
              <div className="space-y-2">
                {formQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <Input
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                      className="flex-1"
                      placeholder={`${rt.questionPlaceholder || 'Question'} ${i + 1}`}
                    />
                    {formQuestions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeQuestion(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{rt.expiryDate}</label>
              <Input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                {rt.expiryHint || 'Default: 14 days from today'}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={handleSendRequest}
            >
              <Send className="h-3.5 w-3.5 me-1.5" />
              {rt.sendRequest}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
