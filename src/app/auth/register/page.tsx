// @ts-nocheck
'use client'

import { useState, useMemo } from 'react';
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
  Zap,
  TrendingUp,
  Globe as GlobeIcon,
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

function PasswordStrength({ password }: { password: string }) {
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

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthClasses = ['', 'password-strength-weak', 'password-strength-fair', 'password-strength-good', 'password-strength-strong', 'password-strength-strong'];
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500', 'text-teal-500'];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthClasses[strength] : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const reqs = [
    { met: password.length >= 8, label: 'req8Chars' as const },
    { met: /[A-Z]/.test(password), label: 'reqUppercase' as const },
    { met: /[0-9]/.test(password), label: 'reqNumber' as const },
    { met: /[^A-Za-z0-9]/.test(password), label: 'reqSpecial' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
      {reqs.map((req) => (
        <div key={req.label} className={`password-req ${req.met ? 'password-req-met' : ''}`}>
          <span className="password-req-icon">
            {req.met && <Check className="w-2.5 h-2.5" />}
          </span>
          <span>{req.label === 'req8Chars' ? 'At least 8 characters' : req.label === 'reqUppercase' ? 'One uppercase letter' : req.label === 'reqNumber' ? 'One number' : 'One special character'}</span>
        </div>
      ))}
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step calculation
  const currentStep = useMemo(() => {
    if (!email.trim() || !password.trim()) return 1;
    if (!name.trim()) return 2;
    return 3;
  }, [email, password, name]);

  const steps = [
    { num: 1, label: t.auth.step1 },
    { num: 2, label: t.auth.step2 },
    { num: 3, label: t.auth.step3 },
  ];

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const isAr = locale === 'ar';

    if (!name.trim()) {
      newErrors.name = isAr ? 'الاسم مطلوب' : 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = isAr ? 'الاسم قصير جداً' : 'Name is too short';
    }

    if (!email.trim()) {
      newErrors.email = isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = isAr ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    }

    if (!password.trim()) {
      newErrors.password = isAr ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    }

    if (roleCategory === 'company' && !companyName.trim()) {
      newErrors.companyName = isAr ? 'اسم الشركة مطلوب' : 'Company name is required';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = isAr ? 'يجب الموافقة على الشروط' : 'You must agree to the terms';
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
        toast.success(locale === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
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
        toast.error(data.error || (locale === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration failed'));
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const roleCategories: { key: RoleCategory; icon: typeof User; label: string; desc: string; detail: string; color: string }[] = [
    { key: 'candidate', icon: User, label: t.auth.candidateAccount, desc: locale === 'ar' ? 'ابحث عن وظيفة' : 'Find your dream job', detail: locale === 'ar' ? 'سيرة ذاتية ذكية ومطابقة AI' : 'AI resume & job matching', color: 'from-teal-500 to-emerald-600' },
    { key: 'company', icon: Building2, label: t.auth.companyAccount, desc: locale === 'ar' ? 'وظّف المواهب' : 'Hire top talent', detail: locale === 'ar' ? 'فرز ذكي وخط توظيف' : 'Smart screening & pipeline', color: 'from-teal-500 to-emerald-600' },
    { key: 'admin', icon: ShieldCheck, label: t.auth.adminAccount, desc: locale === 'ar' ? 'إدارة المنصة' : 'Platform admin', detail: locale === 'ar' ? 'إعدادات ومراقبة شاملة' : 'Full admin & monitoring', color: 'from-teal-500 to-emerald-600' },
  ];

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 animate-gradient-x" style={{ backgroundSize: '200% 200%' }}>
        {/* Floating decorative shapes */}
        <div className="absolute top-[12%] start-[8%] w-16 h-16 border-2 border-white/20 rounded-full auth-float-shape" />
        <div className="absolute bottom-[20%] end-[10%] w-20 h-20 border-2 border-white/15 rounded-xl rotate-45 auth-float-shape" />
        <div className="absolute top-[45%] start-[25%] w-14 h-14 bg-white/5 rounded-lg -rotate-12 auth-float-shape" />
        <div className="absolute top-[75%] end-[25%] w-10 h-10 border-2 border-white/10 rounded-full auth-float-shape" />

        {/* Blurred glow shapes */}
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
              {locale === 'ar' ? 'ابدأ رحلتك' : 'Start Your'}<br />
              <span className="text-white/80">{locale === 'ar' ? 'معنا اليوم' : 'Journey Today'}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              {locale === 'ar' ? 'انضم إلينا واستفد من قوة الذكاء الاصطناعي في التوظيف' : 'Join thousands of companies and candidates using AI to transform hiring'}
            </p>
          </div>

          {/* Why join TalentFlow */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">{t.auth.whyJoin}</h3>
            <div className="space-y-3">
              <div className="feature-bullet">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature1}</p>
                  <p className="text-xs text-white/60">{t.auth.feature1Desc}</p>
                </div>
              </div>
              <div className="feature-bullet">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature2}</p>
                  <p className="text-xs text-white/60">{t.auth.feature2Desc}</p>
                </div>
              </div>
              <div className="feature-bullet">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <GlobeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature3}</p>
                  <p className="text-xs text-white/60">{t.auth.feature3Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-xs text-white/60">{locale === 'ar' ? 'متقدم' : 'Candidates'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-xs text-white/60">{locale === 'ar' ? 'شركة' : 'Companies'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">50K+</p>
              <p className="text-xs text-white/60">{locale === 'ar' ? 'وظيفة' : 'Jobs'}</p>
            </div>
          </div>
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
                  {/* Step Indicator */}
                  <div className="flex items-center gap-0 w-full px-2">
                    {steps.map((step, i) => (
                      <div key={step.num} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`step-dot ${currentStep > step.num ? 'step-dot-completed' : currentStep === step.num ? 'step-dot-active' : ''}`}>
                            {currentStep > step.num ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span>{step.num}</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-medium whitespace-nowrap ${currentStep === step.num ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`step-line mx-2 mt-[-18px] ${currentStep > step.num ? 'step-line-active' : ''}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Social Signup Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => toast.info('Google signup coming soon')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => toast.info('LinkedIn signup coming soon')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </button>
                    <button
                      type="button"
                      className="social-btn flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98] dark:text-white"
                      onClick={() => toast.info('GitHub signup coming soon')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground/70">{t.auth.orSignUpWithEmail}</span></div>
                  </div>

                  {/* Role Selection - Visual Cards */}
                  <div className="space-y-2">
                    <Label>{t.auth.selectRole}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {roleCategories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = roleCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => handleRoleCategoryChange(cat.key)}
                            className={`card-hover-glow flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center group min-w-[100px] min-h-[110px] ${
                              isSelected
                                ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 shadow-sm ring-2 ring-teal-500/30 scale-[1.02] role-card-selected'
                                : 'border-border hover:border-teal-300 dark:hover:border-teal-700'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color} text-white group-hover:scale-110 transition-transform`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-muted-foreground'}`}>
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{cat.desc}</span>
                            <span className="text-[9px] text-teal-600/60 dark:text-teal-400/60 leading-tight line-clamp-1 font-medium">{cat.detail}</span>
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
                        placeholder={locale === 'ar' ? 'أدخل اسم الشركة' : 'Enter company name'}
                        value={companyName}
                        onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: undefined })); }}
                        className={`input-focus-ring transition-colors ${errors.companyName ? 'border-destructive' : ''}`}
                      />
                      {errors.companyName && <p className="text-sm text-destructive animate-shake">{errors.companyName}</p>}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.auth.name}</Label>
                    <Input
                      id="name"
                      placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                      className={`input-focus-ring transition-colors ${errors.name ? 'border-destructive' : ''}`}
                      autoComplete="name"
                    />
                    {errors.name && <p className="text-sm text-destructive animate-shake">{errors.name}</p>}
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
                      className={`input-focus-ring transition-colors ${errors.email ? 'border-destructive' : ''}`}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-sm text-destructive animate-shake">{errors.email}</p>}
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
                        className={`input-focus-ring transition-colors ${errors.password ? 'border-destructive pe-10' : 'pe-10'}`}
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
                    <PasswordStrength password={password} />
                    <PasswordRequirements password={password} />
                    {errors.password && <p className="text-sm text-destructive animate-shake">{errors.password}</p>}
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
                        className={`input-focus-ring transition-colors ${errors.confirmPassword ? 'border-destructive pe-10' : 'pe-10'}`}
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
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {locale === 'ar' ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
                      </p>
                    )}
                    {errors.confirmPassword && <p className="text-sm text-destructive animate-shake">{errors.confirmPassword}</p>}
                  </div>

                  {/* Terms and Privacy checkbox */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => { setAgreeTerms(checked === true); setErrors((p) => ({ ...p, agreeTerms: undefined })); }}
                        className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                        {t.auth.agreeTerms}{' '}
                        <Link href="#" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 underline underline-offset-2">
                          {t.auth.termsLink}
                        </Link>{' '}
                        {t.auth.andText}{' '}
                        <Link href="#" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 underline underline-offset-2">
                          {t.auth.privacyLink}
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeTerms && <p className="text-sm text-destructive animate-shake">{errors.agreeTerms}</p>}
                  </div>

                  {/* Submit */}
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
