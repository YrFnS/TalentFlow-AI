'use client'

import { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, ShieldOff, QrCode, Copy, Download, Loader2, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorSection() {
  const { t, locale } = useI18n();
  const tf = (t as any).twoFactor || {};

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string; backupCodes: string[] } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user) {
          const userId = (session.user as any).id;
          if (userId) {
            // We'll just check via the session - the setup endpoint checks auth
            // For now, use a simple check
          }
        }
      } catch {
        // Session not available, ignore
      }
    };
    fetch2FAStatus();
  }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
        setSavedBackupCodes(data.backupCodes);
        setShowSetupDialog(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to setup 2FA');
      }
    } catch {
      toast.error('Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verifyCode.trim()) {
      toast.error(tf.invalidCode || 'Invalid authentication code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      });

      if (res.ok) {
        setTwoFactorEnabled(true);
        setShowSetupDialog(false);
        setVerifyCode('');
        setShowBackupCodes(true);
        toast.success(tf.setupSuccess || 'Two-factor authentication has been enabled');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || tf.invalidCode || 'Invalid authentication code');
      }
    } catch {
      toast.error(tf.invalidCode || 'Invalid authentication code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword.trim()) {
      toast.error('Password is required');
      return;
    }

    setIsDisabling(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, token: disableToken }),
      });

      if (res.ok) {
        setTwoFactorEnabled(false);
        setShowDisableDialog(false);
        setDisablePassword('');
        setDisableToken('');
        setSetupData(null);
        setSavedBackupCodes([]);
        setShowBackupCodes(false);
        toast.success(tf.disableSuccess || 'Two-factor authentication has been disabled');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to disable 2FA');
      }
    } catch {
      toast.error('Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(savedBackupCodes.join('\n'));
    toast.success(locale === 'ar' ? 'تم النسخ!' : 'Copied to clipboard!');
  };

  const downloadBackupCodes = () => {
    const text = `TalentFlow AI - Backup Codes\n\n${savedBackupCodes.join('\n')}\n\nEach code can only be used once. Store these safely.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talentflow-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            {tf.title || 'Two-Factor Authentication'}
          </CardTitle>
          <CardDescription>{tf.description || 'Add an extra layer of security to your account'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{tf.enabled || '2FA is enabled'}</p>
                    <p className="text-sm text-muted-foreground">{tf.description || 'Add an extra layer of security to your account'}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                  <Check className="h-3 w-3 me-1" />
                  {tf.enabled || '2FA is enabled'}
                </Badge>
              </div>

              {/* Show backup codes if available */}
              {showBackupCodes && savedBackupCodes.length > 0 && (
                <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      {tf.backupCodes || 'Backup Codes'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                        <Copy className="h-3 w-3 me-1" />
                        {tf.copyBackupCodes || 'Copy'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                        <Download className="h-3 w-3 me-1" />
                        {tf.downloadBackupCodes || 'Download'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {tf.backupCodesDesc || 'Save these backup codes in a safe place. Each can only be used once.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {savedBackupCodes.map((code, i) => (
                      <div key={i} className="px-3 py-1.5 bg-white dark:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-700 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="h-4 w-4 me-2" />
                {tf.disable || 'Disable 2FA'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{tf.disabled || '2FA is not enabled'}</p>
                    <p className="text-sm text-muted-foreground">{tf.description || 'Add an extra layer of security to your account'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  {tf.disabled || '2FA is not enabled'}
                </Badge>
              </div>

              <Button
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                onClick={handleSetup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 me-2" />
                )}
                {tf.enable || 'Enable 2FA'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-teal-600" />
              {tf.setupTitle || 'Set Up Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription>
              {tf.scanQR || 'Scan this QR code with your authenticator app'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            {setupData?.qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            {/* Secret Key */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{tf.secretKey || 'Secret Key'}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                  {secretRevealed ? setupData?.secret : '••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => {
                    setSecretRevealed(!secretRevealed);
                    if (!secretRevealed && setupData?.secret) {
                      navigator.clipboard.writeText(setupData.secret);
                      toast.success(locale === 'ar' ? 'تم النسخ!' : 'Copied!');
                    }
                  }}
                >
                  {secretRevealed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verify Code Input */}
            <div className="space-y-2">
              <Label htmlFor="setup-verify-code">{tf.enterCode || 'Enter the 6-digit code from your authenticator app'}</Label>
              <Input
                id="setup-verify-code"
                type="text"
                placeholder={tf.totpPlaceholder || 'Enter 6-digit code'}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                inputMode="numeric"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowSetupDialog(false); setVerifyCode(''); }}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
              onClick={handleVerifySetup}
              disabled={isVerifying || !verifyCode.trim()}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <ShieldCheck className="h-4 w-4 me-2" />
              )}
              {tf.verify || 'Verify & Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" />
              {tf.disableTitle || 'Disable Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription>
              {tf.confirmPassword || 'Confirm your password to disable 2FA'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">{t.settings.currentPassword || 'Current Password'}</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder={t.settings.currentPasswordPlaceholder || 'Enter current password'}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>

            {twoFactorEnabled && (
              <div className="space-y-2">
                <Label htmlFor="disable-token">{tf.totpCode || 'Authentication Code'}</Label>
                <Input
                  id="disable-token"
                  type="text"
                  placeholder={tf.totpPlaceholder || 'Enter 6-digit code'}
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value)}
                  className="text-center text-lg tracking-wider font-mono"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableToken(''); }}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling || !disablePassword.trim()}
            >
              {isDisabling ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <ShieldOff className="h-4 w-4 me-2" />
              )}
              {tf.disable || 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
