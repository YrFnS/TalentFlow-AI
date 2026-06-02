// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
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
import { AlertCircle, Send, Loader2 } from 'lucide-react';

interface SendConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isSending: boolean;
}

export default function SendConfirmDialog({ open, onOpenChange, onConfirm, isSending }: SendConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {t.bulkEmail.confirmSend}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.bulkEmail.sendWarning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSending}
            className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin me-1" />
            ) : (
              <Send className="h-4 w-4 me-1" />
            )}
            {t.bulkEmail.sendNow}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
