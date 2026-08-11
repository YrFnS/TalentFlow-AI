'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegistrationResponse = {
  error?: string;
  message?: string;
  verificationSent?: boolean;
  user?: {
    email?: string;
  };
};

type FieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'confirmPassword', string>
>;

function safeCallbackPath(rawValue: string | null): string {
  if (!rawValue) return '/candidate';

  try {
    const value = decodeURIComponent(rawValue);
    const url = new URL(value, 'https://talentflow.local');
    if (
      url.origin === 'https://talentflow.local' &&
      url.pathname.startsWith('/') &&
      !url.pathname.startsWith('//') &&
      !url.pathname.startsWith('/api/') &&
      url.pathname !== '/auth/register'
    ) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Fall through to the candidate dashboard.
  }

  return '/candidate';
}

function passwordChecks(password: string) {
  return [
    { key: 'length', valid: password.length >= 8 },
    { key: 'uppercase', valid: /[A-Z]/.test(password) },
    { key: 'lowercase', valid: /[a-z]/.test(password) },
    { key: 'number', valid: /[0-9]/.test(password) },
  ] as const;
}

export default function RegisterPage() {
  const { locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = dir === 'rtl';
  const copy = useMemo(
    () =>
      isArabic
        ? {
            title: 'إنشاء حساب مرشح',
            subtitle: 'أنشئ ملفك الشخصي، تابع طلباتك، واستلم تحديثات المقابلات.',
            candidateOnly: 'التسجيل العام متاح للمرشحين فقط',
            managedAccounts:
              'حسابات الشركات والإدارة يتم إنشاؤها أو دعوتها من مسؤول معتمد.',
            name: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            confirmPassword: 'تأكيد كلمة المرور',
            create: 'إنشاء الحساب',
            creating: 'جارٍ إنشاء الحساب…',
            haveAccount: 'لديك حساب بالفعل؟',
            signIn: 'تسجيل الدخول',
            nameRequired: 'أدخل اسمك الكامل.',
            nameShort: 'يجب أن يتكون الاسم من حرفين على الأقل.',
            emailRequired: 'أدخل بريدك الإلكتروني.',
            emailInvalid: 'أدخل بريداً إلكترونياً صالحاً.',
            passwordInvalid: 'كلمة المرور لا تستوفي متطلبات الأمان.',
            confirmRequired: 'أعد كتابة كلمة المرور.',
            passwordMismatch: 'كلمتا المرور غير متطابقتين.',
            created: 'تم إنشاء حسابك',
            createdBody:
              'تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول للعودة إلى الوظيفة أو لوحة المرشح.',
            continueSignIn: 'المتابعة إلى تسجيل الدخول',
            useAnother: 'إنشاء حساب آخر',
            verificationSent: 'تم إرسال رسالة التحقق إلى',
            rules: {
              length: '8 أحرف على الأقل',
              uppercase: 'حرف إنجليزي كبير',
              lowercase: 'حرف إنجليزي صغير',
              number: 'رقم واحد على الأقل',
            },
            benefitOne: 'متابعة حالة كل طلب',
            benefitTwo: 'إدارة السيرة الذاتية والملف المهني',
            benefitThree: 'استلام مواعيد المقابلات والإشعارات',
            genericError: 'تعذر إنشاء الحساب. حاول مرة أخرى.',
          }
        : {
            title: 'Create a candidate account',
            subtitle:
              'Build your profile, track applications, and receive interview updates.',
            candidateOnly: 'Public registration is for candidates only',
            managedAccounts:
              'Company and administration accounts are created or invited by an authorized administrator.',
            name: 'Full name',
            email: 'Email address',
            password: 'Password',
            confirmPassword: 'Confirm password',
            create: 'Create account',
            creating: 'Creating account…',
            haveAccount: 'Already have an account?',
            signIn: 'Sign in',
            nameRequired: 'Enter your full name.',
            nameShort: 'Your name must contain at least two characters.',
            emailRequired: 'Enter your email address.',
            emailInvalid: 'Enter a valid email address.',
            passwordInvalid: 'Your password does not meet the security requirements.',
            confirmRequired: 'Repeat your password.',
            passwordMismatch: 'The passwords do not match.',
            created: 'Your account was created',
            createdBody:
              'Verify your email, then sign in to return to the selected job or your candidate dashboard.',
            continueSignIn: 'Continue to sign in',
            useAnother: 'Create another account',
            verificationSent: 'Verification instructions were sent to',
            rules: {
              length: 'At least 8 characters',
              uppercase: 'One uppercase letter',
              lowercase: 'One lowercase letter',
              number: 'One number',
            },
            benefitOne: 'Track every application status',
            benefitTwo: 'Manage your resume and professional profile',
            benefitThree: 'Receive interview schedules and notifications',
            genericError: 'The account could not be created. Please try again.',
          },
    [isArabic],
  );

  const callbackPath = safeCallbackPath(searchParams.get('callbackUrl'));
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [createdEmail, setCreatedEmail] = useState('');

  const checks = passwordChecks(password);

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) nextErrors.name = copy.nameRequired;
    else if (normalizedName.length < 2) nextErrors.name = copy.nameShort;

    if (!normalizedEmail) nextErrors.email = copy.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = copy.emailInvalid;
    }

    if (!checks.every((check) => check.valid)) {
      nextErrors.password = copy.passwordInvalid;
    }

    if (!confirmPassword) nextErrors.confirmPassword = copy.confirmRequired;
    else if (password !== confirmPassword) {
      nextErrors.confirmPassword = copy.passwordMismatch;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'CANDIDATE',
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as RegistrationResponse;
      if (!response.ok) {
        throw new Error(payload.error || payload.message || copy.genericError);
      }

      const registeredEmail = payload.user?.email || email.trim().toLowerCase();
      setCreatedEmail(registeredEmail);
      toast.success(payload.message || copy.created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setCreatedEmail('');
  }

  return (
    <div className="flex min-h-screen bg-background" dir={dir}>
      <aside className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.25),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_40%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white xl:px-20">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Brain className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold">TalentFlow AI</span>
          </Link>
          <h1 className="max-w-xl text-4xl font-bold leading-tight xl:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/60">
            {copy.subtitle}
          </p>
          <div className="mt-10 space-y-3">
            {[copy.benefitOne, copy.benefitTwo, copy.benefitThree].map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/80">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </span>
            <span className="font-bold">TalentFlow AI</span>
          </Link>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Change language">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale('en')}>
                  <span className={locale === 'en' ? 'font-semibold' : ''}>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('ar')}>
                  <span className={locale === 'ar' ? 'font-semibold' : ''}>العربية</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <Card className="w-full max-w-lg border-border/60 shadow-xl shadow-black/5">
            {createdEmail ? (
              <>
                <CardHeader className="text-center">
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <CardTitle className="text-2xl">{copy.created}</CardTitle>
                  <CardDescription className="leading-6">{copy.createdBody}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-muted/35 p-4 text-center">
                    <p className="text-sm text-muted-foreground">{copy.verificationSent}</p>
                    <p className="mt-1 break-all font-medium">{createdEmail}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button className="w-full" onClick={() => router.push(loginHref)}>
                    {copy.continueSignIn}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={resetForm}>
                    {copy.useAnother}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="text-center">
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <UserRound className="h-7 w-7" />
                  </span>
                  <CardTitle className="text-2xl">{copy.title}</CardTitle>
                  <CardDescription>{copy.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{copy.candidateOnly}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {copy.managedAccounts}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={submit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="name">{copy.name}</Label>
                      <Input
                        id="name"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        maxLength={100}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{copy.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        maxLength={255}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{copy.password}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          aria-invalid={Boolean(errors.password)}
                          maxLength={128}
                          className="pe-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full w-10"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {checks.map((check) => (
                          <p
                            key={check.key}
                            className={`flex items-center gap-1.5 text-xs ${
                              check.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                            }`}
                          >
                            {check.valid ? <Check className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                            {copy.rules[check.key]}
                          </p>
                        ))}
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{copy.confirmPassword}</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          maxLength={128}
                          className="pe-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full w-10"
                          aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                          onClick={() => setShowConfirmPassword((value) => !value)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          {copy.creating}
                        </>
                      ) : (
                        <>
                          {copy.create}
                          <ArrowRight className="ms-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                  {copy.haveAccount}{' '}
                  <Link href={loginHref} className="ms-1 font-medium text-primary hover:underline">
                    {copy.signIn}
                  </Link>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
