'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Gift,
  Loader2,
  PenTool,
  Printer,
  ShieldCheck,
  Type,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/store/i18n-store';
import SignaturePad from '@/components/shared/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';

type OfferData = {
  id: string;
  status: string;
  signingStatus: string;
  salary: number | null;
  salaryCurrency: string;
  equity: string | null;
  startDate: string | null;
  benefits: string[];
  conditions: string[];
  letterText: string | null;
  responseDeadline: string | null;
  signingTokenExpiry: string | null;
  candidateSignedAt: string | null;
  candidate: { id: string; name: string } | null;
  job: { id: string; title: string; location: string | null } | null;
  company: { id: string; name: string; logo: string | null } | null;
};

const statusClass: Record<string, string> = {
  SENT: 'bg-primary/10 text-primary',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-700',
  DECLINED: 'bg-destructive/10 text-destructive',
  EXPIRED: 'bg-amber-500/10 text-amber-700',
};

function money(value: number | null, currency: string) {
  if (!value) return 'Not specified';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OfferSignContent() {
  const { dir } = useI18n();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'type' | 'draw'>('type');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/offers/${encodeURIComponent(token)}/view`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(await getApiErrorMessage(response, 'Unable to load offer'));
        }
        if (active) setOffer(await response.json());
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Unable to load offer');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) void load();
    return () => {
      active = false;
    };
  }, [token]);

  async function respond(signatureType: 'TYPED' | 'DRAWN' | 'DECLINE') {
    if (!offer) return;

    if (signatureType !== 'DECLINE' && !agreed) {
      toast.error('You must agree to the offer terms before signing');
      return;
    }

    const signature =
      signatureType === 'TYPED'
        ? typedSignature.trim()
        : signatureType === 'DRAWN'
          ? drawnSignature
          : '';

    if (signatureType !== 'DECLINE' && !signature) {
      toast.error('Add your signature before continuing');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/offers/${offer.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signingToken: token,
          signatureType,
          signature,
          declineReason: signatureType === 'DECLINE' ? declineReason : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to respond to offer'));
      }

      const payload = await response.json();
      setOffer((current) =>
        current
          ? {
              ...current,
              status: payload.status,
              signingStatus: payload.signingStatus,
              candidateSignedAt:
                signatureType === 'DECLINE' ? current.candidateSignedAt : new Date().toISOString(),
            }
          : current,
      );
      setDeclineOpen(false);
      toast.success(signatureType === 'DECLINE' ? 'Offer declined' : 'Offer accepted');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to respond to offer');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading secure offer…</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
            <h1 className="mt-4 text-lg font-semibold">Offer unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || 'The signing link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRespond = offer.status === 'SENT' && offer.signingStatus === 'SENT';
  const accepted = offer.status === 'ACCEPTED';
  const declined = offer.status === 'DECLINED';
  const expired = offer.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8" dir={dir}>
      <main className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{offer.company?.name || 'Company offer'}</h1>
              <p className="text-sm text-muted-foreground">Secure employment offer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusClass[offer.status] || 'bg-muted text-muted-foreground'}>
              {offer.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="me-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </header>

        {(accepted || declined || expired) && (
          <Card
            className={
              accepted
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : declined
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-amber-500/40 bg-amber-500/5'
            }
          >
            <CardContent className="flex gap-3 p-4">
              {accepted ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : declined ? (
                <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium">
                  {accepted
                    ? 'Offer accepted'
                    : declined
                      ? 'Offer declined'
                      : 'Signing link expired'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {accepted
                    ? 'Your response has been recorded. The company has been notified.'
                    : declined
                      ? 'Your response has been recorded. The company has been notified.'
                      : 'Contact the company if you need a new signing link.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              Position details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="mt-1 font-medium">{offer.candidate?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="mt-1 font-medium">{offer.job?.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual salary</p>
              <p className="mt-1 flex items-center gap-1 font-medium">
                <DollarSign className="h-4 w-4" />
                {money(offer.salary, offer.salaryCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proposed start date</p>
              <p className="mt-1 flex items-center gap-1 font-medium">
                <Calendar className="h-4 w-4" />
                {offer.startDate || 'To be agreed'}
              </p>
            </div>
            {offer.equity && (
              <div>
                <p className="text-xs text-muted-foreground">Equity</p>
                <p className="mt-1 font-medium">{offer.equity}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Response deadline</p>
              <p className="mt-1 font-medium">
                {offer.responseDeadline
                  ? new Date(offer.responseDeadline).toLocaleDateString()
                  : offer.signingTokenExpiry
                    ? new Date(offer.signingTokenExpiry).toLocaleDateString()
                    : 'Not specified'}
              </p>
            </div>
          </CardContent>
        </Card>

        {offer.benefits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-4 w-4 text-primary" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                {offer.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {offer.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                {offer.conditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offer letter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap rounded-lg border bg-muted/20 p-5 text-sm leading-7">
              {offer.letterText || 'No letter text was provided.'}
            </div>
          </CardContent>
        </Card>

        {canRespond && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PenTool className="h-4 w-4 text-primary" />
                Accept and sign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-2">
                <Button
                  variant={mode === 'type' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('type')}
                >
                  <Type className="me-2 h-4 w-4" />
                  Type signature
                </Button>
                <Button
                  variant={mode === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('draw')}
                >
                  <PenTool className="me-2 h-4 w-4" />
                  Draw signature
                </Button>
              </div>

              {mode === 'type' ? (
                <div className="space-y-2">
                  <Label htmlFor="typed-signature">Full legal name</Label>
                  <Input
                    id="typed-signature"
                    value={typedSignature}
                    onChange={(event) => setTypedSignature(event.target.value)}
                    placeholder={offer.candidate?.name || 'Your full name'}
                  />
                </div>
              ) : (
                <SignaturePad value={drawnSignature} onChange={setDrawnSignature} />
              )}

              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(value) => setAgreed(value === true)}
                />
                <Label htmlFor="agree" className="text-sm leading-5">
                  I have reviewed the offer and agree that my electronic signature is
                  legally equivalent to my handwritten signature.
                </Label>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setDeclineOpen(true)}>
                  <XCircle className="me-2 h-4 w-4" />
                  Decline offer
                </Button>
                <Button
                  onClick={() => void respond(mode === 'type' ? 'TYPED' : 'DRAWN')}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="me-2 h-4 w-4" />
                  )}
                  Accept and sign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground print:hidden">
          This link is private. Do not forward it to anyone else.
        </p>
      </main>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this offer?</DialogTitle>
            <DialogDescription>
              This response is final for the current signing link. You may add an
              optional note for the hiring team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Optional reason</Label>
            <Textarea
              rows={4}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void respond('DECLINE')}
              disabled={submitting}
            >
              {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Confirm decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
