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
  FileCheck,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Send,
  Archive,
  Eye,
  Sparkles,
  DollarSign,
  Mail,
  User,
  Briefcase,
  MapPin,
  Building2,
  Loader2,
  PenTool,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

type OfferStatus = 'Draft' | 'Pending' | 'Sent' | 'Accepted' | 'Declined' | 'Withdrawn' | 'Expired';

type SigningStatus = 'PENDING' | 'SENT' | 'CANDIDATE_SIGNED' | 'COMPLETED' | 'EXPIRED' | 'DECLINED';

interface Offer {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateCurrentTitle: string;
  candidateInitials: string;
  jobTitle: string;
  department: string;
  location: string;
  salary: number;
  currency: string;
  equity: string;
  startDate: string;
  benefits: string;
  conditions: string;
  responseDeadline: string;
  notes: string;
  status: OfferStatus;
  sentDate: string;
  offerLetter: string;
  signingStatus: SigningStatus;
}

const statusColors: Record<OfferStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Sent: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  Accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Declined: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
  Withdrawn: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-0',
  Expired: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-0',
};

const statusIcons: Record<OfferStatus, React.ElementType> = {
  Draft: FileText,
  Pending: Clock,
  Sent: Send,
  Accepted: CheckCircle2,
  Declined: XCircle,
  Withdrawn: Archive,
  Expired: Clock,
};

const signingStatusColors: Record<SigningStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0',
  SENT: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  CANDIDATE_SIGNED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  EXPIRED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-0',
  DECLINED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
};

const signingStatusIcons: Record<SigningStatus, React.ElementType> = {
  PENDING: Clock,
  SENT: Send,
  CANDIDATE_SIGNED: PenTool,
  COMPLETED: CheckCircle2,
  EXPIRED: Clock,
  DECLINED: XCircle,
};

const initialOffers: Offer[] = [
  { id: 'o1', candidateName: 'Tom Anderson', candidateEmail: 'tom@email.com', candidateCurrentTitle: 'Software Engineer', candidateInitials: 'TA', jobTitle: 'Senior Frontend Engineer', department: 'Engineering', location: 'San Francisco', salary: 150000, currency: 'USD', equity: '0.1%', startDate: '2025-03-01', benefits: 'Health, Dental, Vision', conditions: 'Background check required', responseDeadline: '2025-02-15', notes: '', status: 'Draft', sentDate: '', offerLetter: '', signingStatus: 'PENDING' },
  { id: 'o2', candidateName: 'Priya Sharma', candidateEmail: 'priya@email.com', candidateCurrentTitle: 'Product Designer', candidateInitials: 'PS', jobTitle: 'UX Lead', department: 'Design', location: 'Remote', salary: 140000, currency: 'USD', equity: '0.15%', startDate: '2025-04-01', benefits: 'Health, Dental, Vision, 401k', conditions: 'Portfolio review', responseDeadline: '2025-03-01', notes: '', status: 'Pending', sentDate: '', offerLetter: '', signingStatus: 'PENDING' },
  { id: 'o3', candidateName: 'Sarah Chen', candidateEmail: 'sarah@email.com', candidateCurrentTitle: 'Backend Developer', candidateInitials: 'SC', jobTitle: 'Staff Engineer', department: 'Engineering', location: 'New York', salary: 180000, currency: 'USD', equity: '0.2%', startDate: '2025-03-15', benefits: 'Full benefits package', conditions: 'Reference check', responseDeadline: '2025-02-28', notes: '', status: 'Sent', sentDate: '2025-01-20', offerLetter: 'Dear Sarah...', signingStatus: 'SENT' },
  { id: 'o4', candidateName: 'Marcus Brown', candidateEmail: 'marcus@email.com', candidateCurrentTitle: 'Sales Manager', candidateInitials: 'MB', jobTitle: 'VP of Sales', department: 'Sales', location: 'Chicago', salary: 200000, currency: 'USD', equity: '0.3%', startDate: '2025-02-15', benefits: 'Full benefits + car allowance', conditions: 'Employment verification', responseDeadline: '2025-01-30', notes: '', status: 'Accepted', sentDate: '2025-01-10', offerLetter: 'Dear Marcus...', signingStatus: 'COMPLETED' },
  { id: 'o5', candidateName: 'Lisa Park', candidateEmail: 'lisa@email.com', candidateCurrentTitle: 'Marketing Director', candidateInitials: 'LP', jobTitle: 'CMO', department: 'Marketing', location: 'Los Angeles', salary: 190000, currency: 'USD', equity: '0.25%', startDate: '2025-04-01', benefits: 'Full benefits', conditions: 'Background check', responseDeadline: '2025-03-01', notes: '', status: 'Declined', sentDate: '2025-01-05', offerLetter: 'Dear Lisa...', signingStatus: 'DECLINED' },
  { id: 'o6', candidateName: 'Emily Zhang', candidateEmail: 'emily@email.com', candidateCurrentTitle: 'Data Scientist', candidateInitials: 'EZ', jobTitle: 'ML Engineer', department: 'Data', location: 'Seattle', salary: 170000, currency: 'USD', equity: '0.2%', startDate: '2025-05-01', benefits: 'Health, 401k', conditions: 'Technical assessment', responseDeadline: '2025-03-15', notes: '', status: 'Withdrawn', sentDate: '2025-01-12', offerLetter: '', signingStatus: 'PENDING' },
];

const initialApplications: { id: string; candidateName: string; jobTitle: string; department: string; location: string; status: string }[] = [];

const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED'];

function OfferTermsForm({ offer, t, onChange }: { offer: Partial<Offer>; t: Record<string, string>; onChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.salary}</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={offer.salary || ''}
              onChange={(e) => onChange('salary', e.target.value)}
              className="flex-1"
              placeholder="0"
            />
            <Select value={offer.currency || 'USD'} onValueChange={(v) => onChange('currency', v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.equity}</label>
          <Input
            value={offer.equity || ''}
            onChange={(e) => onChange('equity', e.target.value)}
            placeholder="0.1%"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.startDate}</label>
          <Input
            type="date"
            value={offer.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.responseDeadline}</label>
          <Input
            type="date"
            value={offer.responseDeadline || ''}
            onChange={(e) => onChange('responseDeadline', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.benefits}</label>
        <Textarea
          value={offer.benefits || ''}
          onChange={(e) => onChange('benefits', e.target.value)}
          placeholder={t.benefitsPlaceholder}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.conditions}</label>
        <Textarea
          value={offer.conditions || ''}
          onChange={(e) => onChange('conditions', e.target.value)}
          placeholder={t.conditionsPlaceholder}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.notes}</label>
        <Textarea
          value={offer.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={2}
        />
      </div>
    </div>
  );
}

export default function OffersContent() {
  const { t } = useI18n();
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [offerLetter, setOfferLetter] = useState('');
  const [formData, setFormData] = useState<Partial<Offer>>({});
  const [createLetter, setCreateLetter] = useState('');
  const [generatingCreateLetter, setGeneratingCreateLetter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const ot = t.offers as Record<string, string>;
  const est = t.eSignature as Record<string, string>;

  const filteredOffers = useMemo(() => {
    return initialOffers.filter((offer) => {
      if (filterStatus !== 'all' && offer.status !== filterStatus) return false;
      if (searchQuery && !offer.candidateName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: initialOffers.length,
    pending: initialOffers.filter(o => o.status === 'Pending').length,
    accepted: initialOffers.filter(o => o.status === 'Accepted').length,
    declined: initialOffers.filter(o => o.status === 'Declined').length,
  }), []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openDetail = (offer: Offer) => {
    setSelectedOffer(offer);
    setOfferLetter(offer.offerLetter);
    setDetailOpen(true);
  };

  const generateOfferLetter = () => {
    const offer = selectedOffer;
    if (!offer) return;
    setGeneratingLetter(true);
    setTimeout(() => {
      const letter = `Dear ${offer.candidateName},

We are delighted to extend an offer for the position of ${offer.jobTitle} at TechVision Inc.

Position: ${offer.jobTitle}
Department: ${offer.department}
Location: ${offer.location}
Start Date: ${offer.startDate}

Compensation:
- Base Salary: ${offer.currency} ${offer.salary.toLocaleString()} per year
- Equity: ${offer.equity} vested over 4 years

Benefits:
${offer.benefits}

Conditions:
${offer.conditions}

Please respond by ${offer.responseDeadline}.

We look forward to welcoming you to our team!

Best regards,
HR Team
TechVision Inc.`;
      setOfferLetter(letter);
      setGeneratingLetter(false);
      showToast(ot.letterGenerated);
    }, 1500);
  };

  const generateCreateLetter = () => {
    setGeneratingCreateLetter(true);
    setTimeout(() => {
      const name = formData.candidateName || 'Candidate';
      const job = formData.jobTitle || 'the position';
      const dept = formData.department || 'the department';
      const loc = formData.location || 'our office';
      const start = formData.startDate || 'TBD';
      const curr = formData.currency || 'USD';
      const sal = formData.salary ? `${curr} ${Number(formData.salary).toLocaleString()}` : 'Competitive';
      const eq = formData.equity || 'To be discussed';
      const letter = `Dear ${name},

We are thrilled to extend an offer for ${job} at TechVision Inc.

Position: ${job}
Department: ${dept}
Location: ${loc}
Start Date: ${start}

Compensation:
- Base Salary: ${sal} per year
- Equity: ${eq} vested over 4 years

${formData.benefits ? `Benefits:\n${formData.benefits}\n` : ''}${formData.conditions ? `Conditions:\n${formData.conditions}\n` : ''}${formData.responseDeadline ? `Please respond by ${formData.responseDeadline}.\n` : ''}
We look forward to welcoming you to our team!

Best regards,
HR Team
TechVision Inc.`;
      setCreateLetter(letter);
      setGeneratingCreateLetter(false);
      showToast(ot.letterGenerated);
    }, 1500);
  };

  const handleCreateOffer = (action: 'draft' | 'send') => {
    if (action === 'send') {
      showToast(ot.offerSent);
    } else {
      showToast(ot.offerSaved);
    }
    setCreateOpen(false);
    setFormData({});
    setCreateLetter('');
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const allStatuses: (OfferStatus | 'all')[] = ['all', 'Draft', 'Pending', 'Sent', 'Accepted', 'Declined', 'Withdrawn', 'Expired'];

  const getStatusLabel = (status: OfferStatus): string => {
    const key = `status${status}` as string;
    return ot[key] || status;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 end-4 z-50 animate-fade-in-up">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shadow-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{ot.title}</h1>
            <p className="text-sm text-muted-foreground">{ot.subtitle}</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
          onClick={() => {
            setFormData({});
            setCreateLetter('');
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          {ot.createOffer}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.totalOffers}</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.pending}</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.accepted}</p>
                <p className="text-xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ot.declined}</p>
                <p className="text-xl font-bold">{stats.declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as OfferStatus | 'all')}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={ot.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? ot.allStatuses : getStatusLabel(s as OfferStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={ot.searchOffers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-8 text-xs bg-accent/30 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/50"
          />
        </div>
      </div>

      {/* Offers Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {ot.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.candidate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.jobTitle}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.salary}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.startDate}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.status}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{est.signingStatus}</th>
                  <th className="text-start text-xs font-medium text-muted-foreground p-3">{ot.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const StatusIcon = statusIcons[offer.status];
                  return (
                    <tr
                      key={offer.id}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => openDetail(offer)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-[9px]">
                              {offer.candidateInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium block">{offer.candidateName}</span>
                            <span className="text-[10px] text-muted-foreground">{offer.candidateEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="text-sm block">{offer.jobTitle}</span>
                          <span className="text-[10px] text-muted-foreground">{offer.department}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">{offer.currency} {offer.salary.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">{offer.startDate || '\u2014'}</span>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px] gap-1', statusColors[offer.status])}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(offer.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px] gap-1', signingStatusColors[offer.signingStatus])}>
                          {React.createElement(signingStatusIcons[offer.signingStatus], { className: 'h-3 w-3' })}
                          {est[`status${offer.signingStatus.charAt(0) + offer.signingStatus.slice(1).toLowerCase()}` as string] || offer.signingStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openDetail(offer)}
                          >
                            <Eye className="h-3 w-3 me-1" />
                            {ot.viewDetails}
                          </Button>
                          {(offer.status === 'Draft' || offer.status === 'Pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700"
                              onClick={() => showToast(ot.offerSent)}
                            >
                              <Send className="h-3 w-3 me-1" />
                            </Button>
                          )}
                          {(offer.status === 'Sent' || offer.status === 'Pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                              onClick={() => showToast(est.signatureSent)}
                              title={est.sendForSignature}
                            >
                              <PenTool className="h-3 w-3 me-1" />
                            </Button>
                          )}
                          {(offer.status === 'Sent' || offer.status === 'Pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                              onClick={() => showToast(ot.offerWithdrawn)}
                            >
                              <Archive className="h-3 w-3 me-1" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOffers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{ot.noOffers}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Offer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-teal-600" />
              {ot.viewDetails}
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-6 py-2">
              {/* Candidate Info Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    {ot.candidateInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                        {selectedOffer.candidateInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-semibold">{selectedOffer.candidateName}</p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedOffer.candidateEmail}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {selectedOffer.candidateCurrentTitle}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Info Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    {ot.jobInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{ot.jobTitle}</p>
                        <p className="font-medium">{selectedOffer.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{ot.department}</p>
                        <p className="font-medium">{selectedOffer.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{ot.location}</p>
                        <p className="font-medium">{selectedOffer.location}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Terms */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {ot.offerTerms}
                </h3>
                <OfferTermsForm offer={selectedOffer} t={ot} onChange={() => {}} />
              </div>

              {/* Generate Offer Letter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    {ot.offerLetter}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                    onClick={generateOfferLetter}
                    disabled={generatingLetter}
                  >
                    {generatingLetter ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {generatingLetter ? ot.generating : ot.generateWithAI}
                  </Button>
                </div>
                <Textarea
                  value={offerLetter}
                  onChange={(e) => setOfferLetter(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder={ot.letterPlaceholder}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {(selectedOffer.status === 'Draft' || selectedOffer.status === 'Pending') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showToast(ot.offerSaved);
                        setDetailOpen(false);
                      }}
                    >
                      {ot.saveDraft}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
                      onClick={() => {
                        showToast(ot.offerSent);
                        setDetailOpen(false);
                      }}
                    >
                      <Send className="h-3.5 w-3.5 me-1.5" />
                      {ot.sendOffer}
                    </Button>
                  </>
                )}
                {(selectedOffer.status === 'Sent' || selectedOffer.status === 'Pending') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => {
                      showToast(ot.offerWithdrawn);
                      setDetailOpen(false);
                    }}
                  >
                    <Archive className="h-3.5 w-3.5 me-1.5" />
                    {ot.withdrawOffer}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Offer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              {ot.createOffer}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Select Application */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{ot.selectApplication}</label>
              <Select onValueChange={(v) => {
                const app = initialApplications.find(a => a.id === v);
                if (app) {
                  setFormData(prev => ({
                    ...prev,
                    candidateName: app.candidateName,
                    jobTitle: app.jobTitle,
                    department: app.department,
                    location: app.location,
                    candidateInitials: app.candidateName.split(' ').map(n => n[0]).join(''),
                    candidateEmail: `${app.candidateName.toLowerCase().replace(' ', '.')}@email.com`,
                  }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={ot.selectApplicationPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {initialApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.candidateName} — {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pre-filled Candidate Info */}
            {formData.candidateName && (
              <Card className="border-border/50 animate-scale-in-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                        {formData.candidateInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{formData.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{formData.candidateEmail}</p>
                      <p className="text-xs text-muted-foreground">{formData.jobTitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Offer Terms Form */}
            <OfferTermsForm
              offer={{
                salary: formData.salary,
                currency: formData.currency || 'USD',
                equity: formData.equity,
                startDate: formData.startDate,
                benefits: formData.benefits,
                conditions: formData.conditions,
                responseDeadline: formData.responseDeadline,
                notes: formData.notes,
              }}
              t={ot}
              onChange={handleFormChange}
            />

            {/* Generate Offer Letter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  {ot.offerLetter}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950"
                  onClick={generateCreateLetter}
                  disabled={generatingCreateLetter}
                >
                  {generatingCreateLetter ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generatingCreateLetter ? ot.generating : ot.generateWithAI}
                </Button>
              </div>
              <Textarea
                value={createLetter}
                onChange={(e) => setCreateLetter(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                placeholder={ot.letterPlaceholder}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              variant="outline"
              onClick={() => handleCreateOffer('draft')}
            >
              {ot.saveDraft}
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700"
              onClick={() => handleCreateOffer('send')}
            >
              <Send className="h-3.5 w-3.5 me-1.5" />
              {ot.sendOffer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
