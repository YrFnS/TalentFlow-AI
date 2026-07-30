'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  ArrowRight,
  Brain,
  Eye,
  EyeOff,
  GitBranch,
  Globe,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/store/i18n-store';
import { useAuth, type AuthUser } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SessionPayload = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    image?: string | null;
    companyId?: string | null;
    companyName?: string | null;
    locale?: string | null;
  };
};

const roles = new Set<AuthUser['role']>([
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
  'REVIEWER',
  'CANDIDATE',
]);

function normalizeRole(value: unknown): AuthUser['role'] {
  const role = typeof value === 'string' ? (value as AuthUser['role']) : 'CANDIDATE';
  return roles.has(role) ? role : 'CANDIDATE';
}

function destinationForRole(role: AuthUser['role']): string {
  if (role === 'CANDIDATE') return '/candidate';
  if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(role)) return '/admin';
  return '/company';
}

export default function LoginPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const { setUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'linkedin' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const nextErrors: { email?: string; password?: string } = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = t.auth.invalidEmail;
    }

    if (!password) {
      nextErrors.password = t.auth.passwordRequired;
    } else if (password.length < 6) {
      nextErrors.password = t.auth.passwordMinLength;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function hydrateUser(): Promise<AuthUser> {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('Unable to load the signed-in account');

    const session = (await response.json()) as SessionPayload;
    if (!session.user?.id) throw new Error('The session did not include a user');

    return {
      id: session.user.id,
      email: session.user.email || email.trim(),
      name: session.user.name || session.user.email || 'Account',
      role: normalizeRole(session.user.role),
      image: session.user.image || undefined,
      companyId: session.user.companyId || undefined,
      companyName: session.user.companyName || undefined,
      locale: session.user.locale || locale || 'en',
    };
  }

  async function handleSocialLogin(provider: 'google' | 'linkedin') {
    setSocialLoading(provider);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch {
      toast.error(t.socialLogin.socialLoginError);
      setSocialLoading(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        toast.error(t.auth.invalidCredentials);
        return;
      }

      const user = await hydrateUser();
      setUser(user);
      toast.success(t.auth.signInSuccess);
      router.replace(destinationForRole(user.role));
      router.refresh();
    } catch (reason) {
      toast.error(
        reason instanceof Error && reason.message
          ? reason.message
          : t.auth.signInError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div dir={dir} className="flex min-h-screen bg-background">
      <aside className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.22),transparent_40%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white xl:px-20">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Brain className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold">TalentFlow AI</span>
          </Link>

          <h1 className="max-w-xl text-4xl font-bold leading-tight xl:text-5xl">
            {t.auth.hireSmarter}
            <span className="block text-white/65">{t.auth.withAI}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/60">
            {t.auth.landingDesc}
          </p>

          <div className="mt-10 space-y-3">
            {[
              {
                icon: Brain,
                title: t.auth.featureAIScreening,
                description: t.auth.featureAIScreeningDesc,
              },
              {
                icon: GitBranch,
                title: t.auth.featureSmartPipeline,
                description: t.auth.featureSmartPipelineDesc,
              },
              {
                icon: Users,
                title: t.auth.featureAIMatching,
                description: t.auth.featureAIMatchingDesc,
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{description}</p>
                </div>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Change language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('en')}>
                <span className={locale === 'en' ? 'font-semibold' : ''}>
                  English
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('ar')}>
                <span className={locale === 'ar' ? 'font-semibold' : ''}>
                  العربية
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5">
            <CardHeader className="text-center">
              <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Brain className="h-7 w-7" />
              </span>
              <CardTitle className="text-2xl">{t.auth.signIn}</CardTitle>
              <CardDescription>{t.auth.signInSubtitle}</CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={socialLoading !== null || isLoading}
                    onClick={() => void handleSocialLogin('google')}
                  >
                    {socialLoading === 'google' && (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    )}
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={socialLoading !== null || isLoading}
                    onClick={() => void handleSocialLogin('linkedin')}
                  >
                    {socialLoading === 'linkedin' && (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    )}
                    LinkedIn
                  </Button>
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errors.email) {
                        setErrors((current) => ({ ...current, email: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">{t.auth.password}</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (errors.password) {
                          setErrors((current) => ({
                            ...current,
                            password: undefined,
                          }));
                        }
                      }}
                      className="pe-10"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full w-10"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="me-2 h-4 w-4" />
                  )}
                  {t.auth.signIn}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t.auth.noAccount}{' '}
                  <Link
                    href="/auth/register"
                    className="font-medium text-primary hover:underline"
                  >
                    {t.auth.createAccount}
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
