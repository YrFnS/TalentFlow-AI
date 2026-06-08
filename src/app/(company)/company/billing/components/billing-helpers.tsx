// @ts-nocheck
import React from 'react';
import { Shield, Zap, Sparkles, Crown, CheckCircle2, XCircle, Calendar, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/store/i18n-store';

export function getPlanIcon(type: string) {
  switch (type) {
    case 'FREE': return Shield;
    case 'STARTER': return Zap;
    case 'GROWTH': return Sparkles;
    case 'ENTERPRISE': return Crown;
    default: return Shield;
  }
}

export function getPlanGradient(type: string) {
  const map: Record<string, string> = {
    FREE: 'from-gray-400 to-gray-500',
    STARTER: 'from-teal-500 to-emerald-500',
    GROWTH: 'bg-blue-600',
    ENTERPRISE: 'from-emerald-600 to-teal-700',
  };
  return map[type] || map.STARTER;
}

export function useInvoiceStatusBadge() {
  const { t } = useI18n();

  return (status: string) => {
    const map: Record<string, { class: string; icon: React.ReactNode }> = {
      PAID: { class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950', icon: <CheckCircle2 className="w-3 h-3 me-1" /> },
      PENDING: { class: 'bg-amber-50 text-amber-700 dark:bg-amber-950', icon: <Calendar className="w-3 h-3 me-1" /> },
      FAILED: { class: 'bg-red-50 text-red-700 dark:bg-red-950', icon: <XCircle className="w-3 h-3 me-1" /> },
      REFUNDED: { class: 'bg-slate-50 text-blue-700 dark:bg-teal-950', icon: <RefreshCw className="w-3 h-3 me-1" /> },
    };
    const entry = map[status] || map.PENDING;
    return (
      <Badge variant="secondary" className={`text-[10px] border-0 ${entry.class}`}>
        {entry.icon}
        {status === 'PAID' ? t.billing.paid : status === 'PENDING' ? t.billing.pending : status === 'FAILED' ? t.billing.failed : t.billing.refunded}
      </Badge>
    );
  };
}

export function getUsagePercent(current: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min((current / limit) * 100, 100);
}

export function getCardBrandIcon(_brand: string) {
  return '💳';
}

export function useGetCardBrandName() {
  const { t } = useI18n();
  return (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return t.stripe.visa;
      case 'mastercard': return t.stripe.mastercard;
      case 'amex': return t.stripe.amex;
      default: return brand;
    }
  };
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}
