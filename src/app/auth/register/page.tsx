// @ts-nocheck
'use client'

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { signIn } from 'next-auth/react';
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
  Globe,
  ArrowRight,
  Loader2,
  User,
  Building2,
  ShieldCheck,
  Check,
  Zap,
  TrendingUp,
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
  const strengthClasses = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-blue-600'];
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-blue-600'];

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
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
      {reqs.map((req, idx) => (
        <div key={idx} className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-blue-600' : 'text-muted-foreground'}`}>
          {req.met && <Check className="w-2.5 h-2.5" />}
          <span>{req.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const { setUser } = useAuth();
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
        const signInResult = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (!signInResult?.error) {
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

  const roleCategories: { key: RoleCategory; icon: typeof User; label: string; desc: string }[] = [
    { key: 'candidate', icon: User, label: t.auth.candidateAccount, desc: locale === 'ar' ? 'ابحث عن وظيفة' : 'Find your dream job' },
    { key: 'company', icon: Building2, label: t.auth.companyAccount, desc: locale === 'ar' ? 'وظّف المواهب' : 'Hire top talent' },
    { key: 'admin', icon: ShieldCheck, label: t.auth.adminAccount, desc: locale === 'ar' ? 'إدارة المنصة' : 'Platform admin' },
  ];

  return (
    <div dir={dir} className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TalentFlow AI</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              {locale === 'ar' ? 'ابدأ رحلتك' : 'Start Your'}<br />
              <span className="text-white/70">{locale === 'ar' ? 'معنا اليوم' : 'Journey Today'}</span>
            </h1>
            <p className="text-lg text-white/60 max-w-md">
              {locale === 'ar' ? 'انضم إلينا واستفد من قوة الذكاء الاصطناعي في التوظيف' : 'Join thousands of companies and candidates using AI to transform hiring'}
            </p>
          </div>

          {/* Why join TalentFlow */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">{t.auth.whyJoin}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature1}</p>
                  <p className="text-xs text-white/50">{t.auth.feature1Desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature2}</p>
                  <p className="text-xs text-white/50">{t.auth.feature2Desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{t.auth.feature3}</p>
                  <p className="text-xs text-white/50">{t.auth.feature3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 lg:hidden">
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
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-lg">
            <Card className="relative border-border/50 shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">{t.auth.signUp}</CardTitle>
                <CardDescription>{t.auth.signUpSubtitle}</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Social Signup Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                      onClick={() => toast.info('Google signup coming soon')}
                    >
                      <img src="https://api.iconify.design/logos:google-icon.svg" alt="" width={16} height={16} />
                      Google
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                      onClick={() => toast.info('LinkedIn signup coming soon')}
                    >
                      <img src="https://api.iconify.design/logos:linkedin-icon.svg" alt="" width={16} height={16} />
                      LinkedIn
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border hover:bg-muted"
                      onClick={() => toast.info('GitHub signup coming soon')}
                    >
                      <img src="https://api.iconify.design/logos:github-icon.svg" alt="" width={16} height={16} />
                      GitHub
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground/70">{t.auth.orSignUpWithEmail}</span></div>
                  </div>

                  {/* Role Selection */}
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
                            className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-border hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${isSelected ? 'text-blue-700' : 'text-muted-foreground'}`}>
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{cat.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-role selection for company/admin */}
                  {roleCategory === 'company' && (
                    <div className="space-y-2">
                      <Label>{t.auth.signUpAs}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {companySubRoles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSubRole(role.value)}
                            className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              subRole === role.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-border text-muted-foreground hover:border-slate-300'
                            }`}
                          >
                            {t.auth[role.key]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {roleCategory === 'admin' && (
                    <div className="space-y-2">
                      <Label>{t.auth.signUpAs}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {adminSubRoles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSubRole(role.value)}
                            className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              subRole === role.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-border text-muted-foreground hover:border-slate-300'
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
                        className={`transition-colors ${errors.companyName ? 'border-destructive' : ''}`}
                      />
                      {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
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
                      className={`transition-colors ${errors.name ? 'border-destructive' : ''}`}
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
                      className={`transition-colors ${errors.email ? 'border-destructive' : ''}`}
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
                        className={`transition-colors ${errors.password ? 'border-destructive pe-10' : 'pe-10'}`}
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
                        className={`transition-colors ${errors.confirmPassword ? 'border-destructive pe-10' : 'pe-10'}`}
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
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {locale === 'ar' ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
                      </p>
                    )}
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  {/* Terms and Privacy checkbox */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => { setAgreeTerms(checked === true); setErrors((p) => ({ ...p, agreeTerms: undefined })); }}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                        {t.auth.agreeTerms}{' '}
                        <Link href="#" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                          {t.auth.termsLink}
                        </Link>{' '}
                        {t.auth.andText}{' '}
                        <Link href="#" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                          {t.auth.privacyLink}
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                  <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
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

// Need these imports for the branding section

