// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Users,
  Link2,
  Building2,
  UserCheck,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Info,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Source {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
}

interface SourceAnalytics {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  applications: number;
  hired: number;
  conversionRate: number;
  avgTimeToHire: number;
  costPerHire: number;
}

interface AttributionRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  sourceName: string;
  sourceType: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  appliedAt: string;
  status: string;
}

const SOURCE_TYPE_ICONS: Record<string, React.ElementType> = {
  JOB_BOARD: Globe,
  REFERRAL: Users,
  SOCIAL: Link2,
  CAREER_PAGE: Building2,
  AGENCY: UserCheck,
  DIRECT: ArrowRight,
  OTHER: BarChart3,
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  JOB_BOARD: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  REFERRAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  SOCIAL: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  CAREER_PAGE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  AGENCY: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  DIRECT: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Pre-seeded sources
const INITIAL_SOURCES: Source[] = [
  { id: 's1', name: 'LinkedIn', type: 'JOB_BOARD', isDefault: false, isActive: true },
  { id: 's2', name: 'Indeed', type: 'JOB_BOARD', isDefault: false, isActive: true },
  { id: 's3', name: 'Glassdoor', type: 'JOB_BOARD', isDefault: false, isActive: true },
  { id: 's4', name: 'Referral', type: 'REFERRAL', isDefault: false, isActive: true },
  { id: 's5', name: 'Career Page', type: 'CAREER_PAGE', isDefault: true, isActive: true },
  { id: 's6', name: 'Direct', type: 'DIRECT', isDefault: false, isActive: true },
  { id: 's7', name: 'Social Media', type: 'SOCIAL', isDefault: false, isActive: true },
  { id: 's8', name: 'Agency', type: 'AGENCY', isDefault: false, isActive: false },
];

// Mock analytics data
const MOCK_ANALYTICS: SourceAnalytics[] = [
  { sourceId: 's1', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', applications: 45, hired: 8, conversionRate: 18, avgTimeToHire: 28, costPerHire: 250 },
  { sourceId: 's2', sourceName: 'Indeed', sourceType: 'JOB_BOARD', applications: 38, hired: 5, conversionRate: 13, avgTimeToHire: 32, costPerHire: 200 },
  { sourceId: 's3', sourceName: 'Glassdoor', sourceType: 'JOB_BOARD', applications: 22, hired: 3, conversionRate: 14, avgTimeToHire: 30, costPerHire: 180 },
  { sourceId: 's4', sourceName: 'Referral', sourceType: 'REFERRAL', applications: 15, hired: 6, conversionRate: 40, avgTimeToHire: 18, costPerHire: 500 },
  { sourceId: 's5', sourceName: 'Career Page', sourceType: 'CAREER_PAGE', applications: 30, hired: 4, conversionRate: 13, avgTimeToHire: 25, costPerHire: 50 },
  { sourceId: 's6', sourceName: 'Direct', sourceType: 'DIRECT', applications: 12, hired: 3, conversionRate: 25, avgTimeToHire: 22, costPerHire: 0 },
  { sourceId: 's7', sourceName: 'Social Media', sourceType: 'SOCIAL', applications: 18, hired: 2, conversionRate: 11, avgTimeToHire: 35, costPerHire: 150 },
  { sourceId: 's8', sourceName: 'Agency', sourceType: 'AGENCY', applications: 8, hired: 2, conversionRate: 25, avgTimeToHire: 20, costPerHire: 2000 },
];

// Mock attribution records (30+)
const MOCK_ATTRIBUTIONS: AttributionRecord[] = [
  { id: 'at1', candidateName: 'Sarah Chen', candidateEmail: 'sarah@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'job_post', utmCampaign: 'fe_hiring_q1', utmContent: 'senior_role', appliedAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'INTERVIEW' },
  { id: 'at2', candidateName: 'Marcus Brown', candidateEmail: 'marcus@example.com', jobTitle: 'Product Designer', sourceName: 'Referral', sourceType: 'REFERRAL', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'HIRED' },
  { id: 'at3', candidateName: 'Priya Sharma', candidateEmail: 'priya@example.com', jobTitle: 'Backend Developer', sourceName: 'Indeed', sourceType: 'JOB_BOARD', utmSource: 'indeed', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'OFFERED' },
  { id: 'at4', candidateName: 'David Kim', candidateEmail: 'david@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Career Page', sourceType: 'CAREER_PAGE', utmSource: 'website', utmMedium: 'organic', utmCampaign: 'brand', utmContent: 'careers_page', appliedAt: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'HIRED' },
  { id: 'at5', candidateName: 'Lisa Park', candidateEmail: 'lisa@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Social Media', sourceType: 'SOCIAL', utmSource: 'twitter', utmMedium: 'social', utmCampaign: 'tech_hiring', utmContent: 'tweet_123', appliedAt: new Date(Date.now() - 86400000 * 6).toISOString(), status: 'SCREENING' },
  { id: 'at6', candidateName: 'Tom Anderson', candidateEmail: 'tom@example.com', jobTitle: 'Backend Developer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'sponsored', utmCampaign: 'be_hiring_q1', utmContent: 'inmail', appliedAt: new Date(Date.now() - 86400000 * 7).toISOString(), status: 'INTERVIEW' },
  { id: 'at7', candidateName: 'Emily Zhang', candidateEmail: 'emily@example.com', jobTitle: 'Product Designer', sourceName: 'Glassdoor', sourceType: 'JOB_BOARD', utmSource: 'glassdoor', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 8).toISOString(), status: 'REJECTED' },
  { id: 'at8', candidateName: 'Ryan Cooper', candidateEmail: 'ryan@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Referral', sourceType: 'REFERRAL', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 9).toISOString(), status: 'HIRED' },
  { id: 'at9', candidateName: 'Aisha Mohamed', candidateEmail: 'aisha@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Agency', sourceType: 'AGENCY', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'OFFERED' },
  { id: 'at10', candidateName: 'Carlos Ruiz', candidateEmail: 'carlos@example.com', jobTitle: 'Backend Developer', sourceName: 'Direct', sourceType: 'DIRECT', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 11).toISOString(), status: 'HIRED' },
  { id: 'at11', candidateName: 'Sophie Taylor', candidateEmail: 'sophie@example.com', jobTitle: 'Product Designer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'job_post', utmCampaign: 'design_q1', utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 12).toISOString(), status: 'SCREENING' },
  { id: 'at12', candidateName: 'Olivia Martinez', candidateEmail: 'olivia@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Indeed', sourceType: 'JOB_BOARD', utmSource: 'indeed', utmMedium: 'sponsored', utmCampaign: 'fe_hiring_q1', utmContent: 'premium_listing', appliedAt: new Date(Date.now() - 86400000 * 13).toISOString(), status: 'APPLIED' },
  { id: 'at13', candidateName: 'James Wilson', candidateEmail: 'james@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Career Page', sourceType: 'CAREER_PAGE', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 14).toISOString(), status: 'INTERVIEW' },
  { id: 'at14', candidateName: 'Fatima Al-Rashid', candidateEmail: 'fatima@example.com', jobTitle: 'Backend Developer', sourceName: 'Social Media', sourceType: 'SOCIAL', utmSource: 'facebook', utmMedium: 'paid_social', utmCampaign: 'tech_hiring_q1', utmContent: 'backend_ad', appliedAt: new Date(Date.now() - 86400000 * 15).toISOString(), status: 'REJECTED' },
  { id: 'at15', candidateName: 'Michael Lee', candidateEmail: 'michael@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'job_post', utmCampaign: 'fe_hiring_q1', utmContent: 'senior_role', appliedAt: new Date(Date.now() - 86400000 * 16).toISOString(), status: 'HIRED' },
  { id: 'at16', candidateName: 'Rachel Green', candidateEmail: 'rachel@example.com', jobTitle: 'Product Designer', sourceName: 'Glassdoor', sourceType: 'JOB_BOARD', utmSource: 'glassdoor', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 17).toISOString(), status: 'APPLIED' },
  { id: 'at17', candidateName: 'Daniel Brown', candidateEmail: 'daniel@example.com', jobTitle: 'Backend Developer', sourceName: 'Referral', sourceType: 'REFERRAL', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 18).toISOString(), status: 'OFFERED' },
  { id: 'at18', candidateName: 'Nina Patel', candidateEmail: 'nina@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Indeed', sourceType: 'JOB_BOARD', utmSource: 'indeed', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 19).toISOString(), status: 'SCREENING' },
  { id: 'at19', candidateName: 'Chris Evans', candidateEmail: 'chris@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Direct', sourceType: 'DIRECT', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'HIRED' },
  { id: 'at20', candidateName: 'Amanda Torres', candidateEmail: 'amanda@example.com', jobTitle: 'Product Designer', sourceName: 'Career Page', sourceType: 'CAREER_PAGE', utmSource: 'website', utmMedium: 'organic', utmCampaign: 'brand', utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 21).toISOString(), status: 'INTERVIEW' },
  { id: 'at21', candidateName: 'Kevin Chang', candidateEmail: 'kevin@example.com', jobTitle: 'Backend Developer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'sponsored', utmCampaign: 'be_hiring_q1', utmContent: 'inmail', appliedAt: new Date(Date.now() - 86400000 * 22).toISOString(), status: 'REJECTED' },
  { id: 'at22', candidateName: 'Jessica Nguyen', candidateEmail: 'jessica@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Agency', sourceType: 'AGENCY', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 23).toISOString(), status: 'OFFERED' },
  { id: 'at23', candidateName: 'Brandon Lee', candidateEmail: 'brandon@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Social Media', sourceType: 'SOCIAL', utmSource: 'linkedin', utmMedium: 'social', utmCampaign: 'tech_hiring', utmContent: 'post_456', appliedAt: new Date(Date.now() - 86400000 * 24).toISOString(), status: 'APPLIED' },
  { id: 'at24', candidateName: 'Maria Santos', candidateEmail: 'maria@example.com', jobTitle: 'Product Designer', sourceName: 'Indeed', sourceType: 'JOB_BOARD', utmSource: 'indeed', utmMedium: 'job_post', utmCampaign: 'design_q1', utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 25).toISOString(), status: 'HIRED' },
  { id: 'at25', candidateName: 'Alex Turner', candidateEmail: 'alex@example.com', jobTitle: 'Backend Developer', sourceName: 'Referral', sourceType: 'REFERRAL', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 26).toISOString(), status: 'INTERVIEW' },
  { id: 'at26', candidateName: 'Emma Williams', candidateEmail: 'emma@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Glassdoor', sourceType: 'JOB_BOARD', utmSource: 'glassdoor', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 27).toISOString(), status: 'SCREENING' },
  { id: 'at27', candidateName: 'Robert Kim', candidateEmail: 'robert@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Career Page', sourceType: 'CAREER_PAGE', utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'brand_keywords', utmContent: 'careers_landing', appliedAt: new Date(Date.now() - 86400000 * 28).toISOString(), status: 'HIRED' },
  { id: 'at28', candidateName: 'Sarah Johnson', candidateEmail: 'sjohnson@example.com', jobTitle: 'Product Designer', sourceName: 'LinkedIn', sourceType: 'JOB_BOARD', utmSource: 'linkedin', utmMedium: 'job_post', utmCampaign: 'design_q1', utmContent: 'senior_pd', appliedAt: new Date(Date.now() - 86400000 * 29).toISOString(), status: 'APPLIED' },
  { id: 'at29', candidateName: 'Tyler Brooks', candidateEmail: 'tyler@example.com', jobTitle: 'Backend Developer', sourceName: 'Direct', sourceType: 'DIRECT', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 30).toISOString(), status: 'REJECTED' },
  { id: 'at30', candidateName: 'Lily Wang', candidateEmail: 'lily@example.com', jobTitle: 'DevOps Engineer', sourceName: 'Indeed', sourceType: 'JOB_BOARD', utmSource: 'indeed', utmMedium: 'organic', utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 31).toISOString(), status: 'OFFERED' },
  { id: 'at31', candidateName: 'Hassan Ali', candidateEmail: 'hassan@example.com', jobTitle: 'Sr. Frontend Engineer', sourceName: 'Social Media', sourceType: 'SOCIAL', utmSource: 'facebook', utmMedium: 'paid_social', utmCampaign: 'tech_hiring_q1', utmContent: 'frontend_ad', appliedAt: new Date(Date.now() - 86400000 * 32).toISOString(), status: 'INTERVIEW' },
  { id: 'at32', candidateName: 'Grace Kim', candidateEmail: 'grace@example.com', jobTitle: 'Product Designer', sourceName: 'Agency', sourceType: 'AGENCY', utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, appliedAt: new Date(Date.now() - 86400000 * 33).toISOString(), status: 'HIRED' },
];

export default function SourcesContent() {
  const { t } = useI18n();
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
  const [activeTab, setActiveTab] = useState<string>('sources');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Source | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('JOB_BOARD');
  const [formDefault, setFormDefault] = useState(false);
  const [filterSourceType, setFilterSourceType] = useState<string>('all');

  // Stats
  const totalSources = sources.length;
  const totalApplications = MOCK_ATTRIBUTIONS.length;
  const bestSource = MOCK_ANALYTICS.reduce((best, curr) => curr.conversionRate > best.conversionRate ? curr : best, MOCK_ANALYTICS[0]);
  const avgTimeToHire = Math.round(MOCK_ANALYTICS.reduce((sum, a) => sum + a.avgTimeToHire, 0) / MOCK_ANALYTICS.length);

  // Bar chart data (CSS-based)
  const maxApplications = Math.max(...MOCK_ANALYTICS.map((a) => a.applications));

  // Filtered attributions
  const filteredAttributions = useMemo(() => {
    let filtered = MOCK_ATTRIBUTIONS;
    if (filterSourceType !== 'all') {
      filtered = filtered.filter((a) => a.sourceType === filterSourceType);
    }
    return filtered;
  }, [filterSourceType]);

  // UTM-tagged applications
  const utmApplications = MOCK_ATTRIBUTIONS.filter((a) => a.utmSource);

  const handleCreateSource = () => {
    if (!formName.trim()) return;

    if (editingSource) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === editingSource.id
            ? { ...s, name: formName, type: formType, isDefault: formDefault }
            : formDefault ? { ...s, isDefault: false } : s
        )
      );
      toast.success(t.sources.sourceUpdated);
    } else {
      const newSource: Source = {
        id: `s_${Date.now()}`,
        name: formName,
        type: formType,
        isDefault: formDefault,
        isActive: true,
      };
      if (formDefault) {
        setSources((prev) => [{ ...newSource }, ...prev.map((s) => ({ ...s, isDefault: false }))]);
      } else {
        setSources((prev) => [...prev, newSource]);
      }
      toast.success(t.sources.sourceCreated);
    }

    setShowCreateDialog(false);
    setEditingSource(null);
    setFormName('');
    setFormType('JOB_BOARD');
    setFormDefault(false);
  };

  const handleDeleteSource = () => {
    if (!deleteConfirm) return;
    setSources((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
    toast.success(t.sources.sourceDeleted);
    setDeleteConfirm(null);
  };

  const handleToggleActive = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const openEditDialog = (source: Source) => {
    setEditingSource(source);
    setFormName(source.name);
    setFormType(source.type);
    setFormDefault(source.isDefault);
    setShowCreateDialog(true);
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingSource(null);
    setFormName('');
    setFormType('JOB_BOARD');
    setFormDefault(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.sources.title}</h1>
          <p className="text-muted-foreground mt-1">{t.sources.subtitle}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 me-2" />
          {t.sources.createSource}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSources}</p>
              <p className="text-xs text-muted-foreground">{t.sources.totalSources}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalApplications}</p>
              <p className="text-xs text-muted-foreground">{t.sources.applicationsBySource}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bestSource.sourceName}</p>
              <p className="text-xs text-muted-foreground">{t.sources.bestSource} ({bestSource.conversionRate}%)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgTimeToHire}</p>
              <p className="text-xs text-muted-foreground">{t.sources.avgTimeToHire}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sources">{t.sources.configureSources}</TabsTrigger>
          <TabsTrigger value="analytics">{t.sources.analytics}</TabsTrigger>
          <TabsTrigger value="utm">{t.sources.utmParameters}</TabsTrigger>
          <TabsTrigger value="attribution">{t.sources.attribution}</TabsTrigger>
        </TabsList>

        {/* Sources Configuration Tab */}
        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.sources.configureSources}</CardTitle>
              <CardDescription>Manage your application sources and tracking channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sources.map((source) => {
                  const Icon = SOURCE_TYPE_ICONS[source.type] || BarChart3;
                  const typeColor = SOURCE_TYPE_COLORS[source.type] || '';
                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{source.name}</span>
                            <Badge className={cn('text-[10px] h-4 px-1.5 border-0', typeColor)}>
                              {t.sources[`type${source.type.charAt(0) + source.type.slice(1).toLowerCase()}` as keyof typeof t.sources] || source.type.replace('_', ' ')}
                            </Badge>
                            {source.isDefault && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                                <Star className="w-2.5 h-2.5 me-0.5" />
                                {t.sources.defaultSource}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={source.isActive}
                            onCheckedChange={() => handleToggleActive(source.id)}
                            className="data-[state=checked]:bg-teal-600"
                          />
                          <span className="text-xs text-muted-foreground">
                            {source.isActive ? t.sources.isActive : 'Inactive'}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(source)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteConfirm(source)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.sources.applicationsBySource}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ANALYTICS.map((item) => {
                  const widthPercent = maxApplications > 0 ? (item.applications / maxApplications) * 100 : 0;
                  const barColor = item.conversionRate >= 30 ? 'bg-emerald-500' : item.conversionRate >= 15 ? 'bg-teal-500' : 'bg-amber-500';
                  return (
                    <div key={item.sourceId} className="flex items-center gap-3">
                      <span className="text-sm w-28 shrink-0 truncate font-medium">{item.sourceName}</span>
                      <div className="flex-1 bg-accent rounded-full h-7 relative overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', barColor)}
                          style={{ width: `${widthPercent}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                          {item.applications} {t.sources.applications.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.sources.analytics}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.sources.sourceName}</TableHead>
                      <TableHead className="text-center">{t.sources.applications}</TableHead>
                      <TableHead className="text-center">{t.sources.hired}</TableHead>
                      <TableHead className="text-center">{t.sources.conversionRate}</TableHead>
                      <TableHead className="text-center">{t.sources.avgTimeToHire}</TableHead>
                      <TableHead className="text-center">{t.sources.costPerHire}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_ANALYTICS.map((item) => (
                      <TableRow key={item.sourceId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.conversionRate >= 30 ? '#10b981' : item.conversionRate >= 15 ? '#14b8a6' : '#f59e0b' }} />
                            <span className="font-medium text-sm">{item.sourceName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.applications}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                            {item.hired}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'text-sm font-medium',
                            item.conversionRate >= 30 ? 'text-emerald-600 dark:text-emerald-400' :
                            item.conversionRate >= 15 ? 'text-teal-600 dark:text-teal-400' :
                            'text-amber-600 dark:text-amber-400'
                          )}>
                            {item.conversionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">{item.avgTimeToHire} {t.sources.days}</TableCell>
                        <TableCell className="text-center text-sm">
                          {item.costPerHire > 0 ? `$${item.costPerHire}` : 'Free'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UTM Parameters Tab */}
        <TabsContent value="utm" className="mt-4 space-y-4">
          <Card className="border-teal-200 dark:border-teal-800">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{t.sources.utmParameters}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.sources.utmInfo}</p>
                  <div className="mt-3 p-3 bg-accent/50 rounded-lg font-mono text-xs">
                    https://careers.yourcompany.com/jobs/frontend?utm_source=linkedin&utm_medium=job_post&utm_campaign=fe_hiring_q1&utm_content=senior_role
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.sources.recentUtmApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>{t.sources.utmSource}</TableHead>
                      <TableHead>{t.sources.utmMedium}</TableHead>
                      <TableHead>{t.sources.utmCampaign}</TableHead>
                      <TableHead>{t.sources.utmContent}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmApplications.slice(0, 10).map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{app.candidateName}</p>
                            <p className="text-xs text-muted-foreground">{app.jobTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] h-5 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                            {app.utmSource}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{app.utmMedium || '—'}</TableCell>
                        <TableCell className="text-sm">{app.utmCampaign || '—'}</TableCell>
                        <TableCell className="text-sm">{app.utmContent || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{t.sources.attribution}</CardTitle>
                  <CardDescription>Source attribution for all applications</CardDescription>
                </div>
                <Select value={filterSourceType} onValueChange={setFilterSourceType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Source Types</SelectItem>
                    <SelectItem value="JOB_BOARD">{t.sources.typeJobBoard}</SelectItem>
                    <SelectItem value="REFERRAL">{t.sources.typeReferral}</SelectItem>
                    <SelectItem value="SOCIAL">{t.sources.typeSocial}</SelectItem>
                    <SelectItem value="CAREER_PAGE">{t.sources.typeCareerPage}</SelectItem>
                    <SelectItem value="AGENCY">{t.sources.typeAgency}</SelectItem>
                    <SelectItem value="DIRECT">{t.sources.typeDirect}</SelectItem>
                    <SelectItem value="OTHER">{t.sources.typeOther}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>UTM Params</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttributions.map((app) => {
                      const statusColor: Record<string, string> = {
                        APPLIED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                        SCREENING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                        INTERVIEW: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
                        OFFERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                        HIRED: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                        REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                      };
                      const hasUtm = app.utmSource || app.utmMedium;
                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{app.candidateName}</p>
                              <p className="text-xs text-muted-foreground">{app.candidateEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{app.jobTitle}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge className={cn('text-[10px] h-5 border-0', SOURCE_TYPE_COLORS[app.sourceType])}>
                                {app.sourceName}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasUtm ? (
                              <div className="flex gap-1 flex-wrap">
                                {app.utmSource && <Badge variant="outline" className="text-[9px] h-4 px-1">{app.utmSource}</Badge>}
                                {app.utmMedium && <Badge variant="outline" className="text-[9px] h-4 px-1">{app.utmMedium}</Badge>}
                                {app.utmCampaign && <Badge variant="outline" className="text-[9px] h-4 px-1">{app.utmCampaign}</Badge>}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px] h-5 border-0', statusColor[app.status] || '')}>
                              {app.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Source Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSource ? t.sources.editSource : t.sources.createSource}</DialogTitle>
            <DialogDescription>
              {editingSource ? 'Update the source details' : 'Add a new application source to track candidates'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.sources.sourceName}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.sources.sourceNamePlaceholder}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t.sources.sourceType}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JOB_BOARD">{t.sources.typeJobBoard}</SelectItem>
                  <SelectItem value="REFERRAL">{t.sources.typeReferral}</SelectItem>
                  <SelectItem value="SOCIAL">{t.sources.typeSocial}</SelectItem>
                  <SelectItem value="CAREER_PAGE">{t.sources.typeCareerPage}</SelectItem>
                  <SelectItem value="AGENCY">{t.sources.typeAgency}</SelectItem>
                  <SelectItem value="DIRECT">{t.sources.typeDirect}</SelectItem>
                  <SelectItem value="OTHER">{t.sources.typeOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formDefault}
                onCheckedChange={setFormDefault}
                className="data-[state=checked]:bg-teal-600"
              />
              <Label>{t.sources.isDefault}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
            <Button onClick={handleCreateSource} disabled={!formName.trim()} className="bg-teal-600 hover:bg-teal-700">
              {editingSource ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.sources.deleteSource}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.sources.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSource} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
