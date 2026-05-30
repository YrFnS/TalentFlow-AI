// @ts-nocheck
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Brain, Eye, EyeOff, Sun, Moon, Globe, ArrowRight, Loader2, Sparkles, Users, GitBranch, ShieldCheck, KeyRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LoginPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const { setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const tf = t.twoFactor || {} as any;

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = locale === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    }
    if (!password.trim()) {
      newErrors.password = locale === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Fetch the session to get user data
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        if (session?.user) {
          setUser({
            id: (session.user as Record<string, unknown>).id as string || '',
            email: session.user.email || email,
            name: session.user.name || '',
            role: (session.user as Record<string, unknown>).role as string as any || 'CANDIDATE',
            image: session.user.image || undefined,
            companyId: (session.user as Record<string, unknown>).companyId as string || undefined,
            companyName: (session.user as Record<string, unknown>).companyName as string || undefined,
            locale: (session.user as Record<string, unknown>).locale as string || 'en',
          });
          toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully');
          router.push('/');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error || '';

        // Check if 2FA is required
        if (errorMsg.includes('2FA_REQUIRED:')) {
          const userId = errorMsg.split('2FA_REQUIRED:')[1];
          setTwoFAUserId(userId);
          setShow2FA(true);
        } else {
          toast.error(errorMsg || (locale === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
        }
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = useBackupCode ? backupCode : totpToken;

    if (!token.trim()) {
      toast.error(tf.invalidCode || 'Invalid authentication code');
      return;
    }

    setIsVerifying2FA(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFAUserId, token }),
      });

      if (res.ok) {
        // Now sign in with credentials + totpToken to complete NextAuth login
        const loginRes = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, totpToken: token }),
        });

        if (loginRes.ok) {
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();

          if (session?.user) {
            setUser({
              id: (session.user as Record<string, unknown>).id as string || '',
              email: session.user.email || email,
              name: session.user.name || '',
              role: (session.user as Record<string, unknown>).role as string as any || 'CANDIDATE',
              image: session.user.image || undefined,
              companyId: (session.user as Record<string, unknown>).companyId as string || undefined,
              companyName: (session.user as Record<string, unknown>).companyName as string || undefined,
              locale: (session.user as Record<string, unknown>).locale as string || 'en',
            });
            toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully');
            router.push('/');
          }
        } else {
          const data = await loginRes.json().catch(() => ({}));
          toast.error(data?.error || tf.invalidCode || 'Invalid authentication code');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || tf.invalidCode || 'Invalid authentication code');
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء التحقق' : 'An error occurred during verification');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const avatarColors = [
    'from-teal-400 to-emerald-500',
    'from-cyan-400 to-teal-500',
    'from-emerald-400 to-green-500',
    'from-teal-500 to-cyan-600',
    'from-green-400 to-emerald-500',
  ];

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        {/* Animated floating decorative shapes */}
        <div className="absolute top-[8%] start-[5%] w-20 h-20 border-2 border-white/20 rounded-lg rotate-12 auth-float-shape" />
        <div className="absolute top-[60%] end-[12%] w-16 h-16 border-2 border-white/15 rounded-full auth-float-shape" />
        <div className="absolute bottom-[15%] start-[20%] w-24 h-24 border-2 border-white/10 rounded-2xl -rotate-12 auth-float-shape" />
        <div className="absolute top-[30%] end-[30%] w-12 h-12 bg-white/5 rounded-lg rotate-45 auth-float-shape" />

        {/* Blurred glow shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] start-[10%] w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[20%] end-[15%] w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[50%] start-[40%] w-40 h-40 bg-white/10 rounded-full blur-xl animate-float" />
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              {locale === 'ar' ? 'وظّف بذكاء' : 'Hire Smarter'}<br />
              <span className="text-white/80">{locale === 'ar' ? 'مع الذكاء الاصطناعي' : 'with AI'}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {locale === 'ar' ? 'المنصة الجديدة من الجيل القادم لإدارة الموارد البشرية والتوظيف' : 'The next-generation HR & ATS platform that transforms your hiring process'}
            </p>
          </div>

          {/* Testimonial */}
          <div className="auth-testimonial mb-6">
            <p className="text-sm text-white/90 italic leading-relaxed">
              {t.auth.testimonial}
            </p>
            <p className="text-xs text-white/50 mt-1">{t.auth.testimonialAuthor}</p>
          </div>

          {/* Social proof */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="avatar-stack">
                {avatarColors.map((color, i) => (
                  <div key={i} className={`avatar-stack-item bg-gradient-to-br ${color}`}>
                    {['SC', 'AK', 'MG', 'JL', 'RH'][i]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-white/70">{t.auth.socialProof}</span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{locale === 'ar' ? 'فرز بالذكاء الاصطناعي' : 'AI-Powered Screening'}</p>
                <p className="text-xs text-white/60">{locale === 'ar' ? 'تحليل تلقائي للسير الذاتية' : 'Automatic resume analysis & ranking'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{locale === 'ar' ? 'خط توظيف ذكي' : 'Smart Pipeline'}</p>
                <p className="text-xs text-white/60">{locale === 'ar' ? 'تتبع كل مرشح بسلاسة' : 'Track every candidate seamlessly'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{locale === 'ar' ? 'مطابقة ذكية' : 'AI Matching'}</p>
                <p className="text-xs text-white/60">{locale === 'ar' ? 'إيجاد أفضل المرشحين' : 'Find the best candidates faster'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
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
            <div className="fixed top-0 end-0 w-96 h-96 bg-gradient-to-bl from-teal-200/20 to-transparent rounded-full blur-3xl dark:from-teal-800/10 lg:hidden" />
            <div className="fixed bottom-0 start-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-transparent rounded-full blur-3xl dark:from-emerald-800/10 lg:hidden" />

            <Card className="relative border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
              {!show2FA ? (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t.auth.signIn}</CardTitle>
                    <CardDescription>{t.auth.signInSubtitle}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Social Login Buttons */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => toast.info('Google login coming soon')}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          Google
                        </button>
                        <button
                          type="button"
                          className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => toast.info('LinkedIn login coming soon')}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          LinkedIn
                        </button>
                        <button
                          type="button"
                          className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98] dark:text-white"
                          onClick={() => toast.info('GitHub login coming soon')}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground/70">{t.auth.orContinueWithEmail}</span></div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t.auth.email}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                          className={`input-focus-ring transition-all duration-200 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          autoComplete="email"
                        />
                        {errors.email && <p className="text-sm text-destructive animate-slide-in-from-top animate-shake">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">{t.auth.password}</Label>
                          <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400">
                            {t.auth.forgotPassword}
                          </Link>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                            className={`input-focus-ring transition-all duration-200 ${errors.password ? 'border-destructive pe-10' : 'pe-10'}`}
                            autoComplete="current-password"
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
                        {errors.password && <p className="text-sm text-destructive animate-slide-in-from-top animate-shake">{errors.password}</p>}
                      </div>

                      {/* Remember me */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                          className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                          {t.auth.rememberMe}
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-shadow"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin me-2" role="status" aria-label="Loading" />
                        ) : (
                          <ArrowRight className="h-4 w-4 me-2" />
                        )}
                        {t.auth.signIn}
                      </Button>
                    </form>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-4">
                    <div className="text-sm text-muted-foreground text-center">
                      {t.auth.noAccount}{' '}
                      <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300">
                        {t.auth.signUp}
                      </Link>
                    </div>
                    {/* Continue as Guest */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">{t.auth.justBrowsing} </span>
                      <Link
                        href="/candidate/explore"
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 underline underline-offset-2"
                      >
                        {t.auth.continueAsGuest}
                      </Link>
                    </div>
                  </CardFooter>
                </>
              ) : (
                /* 2FA Verification Step */
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                      <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{tf.verifyStep || 'Verification Required'}</CardTitle>
                    <CardDescription>{tf.verifyStepDesc || 'Enter the code from your authenticator app to complete login'}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handle2FAVerify} className="space-y-4">
                      {!useBackupCode ? (
                        <div className="space-y-2">
                          <Label htmlFor="totp-token">{tf.totpCode || 'Authentication Code'}</Label>
                          <Input
                            id="totp-token"
                            type="text"
                            placeholder={tf.totpPlaceholder || 'Enter 6-digit code'}
                            value={totpToken}
                            onChange={(e) => setTotpToken(e.target.value)}
                            className="input-focus-ring transition-all duration-200 text-center text-2xl tracking-[0.5em] font-mono"
                            maxLength={6}
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="backup-code">{tf.backupCodePlaceholder || 'Enter backup code'}</Label>
                          <Input
                            id="backup-code"
                            type="text"
                            placeholder={tf.backupCodePlaceholder || 'Enter backup code'}
                            value={backupCode}
                            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                            className="input-focus-ring transition-all duration-200 text-center text-lg tracking-wider font-mono"
                            autoComplete="off"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Toggle between TOTP and backup code */}
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 underline underline-offset-2"
                          onClick={() => {
                            setUseBackupCode(!useBackupCode);
                            setTotpToken('');
                            setBackupCode('');
                          }}
                        >
                          {useBackupCode
                            ? (tf.totpCode || 'Use authentication code')
                            : (tf.useBackupCode || 'Use a backup code')
                          }
                        </button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-shadow"
                        size="lg"
                        disabled={isVerifying2FA}
                      >
                        {isVerifying2FA ? (
                          <Loader2 className="h-4 w-4 animate-spin me-2" role="status" aria-label="Verifying" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 me-2" />
                        )}
                        {t.auth.signIn}
                      </Button>

                      {/* Back to login */}
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setShow2FA(false);
                          setTwoFAUserId('');
                          setTotpToken('');
                          setBackupCode('');
                          setUseBackupCode(false);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 me-2 rotate-180" />
                        {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login'}
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
