// @ts-nocheck
'use client'

import { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Monitor, Smartphone, Trash2, LogOut, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SessionInfo {
  id: string;
  tokenSuffix: string;
  expiresAt: string;
  device: string;
  isCurrent: boolean;
}

export default function SessionManagementSection() {
  const { t, locale } = useI18n();
  const sm = (t as any).sessions || {};

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success(sm.revokeSuccess || 'Session revoked successfully');
      } else {
        toast.error(sm.revokeError || 'Failed to revoke session');
      }
    } catch {
      toast.error(sm.revokeError || 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    setIsRevoking(true);
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });

      if (res.ok) {
        // Keep only the current session in the list
        setSessions((prev) => prev.length > 0 ? [prev[0]] : []);
        toast.success(sm.revokeAllSuccess || 'All other sessions have been revoked');
      } else {
        toast.error(sm.revokeError || 'Failed to revoke sessions');
      }
    } catch {
      toast.error(sm.revokeError || 'Failed to revoke sessions');
    } finally {
      setIsRevoking(false);
      setShowRevokeAllDialog(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                {sm.title || 'Active Sessions'}
              </CardTitle>
              <CardDescription className="mt-1">
                {sm.description || 'Manage your active sessions across devices'}
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                onClick={() => setShowRevokeAllDialog(true)}
              >
                <LogOut className="h-4 w-4 me-1" />
                {sm.revokeAll || 'Revoke All Others'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{sm.noSessions || 'No active sessions'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-slate-200 dark:hover:border-teal-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {index === 0 ? (
                        <Monitor className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {session.device || (index === 0 ? 'Current Browser' : 'Other Device')}
                        </p>
                        {index === 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:border-emerald-800 text-xs">
                            {sm.current || 'Current'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{sm.expires || 'Expires'}: {formatDate(session.expiresAt)}</span>
                        <span className="text-muted-foreground/50">••{session.tokenSuffix}</span>
                      </div>
                    </div>
                  </div>
                  {index !== 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleRevokeSession(session.id)}
                      title={sm.revoke || 'Revoke Session'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke All Dialog */}
      <Dialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {sm.revokeAllTitle || 'Revoke All Other Sessions'}
            </DialogTitle>
            <DialogDescription>
              {sm.revokeAllDesc || 'This will sign out all other devices. You will stay signed in on this device.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRevokeAllDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAll}
              disabled={isRevoking}
            >
              {isRevoking ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <LogOut className="h-4 w-4 me-2" />
              )}
              {sm.revokeAll || 'Revoke All Others'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
