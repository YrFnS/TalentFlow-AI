// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain,
  GitBranch,
  Video,
  Target,
  Globe,
  Settings2,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Building2,
  User,
  Menu,
  Sun,
  Moon,
  Languages,
  Quote,
  Mail,
  Twitter,
  Linkedin,
  Github,
  ArrowUp,
  Star,
  BarChart3,
  Briefcase,
  Users,
  Clock,
  Zap,
  MessageSquare,
  Calendar,
  Puzzle,
  Activity,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const AIChatbot = dynamic(() => import('@/components/shared/ai-chatbot'), { ssr: false });

/* ── Lightweight useInView hook (replaces framer-motion's useInView) ── */
function useInView(ref: React.RefObject<HTMLElement | null>, options?: { once?: boolean }) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (options?.once) obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options?.once]);
  return isInView;
}

/* ── AnimateOnScroll component (replaces whileInView motion divs) ── */
function AnimateOnScroll({ children, className = '', delay = 0, animation = 'animate-fade-in-up' }: { children: React.ReactNode; className?: string; delay?: number; animation?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? animation : 'opacity-0'}`}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (hasStarted) return;
    const mountTimer = setTimeout(() => setHasStarted(true), isInView ? 0 : 600);
    return () => clearTimeout(mountTimer);
  }, [isInView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

/* ── Stats from API ── */
interface PlatformStats {
  candidates: number;
  companies: number;
  jobs: number;
}

function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Stats will remain null
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading };
}

export default function LandingPage() {
  const { t, locale, setLocale, dir } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { stats, loading: statsLoading } = usePlatformStats();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Brain, title: t.landing.feature1Title, desc: t.landing.feature1Desc, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50' },
    { icon: GitBranch, title: t.landing.feature2Title, desc: t.landing.feature2Desc, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { icon: Video, title: t.landing.feature3Title, desc: t.landing.feature3Desc, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
    { icon: Target, title: t.landing.feature4Title, desc: t.landing.feature4Desc, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
    { icon: Globe, title: t.landing.feature5Title, desc: t.landing.feature5Desc, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
    { icon: Settings2, title: t.landing.feature6Title, desc: t.landing.feature6Desc, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50' },
  ];

  const steps = [
    { num: '01', title: t.landing.step1, desc: t.landing.step1Desc, icon: User },
    { num: '02', title: t.landing.step2, desc: t.landing.step2Desc, icon: Building2 },
    { num: '03', title: t.landing.step3, desc: t.landing.step3Desc, icon: Brain },
    { num: '04', title: t.landing.step4, desc: t.landing.step4Desc, icon: Sparkles },
  ];

  // Pricing with toggle support
  const pricingPlans = [
    {
      name: t.landing.starter,
      monthlyPrice: t.landing.pricingStarterMonthly,
      yearlyPrice: t.landing.pricingStarterMonthly,
      monthlySuffix: '',
      yearlySuffix: '',
      desc: t.landing.starterDesc,
      features: [t.landing.pricingStarterFeature1, t.landing.pricingStarterFeature2, t.landing.pricingStarterFeature3, t.landing.pricingStarterFeature4, t.landing.pricingStarterFeature5],
      popular: false,
      featureAccess: [true, true, false, false, '1', false, false],
    },
    {
      name: t.landing.growth,
      monthlyPrice: t.landing.pricingGrowthMonthly,
      yearlyPrice: t.landing.pricingGrowthYearly,
      monthlySuffix: t.landing.pricingPerMonth,
      yearlySuffix: t.landing.pricingPerYear,
      desc: t.landing.growthDesc,
      features: [t.landing.pricingGrowthFeature1, t.landing.pricingGrowthFeature2, t.landing.pricingGrowthFeature3, t.landing.pricingGrowthFeature4, t.landing.pricingGrowthFeature5, t.landing.pricingGrowthFeature6, t.landing.pricingGrowthFeature7],
      popular: true,
      featureAccess: [true, true, true, true, '10', false, false],
    },
    {
      name: t.landing.enterprise,
      monthlyPrice: t.landing.pricingEnterpriseMonthly,
      yearlyPrice: t.landing.pricingEnterpriseMonthly,
      monthlySuffix: '',
      yearlySuffix: '',
      desc: t.landing.enterpriseDesc,
      features: [t.landing.pricingEnterpriseFeature1, t.landing.pricingEnterpriseFeature2, t.landing.pricingEnterpriseFeature3, t.landing.pricingEnterpriseFeature4, t.landing.pricingEnterpriseFeature5, t.landing.pricingEnterpriseFeature6, t.landing.pricingEnterpriseFeature7, t.landing.pricingEnterpriseFeature8],
      popular: false,
      featureAccess: [true, true, true, true, t.landing.enterprise, true, true],
    },
  ];

  // Pricing comparison table features
  const comparisonFeatures = [
    { name: t.landing.pricingFeatureAiScreening, starter: true, growth: true, enterprise: true },
    { name: t.landing.pricingFeaturePipeline, starter: t.landing.pricingFeatureBasic, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureInterviews, starter: false, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureAnalytics, starter: false, growth: true, enterprise: true },
    { name: t.landing.pricingFeatureTeamMembers, starter: '1', growth: '10', enterprise: t.landing.enterprise },
    { name: t.landing.pricingFeatureApi, starter: false, growth: false, enterprise: true },
    { name: t.landing.pricingFeatureSso, starter: false, growth: false, enterprise: true },
  ];



  const faqs = [
    { q: t.landing.faq1Q, a: t.landing.faq1A },
    { q: t.landing.faq2Q, a: t.landing.faq2A },
    { q: t.landing.faq3Q, a: t.landing.faq3A },
    { q: t.landing.faq4Q, a: t.landing.faq4A },
    { q: t.landing.faq5Q, a: t.landing.faq5A },
    { q: t.landing.faq6Q, a: t.landing.faq6A },
  ];

  // Comparison items
  const traditionalItems = [
    t.landing.traditional1,
    t.landing.traditional2,
    t.landing.traditional3,
    t.landing.traditional4,
    t.landing.traditional5,
  ];

  const aiItems = [
    t.landing.ai1,
    t.landing.ai2,
    t.landing.ai3,
    t.landing.ai4,
    t.landing.ai5,
  ];

  const statsData = [
    { value: t.landing.statsSatisfaction, desc: t.landing.statsSatisfactionDesc, icon: Star, color: 'from-teal-500 to-emerald-500', progress: 98 },
    { value: t.landing.statsFaster, desc: t.landing.statsFasterDesc, icon: Zap, color: 'from-emerald-500 to-cyan-500', progress: 75 },
    { value: t.landing.statsScreenings, desc: t.landing.statsScreeningsDesc, icon: Activity, color: 'from-cyan-500 to-teal-500', progress: 85 },
    { value: t.landing.statsUptime, desc: t.landing.statsUptimeDesc, icon: Clock, color: 'from-teal-600 to-emerald-400', progress: 100 },
  ];

  const integrations = [
    { name: 'Slack', icon: MessageSquare, color: 'bg-[#4A154B]' },
    { name: 'Gmail', icon: Mail, color: 'bg-red-600' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]' },
    { name: 'Google Calendar', icon: Calendar, color: 'bg-blue-600' },
    { name: 'Zapier', icon: Zap, color: 'bg-orange-500' },
    { name: 'Jira', icon: Puzzle, color: 'bg-blue-700' },
    { name: 'Notion', icon: Building2, color: 'bg-neutral-900 dark:bg-neutral-100' },
    { name: 'Microsoft Teams', icon: Users, color: 'bg-[#6264A7]' },
  ];



  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {t.common.appName}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.faqLabel}</button>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                title={t.common.language}
                aria-label={t.common.language}
              >
                <Languages className="w-4 h-4" />
              </Button>
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  title={t.common.theme}
                  aria-label={t.common.theme}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                {t.auth.signIn}
              </Button>
              <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white" onClick={() => router.push('/auth/register')}>
                {t.landing.getStarted}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? t.landing.ariaCloseMenu : t.landing.ariaOpenMenu}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-3 animate-slide-down">
              <button onClick={() => scrollToSection('features')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.faqLabel}</button>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
                  <Languages className="w-4 h-4 me-1" /> {locale === 'en' ? 'العربية' : 'English'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/auth/login')}>{t.auth.signIn}</Button>
                <Button className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white" onClick={() => router.push('/auth/register')}>{t.landing.getStarted}</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-background animate-gradient-shift" />
          {/* Grid line pattern */}
          <div className="absolute inset-0 grid-pattern opacity-60 dark:opacity-30" />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 dot-grid opacity-50 dark:opacity-20" />
          {/* Particle dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  top: `${10 + (i * 4.3) % 80}%`,
                  left: `${5 + (i * 7.1) % 90}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${6 + (i % 4)}s`,
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 opacity-30 dark:opacity-10">
            <div className="absolute top-20 start-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 end-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* 3D-like floating shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[15%] end-[10%] w-20 h-20 rounded-xl bg-teal-500/10 dark:bg-teal-500/5 rotate-12 animate-float" />
            <div className="absolute top-[40%] end-[20%] w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-[25%] start-[8%] w-16 h-16 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/5 -rotate-12 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[25%] start-[15%] w-10 h-10 rounded-full bg-teal-400/15 dark:bg-teal-400/5 animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Morphing blobs for dreamy effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="animate-blob absolute top-[10%] start-[5%] w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-teal-400/8 to-emerald-400/5 dark:from-teal-500/5 dark:to-emerald-500/3 blur-3xl" style={{ animationDelay: '0s' }} />
            <div className="animate-blob absolute top-[30%] end-[10%] w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-emerald-400/7 to-cyan-400/5 dark:from-emerald-500/4 dark:to-cyan-500/3 blur-3xl" style={{ animationDelay: '2s' }} />
            <div className="animate-blob absolute bottom-[10%] start-[20%] w-56 sm:w-96 h-56 sm:h-96 bg-gradient-to-br from-cyan-400/6 to-teal-400/4 dark:from-cyan-500/3 dark:to-teal-500/2 blur-3xl" style={{ animationDelay: '4s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="animate-fade-in-up">
                <Badge className="mb-4 sm:mb-6 bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800 animate-scale-in">
                  <Sparkles className="w-3 h-3 me-1" />
                  {t.common.poweredBy}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 animate-fade-in-up heading-glow" style={{ animationDelay: '0.1s' }}>
                <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  {t.landing.hero}
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {t.landing.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <Button
                  size="lg"
                  className="glow-teal bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-lg px-8 h-12 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-shadow"
                  onClick={() => router.push('/auth/register')}
                >
                  {t.landing.getStarted}
                  <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="glow-teal text-lg px-8 h-12 border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  onClick={() => router.push('/candidate/jobs')}
                >
                  {t.landing.viewJobs}
                </Button>
              </div>
            </div>

            {/* Platform Stats - fetched from API */}
            <div className="mt-10 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              {statsLoading ? (
                <>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">—</div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterCandidatesLabel}</p>
                  </div>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.75s' }}>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">—</div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterCompaniesLabel}</p>
                  </div>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.9s' }}>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">—</div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterJobsLabel}</p>
                  </div>
                </>
              ) : stats ? (
                <>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                    <AnimatedCounter target={stats.candidates} suffix="+" />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterCandidatesLabel}</p>
                  </div>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.75s' }}>
                    <AnimatedCounter target={stats.companies} suffix="+" />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterCompaniesLabel}</p>
                  </div>
                  <div className="text-center animate-bounce-in" style={{ animationDelay: '0.9s' }}>
                    <AnimatedCounter target={stats.jobs} suffix="+" />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.landing.counterJobsLabel}</p>
                  </div>
                </>
              ) : null}
            </div>

            {/* ─── Hero Dashboard Preview Mockup ─── */}
            <div className="mt-10 sm:mt-16 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="glass-card glass-mockup rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ms-3 text-xs text-muted-foreground font-medium">{t.landing.heroDashboardTitle}</span>
                </div>
                {/* Mini stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-2">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-300">24</p>
                    <p className="text-xs text-muted-foreground">{t.landing.heroDashboardStat1}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/40 dark:to-cyan-950/40 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-2">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">1.2K</p>
                    <p className="text-xs text-muted-foreground">{t.landing.heroDashboardStat2}</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/40 dark:to-teal-950/40 rounded-xl p-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-2">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">8</p>
                    <p className="text-xs text-muted-foreground">{t.landing.heroDashboardStat3}</p>
                  </div>
                </div>
                {/* Mini chart mockup */}
                <div className="bg-muted/30 dark:bg-muted/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{t.landing.heroMockupPipeline}</span>
                    <Badge className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-0">{t.landing.heroMockupLive}</Badge>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-teal-500 to-emerald-400 opacity-70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  {/* Activity indicators */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-[10px] text-muted-foreground">{t.landing.heroMockupScreening}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <span className="text-[10px] text-muted-foreground">{t.landing.heroMockupInterview}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '1s' }} />
                      <span className="text-[10px] text-muted-foreground">{t.landing.heroMockupOffers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Section ─── */}
        <section id="features" className="py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.features}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="animate-scale-in-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card className="h-full card-hover-lift transition-all duration-300 border-t-4 border-t-teal-500/30 hover:border-t-teal-500">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Comparison/Benefits Section ─── */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.comparisonTitle}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            <AnimateOnScroll className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* Traditional Hiring */}
                <div>
                  <h3 className="text-xl font-bold mb-6 text-center text-orange-600 dark:text-orange-400 animate-fade-in-up">
                    {t.landing.comparisonTraditional}
                  </h3>
                  <div className="space-y-3">
                    {traditionalItems.map((item, index) => (
                      <div
                        key={index}
                        className="animate-scale-in-card"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30 hover:shadow-md transition-all duration-300">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                              <X className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-sm text-red-800 dark:text-red-300 font-medium">{item}</span>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VS Badge (center, desktop only) */}
                <div className="hidden md:flex absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="vs-badge w-14 h-14 rounded-full flex items-center justify-center text-sm font-black">
                    VS
                  </div>
                </div>

                {/* TalentFlow AI */}
                <div>
                  <h3 className="text-xl font-bold mb-6 text-center text-teal-600 dark:text-teal-400 animate-fade-in-up">
                    {t.landing.comparisonAI}
                  </h3>
                  <div className="space-y-3">
                    {aiItems.map((item, index) => (
                      <div
                        key={index}
                        className="animate-scale-in-card"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <Card className="bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-900/30 hover:shadow-md transition-all duration-300">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-teal-500" />
                            </div>
                            <span className="text-sm text-teal-800 dark:text-teal-300 font-medium">{item}</span>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* VS Badge mobile (between columns) */}
              <div className="flex md:hidden justify-center -my-2">
                <div className="vs-badge w-12 h-12 rounded-full flex items-center justify-center text-xs font-black">
                  VS
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── How It Works Section ─── */}
        <section id="how-it-works" className="py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.howItWorks}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-background border-2 border-teal-500 text-xs font-bold flex items-center justify-center text-teal-600">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Stats/Social Proof Section ─── */}
        <section className="py-20 md:py-28 bg-background relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 opacity-5 dark:opacity-3">
            <div className="absolute top-0 start-0 w-96 h-96 bg-teal-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 end-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.statsTitle}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            <AnimateOnScroll className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => (
                <div
                  key={index}
                  className="animate-scale-in-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="stat-card-shine hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                        {stat.value}
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.desc}</p>
                      {/* Progress bar indicator */}
                      <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${stat.progress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Pricing Section ─── */}
        <section id="pricing" className="py-20 md:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.pricing}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            {/* Monthly/Yearly Toggle */}
            <AnimateOnScroll className="flex items-center justify-center gap-3 mb-12" delay={0.2}>
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'pricing-toggle-active px-3 py-1.5 rounded-lg' : 'pricing-toggle-inactive'}`}>
                {t.landing.pricingMonthly}
              </span>
              <button
                onClick={() => { setIsYearly(!isYearly); setPricingLoading(true); setTimeout(() => setPricingLoading(false), 600); }}
                className="relative w-14 h-7 rounded-full bg-muted border border-border transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
                aria-label={isYearly ? t.landing.pricingMonthly : t.landing.pricingYearly}
                role="switch"
                aria-checked={isYearly}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shadow-md transition-all duration-300 ${isYearly ? 'start-7' : 'start-0.5'}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'pricing-toggle-active px-3 py-1.5 rounded-lg' : 'pricing-toggle-inactive'}`}>
                {t.landing.pricingYearly}
              </span>
              {isYearly && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 animate-scale-in text-xs">
                  {t.landing.pricingSave}
                </Badge>
              )}
            </AnimateOnScroll>

            <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div key={index} className="animate-scale-in-card hover:scale-[1.03] transition-transform" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card className={`h-full relative overflow-hidden ${plan.popular ? 'border-2 border-teal-500 shadow-xl animate-pulse-glow' : 'border'} ${pricingLoading ? 'skeleton-shimmer' : ''}`}>
                    {plan.popular && (
                      <div className="pricing-ribbon">
                        {t.landing.popular}
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="text-center pb-4">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        <div className="mt-4">
                          <span className="text-4xl font-bold">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                          <span className="text-sm text-muted-foreground">
                            {isYearly ? plan.yearlySuffix : plan.monthlySuffix}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                      </div>
                      <ul className="space-y-3 pt-4 border-t">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-6 ${plan.popular ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => router.push('/auth/register')}
                      >
                        {t.landing.getStarted}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </AnimateOnScroll>

            {/* Pricing Comparison Table */}
            <AnimateOnScroll className="mt-12 max-w-3xl mx-auto" delay={0.3}>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-start p-4 font-medium text-muted-foreground">{t.landing.pricingFeatureColumn}</th>
                          <th className="p-4 text-center font-medium">{t.landing.starter}</th>
                          <th className="p-4 text-center font-medium text-teal-600">{t.landing.growth}</th>
                          <th className="p-4 text-center font-medium">{t.landing.enterprise}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((feature, index) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-4 text-muted-foreground">{feature.name}</td>
                            <td className="p-4 text-center">
                              {typeof feature.starter === 'boolean' ? (
                                feature.starter ? <Check className="w-4 h-4 text-teal-600 mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                              ) : (
                                <span className="text-xs font-medium">{feature.starter}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.growth === 'boolean' ? (
                                feature.growth ? <Check className="w-4 h-4 text-teal-600 mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                              ) : (
                                <span className="text-xs font-medium">{feature.growth}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.enterprise === 'boolean' ? (
                                feature.enterprise ? <Check className="w-4 h-4 text-teal-600 mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                              ) : (
                                <span className="text-xs font-medium">{feature.enterprise}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── FAQ Section ─── */}
        <section id="faq" className="py-20 md:py-28 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.faqTitle}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
            </AnimateOnScroll>

            <AnimateOnScroll>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4 data-[state=open]:border-teal-300 dark:data-[state=open]:border-teal-700 data-[state=open]:bg-teal-50/50 dark:data-[state=open]:bg-teal-950/20 transition-colors">
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Integration/Partners Section ─── */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
                {t.landing.integrationsTitle}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {t.landing.integrationsSubtitle}
              </p>
              <div className="w-20 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 mx-auto rounded-full animate-fade-in-up" style={{ animationDelay: '0.2s' }} />
            </AnimateOnScroll>

            {/* Marquee container */}
            <AnimateOnScroll className="relative overflow-hidden" delay={0.2}>
              {/* Fade edges */}
              <div className="absolute start-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-e from-muted/30 to-transparent z-10 pointer-events-none" />
              <div className="absolute end-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-s from-muted/30 to-transparent z-10 pointer-events-none" />

              {/* Scrolling row */}
              <div className="animate-marquee flex gap-6 w-max [animation-duration:45s] sm:[animation-duration:30s]">
                {[...integrations, ...integrations].map((integration, index) => (
                  <div
                    key={`${integration.name}-${index}`}
                    className="flex-shrink-0 group"
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-40">
                      <CardContent className="p-5 flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <integration.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-center">{integration.name}</span>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-8 sm:p-12 md:p-16 text-center text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 start-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 end-0 w-80 h-80 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landing.cta}</h2>
                <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">{t.landing.ctaSubtitle}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-teal-700 hover:bg-white/90 text-lg px-8 h-12"
                    onClick={() => router.push('/auth/register')}
                  >
                    {t.landing.getStarted}
                    <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-12"
                    onClick={() => router.push('/candidate/jobs')}
                  >
                    {t.landing.viewJobs}
                  </Button>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {t.common.appName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t.common.appDescription}</p>
              {/* Newsletter */}
              <div>
                <p className="text-sm font-semibold mb-2">{t.landing.newsletterTitle}</p>
                <p className="text-xs text-muted-foreground mb-3">{t.landing.newsletterSubtitle}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t.landing.newsletterPlaceholder}
                      className="h-10 text-sm ps-9 pe-3 rounded-lg border-teal-200 dark:border-teal-800 focus:border-teal-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim()) setEmailSubmitted(true);
                      }}
                    />
                  </div>
                  <Button
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 h-10 px-4"
                    onClick={() => { if (email.trim()) setEmailSubmitted(true); }}
                  >
                    {emailSubmitted ? <Check className="w-4 h-4" /> : t.landing.newsletterSubscribe}
                  </Button>
                </div>
                {emailSubmitted && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Subscribed successfully!
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t.landing.features}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.landing.feature1Title}</li>
                <li>{t.landing.feature2Title}</li>
                <li>{t.landing.feature3Title}</li>
                <li>{t.landing.feature4Title}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t.common.settings}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.footer.about}</li>
                <li>{t.footer.help}</li>
                <li>{t.footer.contact}</li>
                <li>{t.footer.privacy}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t.common.language}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.footer.terms}</li>
                <li>{t.footer.rights}</li>
              </ul>
              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-teal-600 transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-teal-600 transition-colors" aria-label="LinkedIn"><Linkedin className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-teal-600 transition-colors" aria-label="GitHub"><Github className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {t.common.appName}. {t.footer.rights}.</p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>Powered by TalentFlow AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-22 end-6 z-40 h-10 w-10 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 hover:shadow-teal-500/40 transition-all flex items-center justify-center scroll-top-btn"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <AIChatbot />
    </div>
  );
}
