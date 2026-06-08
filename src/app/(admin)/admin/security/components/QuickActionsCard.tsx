// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Key, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActionsCard() {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{t.security.quickActions}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"
            onClick={() => toast.success(t.security.actionCompleted, { description: t.security.lockSuspicious })}
          >
            <Lock className="h-5 w-5" />
            <span className="text-xs font-medium">{t.security.lockSuspicious}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 transition-all"
            onClick={() => toast.success(t.security.actionCompleted, { description: t.security.forcePasswordReset })}
          >
            <Key className="h-5 w-5" />
            <span className="text-xs font-medium">{t.security.forcePasswordReset}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 transition-all"
            onClick={() => toast.success(t.security.actionCompleted, { description: t.security.exportReport })}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">{t.security.exportReport}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700 transition-all"
            onClick={() => toast.success(t.security.actionCompleted, { description: t.security.clearRateLimits })}
          >
            <RefreshCw className="h-5 w-5" />
            <span className="text-xs font-medium">{t.security.clearRateLimits}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
