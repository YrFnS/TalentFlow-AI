'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  CheckCircle2,
  Clipboard,
  Eye,
  FileCheck,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type OfferStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'EXPIRED';

type OfferRecord = {
  id: string;
  applicationId: string;
  status: OfferStatus;
  signingStatus: string;
  salary: number | null;
  salaryCurrency: string;
  equity: string | null;
  startDate: string | null;
  benefits: string[];
  conditions: string[];
  letterText: string | null;
  responseDeadline: string | null;
  notes: string | null;
  candidate: {
    name: string;
    email: string;
    image: string | null;
    currentTitle: string | null;
  } | null;
  job: { title: string; location: string | null } | null;
  company: { name: string } | null;
};

type ApplicationOption = {
  id: string;
  status: string;
  candidate: {
    currentTitle: string | null;
    user: { name: string; email: string; image: string | null };
  };
  job: { title: string; company: { name: string } };
};

type OfferForm = {
  applicationId: string;
  salary: string;
  salaryCurrency: string;
  equity: string;
  startDate: string;
  responseDeadline: string;
  benefits: string;
  conditions: string;
  notes: string;
  letterText: string;
};

const EMPTY_FORM: OfferForm = {
  applicationId: '',
  salary: '',
  salaryCurrency: 'USD',
  equity: '',
  startDate: '',
  responseDeadline: '',
  benefits: '',
  conditions: '',
  notes: '',
  letterText: '',
};

const STATUS_STYLE: Record<OfferStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING: 'bg-amber-500/10 text-amber-700',
  SENT: 'bg-primary/10 text-primary',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-700',
  DECLINED: 'bg-destructive/10 text-destructive',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  EXPIRED: 'bg-amber-500/10 text-amber-700',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMoney(value: number | null, currency: string) {
  if (!value) return 'Not set';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function offerToForm(offer: OfferRecord): OfferForm {
  return {
    applicationId: offer.applicationId,
    salary: offer.salary ? String(offer.salary) : '',
    salaryCurrency: offer.salaryCurrency,
    equity: offer.equity || '',
    startDate: offer.startDate || '',
    responseDeadline: offer.responseDeadline
      ? new Date(offer.responseDeadline).toISOString().slice(0, 10)
      : '',
    benefits: offer.benefits.join('\n'),
    conditions: offer.conditions.join('\n'),
    notes: offer.notes || '',
    letterText: offer.letterText || '',
  };
}

export default function OffersContent() {
  const { user, validateSession } = useAuth();
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OfferStatus>('all');
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<OfferRecord | null>(null);
  const [selected, setSelected] = useState<OfferRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [signingLink, setSigningLink] = useState('');

  const canEdit = [
    'SUPER_ADMIN',
    'ADMIN',
    'COMPANY_ADMIN',
    'HR_MANAGER',
    'RECRUITER',
  ].includes(user?.role || '');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [offersResponse, applicationsResponse] = await Promise.all([
        fetch('/api/offers', { cache: 'no-store' }),
        fetch('/api/applications', { cache: 'no-store' }),
      ]);
      if (!offersResponse.ok) {
        throw new Error(
          await getApiErrorMessage(offersResponse, 'Unable to load offers'),
        );
      }

      const offerData = await offersResponse.json();
      const applicationData = applicationsResponse.ok
        ? await applicationsResponse.json()
        : [];
      setOffers(Array.isArray(offerData) ? offerData : []);
      setApplications(
        Array.isArray(applicationData)
          ? applicationData.filter(
              (application: ApplicationOption) =>
                !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(application.status),
            )
          : [],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const activeApplicationIds = useMemo(
    () =>
      new Set(
        offers
          .filter((offer) =>
            ['DRAFT', 'PENDING', 'SENT', 'ACCEPTED'].includes(offer.status),
          )
          .map((offer) => offer.applicationId),
      ),
    [offers],
  );

  const availableApplications = applications.filter(
    (application) =>
      editing?.applicationId === application.id ||
      !activeApplicationIds.has(application.id),
  );

  const selectedApplication = applications.find(
    (application) => application.id === form.applicationId,
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return offers.filter((offer) => {
      if (status !== 'all' && offer.status !== status) return false;
      if (!term) return true;
      return Boolean(
        offer.candidate?.name.toLowerCase().includes(term) ||
          offer.candidate?.email.toLowerCase().includes(term) ||
          offer.job?.title.toLowerCase().includes(term),
      );
    });
  }, [offers, query, status]);

  const stats = useMemo(
    () => ({
      total: offers.length,
      sent: offers.filter((offer) => offer.status === 'SENT').length,
      accepted: offers.filter((offer) => offer.status === 'ACCEPTED').length,
      declined: offers.filter((offer) => offer.status === 'DECLINED').length,
    }),
    [offers],
  );

  const statCards: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
  }> = [
    { label: 'Total offers', value: stats.total, icon: FileCheck },
    { label: 'Awaiting response', value: stats.sent, icon: Mail },
    { label: 'Accepted', value: stats.accepted, icon: CheckCircle2 },
    { label: 'Declined', value: stats.declined, icon: XCircle },
  ];

  function createOffer() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function editOffer(offer: OfferRecord) {
    setDetailOpen(false);
    setEditing(offer);
    setForm(offerToForm(offer));
    setEditorOpen(true);
  }

  function viewOffer(offer: OfferRecord) {
    setSelected(offer);
    setDetailOpen(true);
  }

  function generateLetter() {
    if (!selectedApplication || !form.salary) {
      toast.error('Select an application and enter the salary first');
      return;
    }

    const salary = formatMoney(Number(form.salary), form.salaryCurrency);
    setForm((current) => ({
      ...current,
      letterText: `Dear ${selectedApplication.candidate.user.name},\n\nWe are pleased to offer you the position of ${selectedApplication.job.title} at ${selectedApplication.job.company.name}.\n\nBase salary: ${salary} per year${current.equity ? `\nEquity: ${current.equity}` : ''}${current.startDate ? `\nProposed start date: ${current.startDate}` : ''}\n\nWe look forward to welcoming you to the team.\n\nSincerely,\n${selectedApplication.job.company.name}`,
    }));
  }

  async function saveOffer() {
    if (!form.applicationId || !form.salary) {
      toast.error('Application and salary are required');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(
        editing ? `/api/offers/${editing.id}` : '/api/offers',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: form.applicationId,
            salary: Number(form.salary),
            salaryCurrency: form.salaryCurrency,
            equity: form.equity || undefined,
            startDate: form.startDate || undefined,
            responseDeadline: form.responseDeadline || undefined,
            benefits: parseLines(form.benefits),
            conditions: parseLines(form.conditions),
            notes: form.notes || undefined,
            letterText: form.letterText || undefined,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to save offer'));
      }

      const saved = (await response.json()) as OfferRecord;
      setOffers((current) =>
        editing
          ? current.map((offer) => (offer.id === saved.id ? saved : offer))
          : [saved, ...current],
      );
      setSelected((current) => (current?.id === saved.id ? saved : current));
      setEditorOpen(false);
      toast.success(editing ? 'Offer updated' : 'Offer draft created');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to save offer');
    } finally {
      setSaving(false);
    }
  }

  async function sendOffer(offer: OfferRecord) {
    setSendingId(offer.id);
    try {
      const response = await apiFetch(`/api/offers/${offer.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDays: 7 }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to send offer'));
      }

      const payload = await response.json();
      setOffers((current) =>
        current.map((item) => (item.id === offer.id ? payload.offer : item)),
      );
      setSelected((current) =>
        current?.id === offer.id ? payload.offer : current,
      );
      setSigningLink(payload.signingUrl || '');

      try {
        await navigator.clipboard.writeText(payload.signingUrl);
      } catch {
        // The link remains visible in the page if clipboard access is denied.
      }

      toast.success(
        payload.emailSent
          ? 'Offer sent and secure link prepared'
          : 'Offer activated, but email delivery failed',
      );
      if (payload.emailError) toast.warning(payload.emailError);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to send offer');
    } finally {
      setSendingId(null);
    }
  }

  async function withdrawOffer(offer: OfferRecord) {
    if (!window.confirm(`Withdraw the offer for ${offer.candidate?.name || 'this candidate'}?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/api/offers/${offer.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to withdraw offer'));
      }
      const updated = (await response.json()) as OfferRecord;
      setOffers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected((current) =>
        current?.id === updated.id ? updated : current,
      );
      toast.success('Offer withdrawn');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to withdraw offer');
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, send, and track secure candidate offers.
          </p>
        </div>
        <div className="flex gap-2">
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
          {canEdit && (
            <Button size="sm" onClick={createOffer}>
              <Plus className="me-2 h-4 w-4" />
              Create offer
            </Button>
          )}
        </div>
      </div>

      {signingLink && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">New secure signing link</p>
              <p className="max-w-2xl truncate text-xs text-muted-foreground">
                {signingLink}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(signingLink)}
              >
                <Clipboard className="me-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  window.open(signingLink, '_blank', 'noopener,noreferrer')
                }
              >
                <Eye className="me-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="Search candidate, email, or job"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as typeof status)}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['all', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'] as const).map(
              (item) => (
                <SelectItem key={item} value={item}>
                  {item === 'all' ? 'All statuses' : item.replaceAll('_', ' ')}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No offers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a draft when a candidate is ready for an offer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((offer) => (
            <Card key={offer.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={offer.candidate?.image || undefined} />
                    <AvatarFallback>
                      {initials(offer.candidate?.name || 'Candidate')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {offer.candidate?.name || 'Candidate'}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {offer.job?.title || 'Job'}
                    </p>
                  </div>
                  <Badge className={STATUS_STYLE[offer.status]}>{offer.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Compensation</p>
                    <p className="mt-1 font-medium">
                      {formatMoney(offer.salary, offer.salaryCurrency)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="mt-1 font-medium">
                      {offer.responseDeadline
                        ? new Date(offer.responseDeadline).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                  <Button size="sm" variant="ghost" onClick={() => viewOffer(offer)}>
                    <Eye className="me-2 h-4 w-4" />
                    View
                  </Button>
                  {canEdit && ['DRAFT', 'PENDING'].includes(offer.status) && (
                    <Button size="sm" variant="ghost" onClick={() => editOffer(offer)}>
                      <Pencil className="me-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {canEdit && ['DRAFT', 'PENDING', 'SENT'].includes(offer.status) && (
                    <Button
                      size="sm"
                      onClick={() => void sendOffer(offer)}
                      disabled={sendingId === offer.id}
                    >
                      {sendingId === offer.id ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="me-2 h-4 w-4" />
                      )}
                      {offer.status === 'SENT' ? 'Resend' : 'Send'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit offer' : 'Create offer'}</DialogTitle>
            <DialogDescription>
              Save a draft, review it, then create a secure signing link.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label>Application *</Label>
              <Select
                value={form.applicationId}
                disabled={Boolean(editing)}
                onValueChange={(applicationId) =>
                  setForm((current) => ({ ...current, applicationId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose candidate and job" />
                </SelectTrigger>
                <SelectContent>
                  {availableApplications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {application.candidate.user.name} — {application.job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Annual salary *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.salary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, salary: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={form.salaryCurrency}
                  onValueChange={(salaryCurrency) =>
                    setForm((current) => ({ ...current, salaryCurrency }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'IQD', 'SAR', 'AED'].map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Equity</Label>
                <Input
                  value={form.equity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, equity: event.target.value }))
                  }
                  placeholder="0.10%"
                />
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Response deadline</Label>
                <Input
                  type="date"
                  value={form.responseDeadline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      responseDeadline: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Benefits · one per line</Label>
                <Textarea
                  rows={4}
                  value={form.benefits}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, benefits: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Conditions · one per line</Label>
                <Textarea
                  rows={4}
                  value={form.conditions}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, conditions: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Offer letter</Label>
                {!editing && (
                  <Button type="button" size="sm" variant="outline" onClick={generateLetter}>
                    Use default letter
                  </Button>
                )}
              </div>
              <Textarea
                rows={12}
                value={form.letterText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, letterText: event.target.value }))
                }
                placeholder="Leave blank while creating to generate a server-side default."
              />
            </div>

            <div className="space-y-2">
              <Label>Internal notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveOffer()} disabled={saving}>
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Save draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.job?.title || 'Offer'}</DialogTitle>
                <DialogDescription>
                  {selected.candidate?.name} · {selected.candidate?.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`mt-2 ${STATUS_STYLE[selected.status]}`}>
                      {selected.status}
                    </Badge>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Salary</p>
                    <p className="mt-2 font-medium">
                      {formatMoney(selected.salary, selected.salaryCurrency)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Signing</p>
                    <p className="mt-2 font-medium">{selected.signingStatus}</p>
                  </div>
                </div>

                {selected.benefits.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Benefits</p>
                    <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                      {selected.benefits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.conditions.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Conditions</p>
                    <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                      {selected.conditions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium">Offer letter</p>
                  <div className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 text-sm leading-6">
                    {selected.letterText || 'No offer letter text.'}
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Internal notes</p>
                    <p className="whitespace-pre-wrap rounded-lg border p-3 text-sm text-muted-foreground">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-wrap">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
                {canEdit && ['DRAFT', 'PENDING'].includes(selected.status) && (
                  <Button variant="outline" onClick={() => editOffer(selected)}>
                    <Pencil className="me-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {canEdit && ['DRAFT', 'PENDING', 'SENT'].includes(selected.status) && (
                  <Button
                    onClick={() => void sendOffer(selected)}
                    disabled={sendingId === selected.id}
                  >
                    {sendingId === selected.id ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="me-2 h-4 w-4" />
                    )}
                    {selected.status === 'SENT' ? 'Resend offer' : 'Send offer'}
                  </Button>
                )}
                {canEdit && ['DRAFT', 'PENDING', 'SENT'].includes(selected.status) && (
                  <Button
                    variant="destructive"
                    onClick={() => void withdrawOffer(selected)}
                  >
                    <Archive className="me-2 h-4 w-4" />
                    Withdraw
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
