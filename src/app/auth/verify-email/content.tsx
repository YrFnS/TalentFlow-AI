// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Brain, Loader2, CheckCircle2, XCircle, Mail, Sun, Moon, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type VerificationState = 'loading' | 'success' | 'expired' | 'invalid';

function VerifyEmailForm() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'invalid');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setState('success');
        } else {
          if (data.code === 'EXPIRED' || data.error?.includes('expired')) {
            setState('expired');
          } else {
            setState('invalid');
          }
        }
      } catch {
        setState('invalid');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      toast.error(locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t.auth.verificationResent);
      } else {
        toast.error(data.error || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ في الاتصال' : 'A connection error occurred');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
            <p className="text-muted-foreground">{t.auth.verifyingEmail}</p>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {t.auth.emailVerified}
              </h2>
              <p className="text-sm text-muted-foreground">{t.auth.emailVerifiedDesc}</p>
            </div>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
              size="lg"
            >
              <Link href="/auth/login">
                {t.auth.backToLogin}
              </Link>
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {t.auth.verificationExpired}
              </h2>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">{t.auth.checkEmail}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t.auth.enterEmail}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                />
                <Button
                  onClick={handleResend}
                  disabled={isResending}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                {t.auth.verificationInvalid}
              </h2>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">{t.auth.checkEmail}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t.auth.enterEmail}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                />
                <Button
                  onClick={handleResend}
                  disabled={isResending}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Link href="/auth/login">
                {t.auth.backToLogin}
              </Link>
            </Button>
          </div>
        );
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute inset-0">
          <div className="absolute top-[12%] start-[12%] w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[25%] end-[10%] w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">TalentFlow AI</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
            {t.auth.verifyEmail}
          </h1>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent lg:hidden">
              {t.common.appName}
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Change language">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale('en')}>
                  <span className={locale === 'en' ? 'font-bold' : ''}>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('ar')}>
                  <span className={locale === 'ar' ? 'font-bold' : ''}>العربية</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Card className="relative border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{t.auth.verifyEmail}</CardTitle>
              </CardHeader>

              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
