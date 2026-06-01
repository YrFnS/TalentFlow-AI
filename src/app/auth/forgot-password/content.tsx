// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Brain, ArrowLeft, Loader2, Mail, Sun, Moon, Globe, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ForgotPasswordContent() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(locale === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        toast.success(locale === 'ar' ? 'تم إرسال رابط إعادة التعيين' : 'Reset link sent');
      } else {
        if (res.status === 429) {
          setError(locale === 'ar' ? 'طلبات كثيرة. حاول لاحقاً.' : 'Too many requests. Please try again later.');
        } else {
          setError(data.error || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
        }
      }
    } catch {
      setError(locale === 'ar' ? 'حدث خطأ في الاتصال' : 'A connection error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        {/* Decorative shapes */}
        <div className="absolute top-[10%] start-[8%] w-20 h-20 border-2 border-white/20 rounded-lg rotate-12 auth-float-shape" />
        <div className="absolute top-[55%] end-[15%] w-16 h-16 border-2 border-white/15 rounded-full auth-float-shape" />
        <div className="absolute bottom-[20%] start-[25%] w-24 h-24 bg-white/5 rounded-2xl -rotate-12 auth-float-shape" />

        {/* Blurred glow shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[12%] start-[12%] w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[25%] end-[10%] w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 dot-grid opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              {t.auth.forgotPassword}
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {t.auth.forgotPasswordDesc}
            </p>
          </div>

          {/* Info card */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{locale === 'ar' ? 'رابط آمن' : 'Secure Link'}</p>
                <p className="text-xs text-white/60">{locale === 'ar' ? 'سنرسل لك رابط إعادة تعيين آمن لبريدك الإلكتروني' : "We'll send a secure reset link to your email"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br bg-blue-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-blue-600 text-white lg:hidden">
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
            <div className="fixed top-0 end-0 w-96 h-96 bg-gradient-to-bl from-teal-200/20 to-transparent rounded-full blur-3xl dark:from-teal-800/10 lg:hidden" />

            <Card className="relative border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br bg-blue-600 shadow-lg shadow-teal-500/20">
                  {isSuccess ? (
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  ) : (
                    <Mail className="h-7 w-7 text-white" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">{t.auth.forgotPassword}</CardTitle>
                <CardDescription>{t.auth.forgotPasswordDesc}</CardDescription>
              </CardHeader>

              <CardContent>
                {isSuccess ? (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-800 dark:text-teal-200">
                        {t.auth.resetLinkSent}
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4 me-2" />
                        {t.auth.backToLogin}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.auth.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.auth.enterEmail}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className={`input-focus-ring transition-all duration-200 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        autoComplete="email"
                      />
                      {error && <p className="text-sm text-destructive animate-shake">{error}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-shadow"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" role="status" aria-label="Loading" />
                      ) : (
                        <Mail className="h-4 w-4 me-2" />
                      )}
                      {t.auth.sendResetLink}
                    </Button>
                  </form>
                )}
              </CardContent>

              {!isSuccess && (
                <CardFooter className="flex flex-col gap-4">
                  <div className="text-sm text-muted-foreground text-center">
                    <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t.auth.backToLogin}
                    </Link>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
