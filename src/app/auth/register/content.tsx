// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
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
import { toast } from 'sonner';
import {
  Brain,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Globe,
  ArrowRight,
  Loader2,
  User,
  Building2,
  ShieldCheck,
  Sparkles,
  Check,
  Briefcase,
  GitBranch,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type RoleCategory = 'candidate' | 'company' | 'admin';

const companySubRoles = [
  { value: 'COMPANY_ADMIN', key: 'companyAdmin' as const },
  { value: 'HR_MANAGER', key: 'hrManager' as const },
  { value: 'RECRUITER', key: 'recruiter' as const },
  { value: 'REVIEWER', key: 'reviewer' as const },
];

const adminSubRoles = [
  { value: 'SUPER_ADMIN', key: 'superAdmin' as const },
  { value: 'ADMIN', key: 'admin' as const },
  { value: 'MODERATOR', key: 'moderator' as const },
];

function PasswordStrength({ password, t }: { password: string; t: Record<string, string | undefined> }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s += 1;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const labels = ['', t.strengthWeak, t.strengthFair, t.strengthGood, t.strengthStrong, t.strengthExcellent];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-teal-500'];
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500', 'text-teal-500'];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const { setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleCategory, setRoleCategory] = useState<RoleCategory>('candidate');
  const [subRole, setSubRole] = useState('COMPANY_ADMIN');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'linkedin' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Progress steps
  const currentStep = roleCategory === 'company' && !companyName.trim() ? 1 : !name.trim() ? 1 : !email.trim() ? 2 : !password.trim() ? 3 : password !== confirmPassword ? 3 : 4;
  const totalSteps = 4;

  const handleRoleCategoryChange = (cat: RoleCategory) => {
    setRoleCategory(cat);
    if (cat === 'candidate') {
      setSubRole('CANDIDATE');
    } else if (cat === 'company') {
      setSubRole('COMPANY_ADMIN');
    } else {
      setSubRole('SUPER_ADMIN');
    }
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t.auth.nameRequired;
    } else if (name.trim().length < 2) {
      newErrors.name = t.auth.nameTooShort;
    }

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

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.auth.passwordsNoMatch;
    }

    if (roleCategory === 'company' && !companyName.trim()) {
      newErrors.companyName = t.auth.companyNameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: roleCategory === 'candidate' ? 'CANDIDATE' : subRole,
          companyName: roleCategory === 'company' ? companyName.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t.auth.accountCreated);
        // Auto sign in after registration
        const signInRes = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        if (signInRes.ok) {
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          if (session?.user) {
            setUser({
              id: (session.user as Record<string, unknown>).id as string || '',
              email: session.user.email || email,
              name: session.user.name || name,
              role: (session.user as Record<string, unknown>).role as string as any || 'CANDIDATE',
              image: session.user.image || undefined,
              companyId: (session.user as Record<string, unknown>).companyId as string || undefined,
              companyName: (session.user as Record<string, unknown>).companyName as string || undefined,
              locale: (session.user as Record<string, unknown>).locale as string || 'en',
            });
          }
        }
        router.push('/');
      } else {
        toast.error(data.error || t.auth.registrationFailed);
      }
    } catch {
      toast.error(t.auth.registrationError);
    } finally {
      setIsLoading(false);
    }
  };

  const roleCategories: { key: RoleCategory; icon: typeof User; label: string; desc: string; color: string }[] = [
    { key: 'candidate', icon: User, label: t.auth.candidateAccount, desc: t.auth.candidateDesc, color: 'from-teal-500 to-emerald-600' },
    { key: 'company', icon: Building2, label: t.auth.companyAccount, desc: t.auth.companyDesc, color: 'from-teal-500 to-emerald-600' },
    { key: 'admin', icon: ShieldCheck, label: t.auth.adminAccount, desc: t.auth.adminDesc, color: 'from-teal-500 to-emerald-600' },
  ];

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        <div className="absolute inset-0">
          <div className="absolute top-[15%] start-[15%] w-56 h-56 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[25%] end-[10%] w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[60%] start-[30%] w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
        </div>
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              {t.auth.startYour}<br />
              <span className="text-white/80">{t.auth.journeyToday}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {t.auth.registerLandingDesc}
            </p>
          </div>
          {/* Stats - fetched from platform */}
        </div>
      </div>

      {/* Right side - Register Form */}
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
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-lg">
            <div className="fixed top-0 end-0 w-96 h-96 bg-gradient-to-bl from-teal-200/20 to-transparent rounded-full blur-3xl dark:from-teal-800/10 lg:hidden" />
            <div className="fixed bottom-0 start-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-transparent rounded-full blur-3xl dark:from-emerald-800/10 lg:hidden" />

            <Card className="relative border-border/50 shadow-xl shadow-teal-500/5 animate-scale-in">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{t.auth.signUp}</CardTitle>
                <CardDescription>{t.auth.signUpSubtitle}</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          i + 1 <= currentStep ? 'bg-gradient-to-r from-teal-500 to-emerald-500 scale-y-110' : 'bg-muted'
                        }`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>

                  {/* Social Signup Buttons */}
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
                      {socialLoading === 'google' ? t.socialLogin.connecting : t.socialLogin.signUpWithGoogle}
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
                      {socialLoading === 'linkedin' ? t.socialLogin.connecting : t.socialLogin.signUpWithLinkedIn}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground/70">{t.socialLogin.orSignUpWith}</span></div>
                  </div>

                  {/* Role Selection - Visual Cards */}
                  <div className="space-y-2">
                    <Label>{t.auth.selectRole}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {roleCategories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => handleRoleCategoryChange(cat.key)}
                            className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all text-center group min-w-[100px] min-h-[110px] ${
                              roleCategory === cat.key
                                ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 shadow-sm ring-2 ring-teal-500/30 scale-[1.02]'
                                : 'border-border hover:border-teal-300 dark:hover:border-teal-700 hover:scale-[1.02]'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color} text-white group-hover:scale-110 transition-transform`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${roleCategory === cat.key ? 'text-teal-700 dark:text-teal-300' : 'text-muted-foreground'}`}>
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{cat.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-role selection for company/admin */}
                  {roleCategory === 'company' && (
                    <div className="space-y-2 animate-slide-in-from-top">
                      <Label>{t.auth.signUpAs}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {companySubRoles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSubRole(role.value)}
                            className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              subRole === role.value
                                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-400'
                                : 'border-border text-muted-foreground hover:border-teal-300 dark:hover:border-teal-700'
                            }`}
                          >
                            {t.auth[role.key]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {roleCategory === 'admin' && (
                    <div className="space-y-2 animate-slide-in-from-top">
                      <Label>{t.auth.signUpAs}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {adminSubRoles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSubRole(role.value)}
                            className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              subRole === role.value
                                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-400'
                                : 'border-border text-muted-foreground hover:border-teal-300 dark:hover:border-teal-700'
                            }`}
                          >
                            {t.auth[role.key]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company name field */}
                  {roleCategory === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">{t.company.name}</Label>
                      <Input
                        id="companyName"
                        placeholder={t.auth.enterCompanyName}
                        value={companyName}
                        onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: undefined })); }}
                        className={`transition-colors ${errors.companyName ? 'border-destructive' : 'focus-visible:ring-teal-500'}`}
                      />
                      {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.auth.name}</Label>
                    <Input
                      id="name"
                      placeholder={t.auth.enterFullName}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                      className={`transition-colors ${errors.name ? 'border-destructive' : 'focus-visible:ring-teal-500'}`}
                      autoComplete="name"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                      className={`transition-colors ${errors.email ? 'border-destructive' : 'focus-visible:ring-teal-500'}`}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  {/* Password with strength indicator */}
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.auth.password}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                        className={`transition-colors ${errors.password ? 'border-destructive pe-10' : 'pe-10 focus-visible:ring-teal-500'}`}
                        autoComplete="new-password"
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
                    <PasswordStrength password={password} t={t.auth} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                        className={`transition-colors ${errors.confirmPassword ? 'border-destructive pe-10' : 'pe-10 focus-visible:ring-teal-500'}`}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {t.auth.passwordsMatch}
                      </p>
                    )}
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  {/* Submit */}
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
                    {t.auth.signUp}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground text-center">
                  {t.auth.hasAccount}{' '}
                  <Link href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300">
                    {t.auth.signIn}
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
