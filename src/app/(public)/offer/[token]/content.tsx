// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Gift,
  Download,
  PenTool,
  Type,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SignaturePad from '@/components/shared/signature-pad';

interface OfferData {
  id: string;
  signingStatus: string;
  signingTokenExpiry: string;
  candidateSignedAt: string;
  candidateSignature: string;
  status: string;
  salary: number;
  salaryCurrency: string;
  equity: string;
  startDate: string;
  benefits: string;
  conditions: string;
  letterText: string;
  responseDeadline: string;
  candidate: { name: string; email: string };
  job: { title: string; department: string; location: string };
  company: { name: string; logo: string | null };
}

const signingStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950', icon: Clock },
  SENT: { label: 'Sent for Signature', color: 'bg-teal-100 text-blue-700 dark:bg-teal-950', icon: FileCheck },
  CANDIDATE_SIGNED: { label: 'Candidate Signed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: AlertTriangle },
  DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-950', icon: XCircle },
};

export default function OfferSignContent() {
  const { t } = useI18n();
  const est = t.eSignature as Record<string, string>;
  const params = useParams();
  const token = params?.token as string;

  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signature state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('type');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchOffer();
  }, [token]);

  const fetchOffer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/offers/${token}/view?XTransformPort=3000`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load offer');
      } else {
        setOffer(data);
        if (data.signingStatus === 'COMPLETED' || data.signingStatus === 'CANDIDATE_SIGNED') {
          setSigned(true);
        }
        if (data.signingStatus === 'DECLINED') {
          setDeclined(true);
        }
      }
    } catch {
      setError('Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!agreedToTerms) {
      toast.error(est.agreeTermsRequired);
      return;
    }

    const signature = signatureMode === 'type' ? typedSignature : drawnSignature;
    if (!signature || (signatureMode === 'type' && !typedSignature.trim())) {
      toast.error(est.signatureRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offer?.id}/sign?XTransformPort=3000`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signatureMode === 'type' ? typedSignature : drawnSignature,
          signatureType: signatureMode === 'type' ? 'TYPED' : 'DRAWN',
          signingToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to sign offer');
      } else {
        toast.success(est.offerSigned);
        setSigned(true);
        setOffer(prev => prev ? { ...prev, signingStatus: 'COMPLETED', status: 'ACCEPTED', candidateSignedAt: new Date().toISOString(), candidateSignature: signature } : prev);
      }
    } catch {
      toast.error('Failed to sign offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offer?.id}/sign?XTransformPort=3000`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: 'DECLINED',
          signatureType: 'DECLINE',
          signingToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to decline offer');
      } else {
        toast.success(est.offerDeclined);
        setDeclined(true);
        setOffer(prev => prev ? { ...prev, signingStatus: 'DECLINED', status: 'DECLINED' } : prev);
      }
    } catch {
      toast.error('Failed to decline offer');
    } finally {
      setSubmitting(false);
      setDeclineOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-sm text-muted-foreground">{error || 'Offer not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = signingStatusConfig[offer.signingStatus] || signingStatusConfig.PENDING;
  const StatusIcon = statusConfig.icon;
  const canSign = offer.signingStatus === 'SENT' && !signed && !declined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{offer.company.name}</h1>
              <p className="text-sm text-muted-foreground">{est.offerLetter}</p>
            </div>
          </div>
          <Badge className={cn('text-xs gap-1', statusConfig.color)}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Expired Message */}
        {offer.signingStatus === 'EXPIRED' && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{est.expiredMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Declined Message */}
        {declined && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{est.declinedMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Signed Message */}
        {signed && (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-700">{est.offerSigned}</p>
                {offer.candidateSignedAt && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    {est.signedOn}: {new Date(offer.candidateSignedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offer Details Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              {est.position}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{est.position}</p>
                <p className="font-medium text-sm">{offer.job.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{est.company}</p>
                <p className="font-medium text-sm">{offer.company.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{est.salary}</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium text-sm">{offer.salaryCurrency} {offer.salary?.toLocaleString()}/yr</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{est.startDate}</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium text-sm">{offer.startDate || 'TBD'}</p>
                </div>
              </div>
              {offer.equity && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="font-medium text-sm">{offer.equity}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        {offer.benefits && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4 text-blue-600" />
                {est.benefits}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-muted-foreground max-w-none">
                {offer.benefits.startsWith('[') ? (
                  <ul className="space-y-1">
                    {(JSON.parse(offer.benefits) as string[]).map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 py-1">
                        <span className="text-emerald-500 shrink-0">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  offer.benefits.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offer Letter */}
        {offer.letterText && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                {est.offerLetter}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg border border-border/30">
                {offer.letterText}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        {canSign && (
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-blue-600" />
                {est.signOffer}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Signature Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={signatureMode === 'type' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'text-xs',
                    signatureMode === 'type' && 'bg-gradient-to-r bg-blue-600 text-white'
                  )}
                  onClick={() => setSignatureMode('type')}
                >
                  <Type className="h-3 w-3 me-1" />
                  {est.typed}
                </Button>
                <Button
                  variant={signatureMode === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'text-xs',
                    signatureMode === 'draw' && 'bg-gradient-to-r bg-blue-600 text-white'
                  )}
                  onClick={() => setSignatureMode('draw')}
                >
                  <PenTool className="h-3 w-3 me-1" />
                  {est.drawn}
                </Button>
              </div>

              {/* Typed Signature Input */}
              {signatureMode === 'type' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{est.typeSignature}</label>
                  <Input
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder={est.typeSignature}
                    className="text-lg font-serif h-12"
                  />
                  {typedSignature && (
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-border/30">
                      <p className="font-serif text-2xl text-gray-800 dark:text-gray-200 italic">
                        {typedSignature}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Drawn Signature */}
              {signatureMode === 'draw' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{est.drawSignature}</label>
                  <SignaturePad
                    value={drawnSignature}
                    onChange={setDrawnSignature}
                    width={500}
                    height={160}
                  />
                </div>
              )}

              {/* Agree to Terms */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="agree-terms" className="text-sm leading-relaxed cursor-pointer">
                  {est.agreeTerms}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
                  onClick={handleSign}
                  disabled={submitting || !agreedToTerms || (signatureMode === 'type' ? !typedSignature.trim() : !drawnSignature)}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 me-2" />
                  )}
                  {est.signOffer}
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => setDeclineOpen(true)}
                  disabled={submitting}
                >
                  <XCircle className="h-4 w-4 me-2" />
                  {est.declineOffer}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signed State */}
        {signed && offer.candidateSignature && (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-700">
                <Shield className="h-4 w-4" />
                {est.offerSigned}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-border/30">
                {offer.candidateSignature.startsWith('data:image') ? (
                  <img
                    src={offer.candidateSignature}
                    alt="Signature"
                    className="max-h-20"
                  />
                ) : (
                  <p className="font-serif text-2xl text-gray-800 dark:text-gray-200 italic">
                    {offer.candidateSignature}
                  </p>
                )}
              </div>
              {offer.candidateSignedAt && (
                <p className="text-xs text-muted-foreground">
                  {est.signedOn}: {new Date(offer.candidateSignedAt).toLocaleDateString()} at {new Date(offer.candidateSignedAt).toLocaleTimeString()}
                </p>
              )}
              <Button
                variant="outline"
                className="w-full border-slate-200 text-blue-700"
                onClick={() => {
                  toast.success('PDF download simulated');
                }}
              >
                <Download className="h-4 w-4 me-2" />
                {est.downloadPdf}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <div className="flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>Secured by TalentFlow AI E-Signatures</span>
          </div>
        </div>
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {est.declineOffer}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{est.declineConfirm}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
              {est.declineOffer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
