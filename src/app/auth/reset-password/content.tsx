// @ts-nocheck
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Brain, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Sun, Moon, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function PasswordStrengthBar({ password }: { password: string }) {
  const { t } = useI18n();

  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const strengthKeys = ['', 'weak', 'fair', 'good', 'strong'] as const;
  const strengthClasses = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500'];

  if (!password) return null;

  const key = strengthKeys[strength] || 'weak';

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthClasses[strength] : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>
        {key && t.auth.passwordStrength?.[key as keyof typeof t.auth.passwordStrength] || ''}
      </p>
    </div>
  );
}

function ResetPasswordForm() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError(t.auth.resetTokenInvalid);
    }
  }, [token, t.auth.resetTokenInvalid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setTokenError(t.auth.resetTokenInvalid);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error(locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        toast.success(t.auth.passwordResetSuccess);
      } else {
        if (data.error?.includes('expired')) {
          setTokenError(t.auth.resetTokenExpired);
        } else if (data.error?.includes('invalid')) {
          setTokenError(t.auth.resetTokenInvalid);
        } else {
          toast.error(data.error || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
        }
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ في الاتصال' : 'A connection error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Token error state
  if (tokenError) {
    return (
      <div dir={dir} className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
              <Card className="border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/30">
                    <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{t.auth.resetPassword}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 animate-fade-in-up">
                    <p className="text-sm text-muted-foreground text-center">{tokenError}</p>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                      size="lg"
                    >
                      <Link href="/auth/forgot-password">
                        {t.auth.sendResetLink}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground text-center w-full">
                    <Link href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t.auth.backToLogin}
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        <div className="absolute top-[10%] start-[8%] w-20 h-20 border-2 border-white/20 rounded-lg rotate-12 auth-float-shape" />
        <div className="absolute bottom-[20%] end-[12%] w-16 h-16 border-2 border-white/15 rounded-full auth-float-shape" />
        <div className="absolute inset-0">
          <div className="absolute top-[12%] start-[12%] w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[25%] end-[10%] w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 dot-grid opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              {t.auth.resetPassword}
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {t.auth.resetPasswordDesc}
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{locale === 'ar' ? 'حماية متقدمة' : 'Strong Protection'}</p>
                <p className="text-xs text-white/60">{locale === 'ar' ? 'تأكد من استخدام كلمة مرور قوية' : 'Make sure to use a strong password'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col">
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

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Card className="relative border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                  {isSuccess ? (
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  ) : (
                    <ShieldCheck className="h-7 w-7 text-white" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">{t.auth.resetPassword}</CardTitle>
                <CardDescription>{t.auth.resetPasswordDesc}</CardDescription>
              </CardHeader>

              <CardContent>
                {isSuccess ? (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          {t.auth.passwordResetSuccess}
                        </p>
                      </div>
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
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">{t.auth.newPassword}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-focus-ring pe-10"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <PasswordStrengthBar password={password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t.auth.confirmNewPassword}</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`input-focus-ring pe-10 ${confirmPassword && password !== confirmPassword ? 'border-destructive' : ''}`}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-destructive animate-shake">
                          {locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-shadow"
                      size="lg"
                      disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" role="status" aria-label="Loading" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 me-2" />
                      )}
                      {t.auth.resetPassword}
                    </Button>
                  </form>
                )}
              </CardContent>

              {!isSuccess && (
                <CardFooter>
                  <div className="text-sm text-muted-foreground text-center w-full">
                    <Link href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1">
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

export default function ResetPasswordContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
