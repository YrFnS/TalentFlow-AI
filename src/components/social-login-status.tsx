'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { Loader2, Link2, Unlink, CheckCircle2, XCircle } from 'lucide-react';

interface SocialAccount {
  id: string;
  provider: string;
  providerAccountId: string;
}

interface SocialLoginStatusProps {
  userId: string;
}

export function SocialLoginStatus({ userId }: SocialLoginStatusProps) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<'google' | 'linkedin' | null>(null);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string>('');

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/social-accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const isProviderConnected = (provider: string) => {
    return accounts.some((acc) => acc.provider === provider);
  };

  const getAccountId = (provider: string) => {
    return accounts.find((acc) => acc.provider === provider)?.id || null;
  };

  const handleLink = async (provider: 'google' | 'linkedin') => {
    setLinkingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: '/settings' });
    } catch {
      toast.error(t.socialLogin.socialLoginError);
      setLinkingProvider(null);
    }
  };

  const handleUnlinkClick = (accountId: string, providerName: string) => {
    setUnlinkingAccountId(accountId);
    setUnlinkingProvider(providerName);
    setUnlinkDialogOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!unlinkingAccountId) return;

    try {
      const res = await fetch(`/api/auth/social-accounts?accountId=${unlinkingAccountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t.socialLogin.accountUnlinked);
        setAccounts((prev) => prev.filter((acc) => acc.id !== unlinkingAccountId));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t.socialLogin.socialLoginError);
      }
    } catch {
      toast.error(t.socialLogin.socialLoginError);
    } finally {
      setUnlinkDialogOpen(false);
      setUnlinkingAccountId(null);
      setUnlinkingProvider('');
    }
  };

  const providers = [
    {
      key: 'google' as const,
      name: t.socialLogin.google,
      bgColor: 'bg-[#4285F4]',
      hoverBgColor: 'hover:bg-[#3574d4]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
        </svg>
      ),
      linkLabel: t.socialLogin.linkGoogle,
    },
    {
      key: 'linkedin' as const,
      name: t.socialLogin.linkedin,
      bgColor: 'bg-[#0A66C2]',
      hoverBgColor: 'hover:bg-[#0856a5]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#fff">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      linkLabel: t.socialLogin.linkLinkedIn,
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t.socialLogin.connectedAccounts}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t.socialLogin.connectedAccounts}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => {
            const connected = isProviderConnected(provider.key);
            const accountId = getAccountId(provider.key);

            return (
              <div
                key={provider.key}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${provider.bgColor} flex items-center justify-center flex-shrink-0`}>
                    {provider.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{provider.name}</p>
                    {connected ? (
                      <Badge variant="secondary" className="mt-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0">
                        <CheckCircle2 className="w-3 h-3 me-1" />
                        {t.socialLogin.connected}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1 bg-muted text-muted-foreground border-0">
                        <XCircle className="w-3 h-3 me-1" />
                        {t.socialLogin.notConnected}
                      </Badge>
                    )}
                  </div>
                </div>

                {connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => handleUnlinkClick(accountId!, provider.key)}
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    {t.socialLogin.unlinkAccount}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={`gap-1.5 ${provider.bgColor} ${provider.hoverBgColor} text-white`}
                    onClick={() => handleLink(provider.key)}
                    disabled={linkingProvider !== null}
                  >
                    {linkingProvider === provider.key ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    {linkingProvider === provider.key ? t.socialLogin.connecting : provider.linkLabel}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.socialLogin.unlinkConfirmation}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.socialLogin.unlinkWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.socialLogin.unlinkAccount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
