'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Brain, Eye, EyeOff, Sun, Moon, Globe, ArrowRight, Loader2, Sparkles, Users, Briefcase, GitBranch } from 'lucide-react';
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
  const [socialLoading, setSocialLoading] = useState<'google' | 'linkedin' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.auth.invalidEmail;
    }
    if (!password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    } else if (password.length < 6) {
      newErrors.password = t.auth.passwordMinLength;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    setSocialLoading(provider);
    try {
      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: false,
      });

      if (result?.error) {
        toast.error(t.socialLogin.socialLoginError);
      } else if (result?.ok) {
        // Fetch the session to get user data
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        if (session?.user) {
          setUser({
            id: (session.user as Record<string, unknown>).id as string || '',
            email: session.user.email || '',
            name: session.user.name || '',
            role: (session.user as Record<string, unknown>).role as string as any || 'CANDIDATE',
            image: session.user.image || undefined,
            companyId: (session.user as Record<string, unknown>).companyId as string || undefined,
            companyName: (session.user as Record<string, unknown>).companyName as string || undefined,
            locale: (session.user as Record<string, unknown>).locale as string || 'en',
          });
          toast.success(t.socialLogin.socialLoginSuccess);
          router.push('/');
        }
      }
    } catch {
      toast.error(t.socialLogin.socialLoginError);
    } finally {
      setSocialLoading(null);
    }
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
          toast.success(t.auth.signInSuccess);
          router.push('/');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || t.auth.invalidCredentials);
      }
    } catch {
      toast.error(t.auth.signInError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        {/* Animated background shapes */}
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
              {t.auth.hireSmarter}<br />
              <span className="text-white/80">{t.auth.withAI}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {t.auth.landingDesc}
            </p>
          </div>
          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{t.auth.featureAIScreening}</p>
                <p className="text-xs text-white/60">{t.auth.featureAIScreeningDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{t.auth.featureSmartPipeline}</p>
                <p className="text-xs text-white/60">{t.auth.featureSmartPipelineDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{t.auth.featureAIMatching}</p>
                <p className="text-xs text-white/60">{t.auth.featureAIMatchingDesc}</p>
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
                <Button variant="ghost" size="icon" className="h-9 w-9">
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
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
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
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      className="h-11 gap-2 bg-[#4285F4] hover:bg-[#3574d4] text-white font-medium transition-all hover:scale-[1.02] hover:shadow-md"
                      onClick={() => handleSocialLogin('google')}
                      disabled={socialLoading !== null}
                    >
                      {socialLoading === 'google' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/></svg>
                      )}
                      {socialLoading === 'google' ? t.socialLogin.connecting : t.socialLogin.signInWithGoogle}
                    </Button>
                    <Button
                      type="button"
                      className="h-11 gap-2 bg-[#0A66C2] hover:bg-[#0856a5] text-white font-medium transition-all hover:scale-[1.02] hover:shadow-md"
                      onClick={() => handleSocialLogin('linkedin')}
                      disabled={socialLoading !== null}
                    >
                      {socialLoading === 'linkedin' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      )}
                      {socialLoading === 'linkedin' ? t.socialLogin.connecting : t.socialLogin.signInWithLinkedIn}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground/70">{t.socialLogin.orContinueWith}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.auth.enterEmail}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                      className={`transition-all duration-200 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-teal-500 focus-visible:ring-offset-2'}`}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-sm text-destructive animate-slide-in-from-top">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t.auth.password}</Label>
                      <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                        {t.auth.forgotPassword}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t.auth.enterPassword}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                        className={`transition-all duration-200 ${errors.password ? 'border-destructive pe-10' : 'pe-10 focus-visible:ring-teal-500 focus-visible:ring-offset-2'}`}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.auth.passwordRequirement}</p>
                    {errors.password && <p className="text-sm text-destructive animate-slide-in-from-top">{errors.password}</p>}
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
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
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
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
