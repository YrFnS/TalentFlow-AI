// @ts-nocheck
import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/store/i18n-store';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelConfirmed: boolean;
  onCancelConfirmedChange: (checked: boolean) => void;
  onCancelSubscription: () => void;
  processing: boolean;
  freePlanFeatures: string;
}

export default function CancelSubscriptionDialog({
  open,
  onOpenChange,
  cancelConfirmed,
  onCancelConfirmedChange,
  onCancelSubscription,
  processing,
  freePlanFeatures,
}: CancelSubscriptionDialogProps) {
  const { t } = useI18n();

  let freeFeatures: string[] = [];
  try {
    freeFeatures = JSON.parse(freePlanFeatures);
  } catch {
    freeFeatures = [];
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!processing) {
        onOpenChange(o);
        if (!o) onCancelConfirmedChange(false);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="dialog-header-accent">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t.billing.cancelSubscription}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t.billing.cancelWarning}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <h4 className="text-sm font-medium text-red-700 mb-2">{t.billing.cancelSubscription}</h4>
            <ul className="space-y-1.5 text-xs text-red-600">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <label className="flex items-center gap-3 mt-4 p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
            <Checkbox
              checked={cancelConfirmed}
              onCheckedChange={(checked) => onCancelConfirmedChange(checked === true)}
            />
            <span className="text-sm text-muted-foreground">{t.billing.cancelConfirmation}</span>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); onCancelConfirmedChange(false); }}>
            {t.billing.keepSubscription}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!cancelConfirmed}
            onClick={onCancelSubscription}
          >
            {t.billing.cancelSubscription}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
