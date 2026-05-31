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
  Mail,
  ArrowUp,
  Zap,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const AIChatbot = dynamic(() => import('@/components/shared/ai-chatbot'), { ssr: false });

/* ── Lightweight useInView hook ── */
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

/* ── AnimateOnScroll component ── */
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

/* ── AnimatedCounter ── */
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
    <div ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
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
    { icon: Brain, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: GitBranch, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: Video, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: Target, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
    { icon: Globe, title: t.landing.feature5Title, desc: t.landing.feature5Desc },
    { icon: Settings2, title: t.landing.feature6Title, desc: t.landing.feature6Desc },
  ];

  const steps = [
    { title: t.landing.step1, desc: t.landing.step1Desc, icon: User },
    { title: t.landing.step2, desc: t.landing.step2Desc, icon: Building2 },
    { title: t.landing.step3, desc: t.landing.step3Desc, icon: Brain },
    { title: t.landing.step4, desc: t.landing.step4Desc, icon: Sparkles },
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
    { value: t.landing.statsSatisfaction, desc: t.landing.statsSatisfactionDesc, icon: Zap },
    { value: t.landing.statsFaster, desc: t.landing.statsFasterDesc, icon: BarChart3 },
    { value: t.landing.statsScreenings, desc: t.landing.statsScreeningsDesc, icon: Brain },
    { value: t.landing.statsUptime, desc: t.landing.statsUptimeDesc, icon: Shield },
  ];

  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                {t.common.appName}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">{t.landing.faqLabel}</button>
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
              <Button variant="ghost" onClick={() => router.push('/auth/login')} className="text-slate-600 hover:text-slate-900">
                {t.auth.signIn}
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/auth/register')}>
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
            <div className="md:hidden border-t border-slate-200 py-4 space-y-3 animate-slide-down">
              <button onClick={() => scrollToSection('features')} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="block text-sm text-slate-600 hover:text-slate-900 font-medium">{t.landing.faqLabel}</button>
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
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/auth/register')}>{t.landing.getStarted}</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div>
                <Badge className="mb-4 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
                  <Sparkles className="w-3 h-3 me-1.5" />
                  {t.common.poweredBy}
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
                  {t.landing.hero}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
                  {t.landing.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base"
                    onClick={() => router.push('/auth/register')}
                  >
                    {t.landing.getStarted}
                    <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 h-12 text-base border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => scrollToSection('how-it-works')}
                  >
                    {t.landing.howItWorks}
                  </Button>
                </div>

                {/* Trusted by */}
                <div className="mt-10 pt-8 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-4">{t.landing.trustedBy}</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-400">
                    <span>Stripe</span>
                    <span>Vercel</span>
                    <span>Linear</span>
                    <span>Notion</span>
                    <span>Figma</span>
                    <span>Shopify</span>
                  </div>
                </div>
              </div>

              {/* Right: Kanban Pipeline Mockup */}
              <div className="animate-fade-in-up">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="ms-2 text-xs text-slate-500 font-medium">{t.landing.heroDashboardTitle}</span>
                  </div>

                  {/* Kanban board */}
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Column: Screening */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupScreening}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">12</span>
                        </div>
                        {[
                          { name: 'Alex M.', role: 'Frontend Dev', score: '92%' },
                          { name: 'Priya S.', role: 'Backend Dev', score: '88%' },
                          { name: 'James K.', role: 'Full Stack', score: '85%' },
                        ].map((c, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.role}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: c.score }} />
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">{c.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Column: Interview */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupInterview}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">5</span>
                        </div>
                        {[
                          { name: 'Maria L.', role: 'Product Mgr', stage: 'Technical' },
                          { name: 'David R.', role: 'Data Eng', stage: 'Behavioral' },
                        ].map((c, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.role}</p>
                            <span className="inline-block mt-1.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">{c.stage}</span>
                          </div>
                        ))}
                      </div>

                      {/* Column: Offers */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.landing.heroMockupOffers}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">3</span>
                        </div>
                        {[
                          { name: 'Sarah T.', role: 'Senior Dev', status: 'Accepted' },
                          { name: 'Tom W.', role: 'Designer', status: 'Pending' },
                        ].map((c, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.role}</p>
                            <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium ${c.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{c.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="mt-16 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                {statsLoading ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCandidatesLabel}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCompaniesLabel}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-300 animate-pulse">—</div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterJobsLabel}</p>
                    </div>
                  </>
                ) : stats ? (
                  <>
                    <div className="text-center">
                      <AnimatedCounter target={stats.candidates} suffix="+" />
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCandidatesLabel}</p>
                    </div>
                    <div className="text-center">
                      <AnimatedCounter target={stats.companies} suffix="+" />
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterCompaniesLabel}</p>
                    </div>
                    <div className="text-center">
                      <AnimatedCounter target={stats.jobs} suffix="+" />
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.landing.counterJobsLabel}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Section (Bento Layout) ─── */}
        <section id="features" className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="max-w-2xl mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.features}
              </h2>
              <p className="text-slate-600 text-lg">
                Everything you need to manage the full hiring lifecycle — from sourcing to offer.
              </p>
            </AnimateOnScroll>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Wide card: AI Screening (spans 2 cols) */}
              <AnimateOnScroll className="md:col-span-2" delay={0.1}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature1Title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{t.landing.feature1Desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Tall card: Pipeline */}
              <AnimateOnScroll className="md:row-span-2" delay={0.2}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                      <GitBranch className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature2Title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{t.landing.feature2Desc}</p>
                    {/* Mini pipeline visual */}
                    <div className="space-y-2">
                      {['Applied', 'Screening', 'Interview', 'Offer'].map((stage, i) => (
                        <div key={stage} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-xs text-slate-600 font-medium">{stage}</span>
                          {i < 3 && <div className="flex-1 h-px bg-slate-200" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Small card: Interview Intelligence */}
              <AnimateOnScroll delay={0.15}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                      <Video className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature3Title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{t.landing.feature3Desc}</p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Small card: Skill Gap */}
              <AnimateOnScroll delay={0.25}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                      <Target className="w-5 h-5 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature4Title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{t.landing.feature4Desc}</p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Small card: Multi-language */}
              <AnimateOnScroll delay={0.3}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
                      <Globe className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature5Title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{t.landing.feature5Desc}</p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              {/* Small card: Configurable AI */}
              <AnimateOnScroll delay={0.35}>
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">
                      <Settings2 className="w-5 h-5 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{t.landing.feature6Title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{t.landing.feature6Desc}</p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ─── Social Proof / Metrics ─── */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {statsData.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3">
                      <stat.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                    <p className="text-sm text-slate-500">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Comparison Section ─── */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="max-w-2xl mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.comparisonTitle}
              </h2>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                  {/* Traditional Hiring */}
                  <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-500 mb-6">{t.landing.comparisonTraditional}</h3>
                    <ul className="space-y-3">
                      {traditionalItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* TalentFlow AI */}
                  <div className="p-6 md:p-8 bg-blue-50/50">
                    <h3 className="text-lg font-semibold text-blue-700 mb-6">{t.landing.comparisonAI}</h3>
                    <ul className="space-y-3">
                      {aiItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="max-w-2xl mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.howItWorks}
              </h2>
              <p className="text-slate-600 text-lg">
                Get started in minutes, not weeks.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-300" />
                    )}
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center mb-5">
                      <step.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Integrations ─── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {t.landing.integrationsTitle}
              </h2>
              <p className="text-slate-500 text-sm">
                {t.landing.integrationsSubtitle}
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
                {['Slack', 'LinkedIn', 'Google Calendar', 'Zapier', 'Jira', 'Notion', 'Microsoft Teams', 'Gmail'].map((name) => (
                  <span key={name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    {name}
                  </span>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── Pricing Section ─── */}
        <section id="pricing" className="py-20 md:py-28 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.pricing}
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Transparent pricing. No hidden fees. Scale as you grow.
              </p>
            </AnimateOnScroll>

            {/* Monthly/Yearly Toggle */}
            <AnimateOnScroll className="flex items-center justify-center gap-3 mb-12" delay={0.2}>
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
                {t.landing.pricingMonthly}
              </span>
              <button
                onClick={() => { setIsYearly(!isYearly); setPricingLoading(true); setTimeout(() => setPricingLoading(false), 600); }}
                className="relative w-14 h-7 rounded-full bg-slate-200 border border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
                aria-label={isYearly ? t.landing.pricingMonthly : t.landing.pricingYearly}
                role="switch"
                aria-checked={isYearly}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-blue-600 shadow-sm transition-all duration-300 ${isYearly ? 'start-7' : 'start-0.5'}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-400'}`}>
                {t.landing.pricingYearly}
              </span>
              {isYearly && (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  {t.landing.pricingSave}
                </Badge>
              )}
            </AnimateOnScroll>

            <AnimateOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div key={index} className={pricingLoading ? 'skeleton-shimmer' : ''}>
                  <Card className={`h-full relative ${plan.popular ? 'border-2 border-blue-500 shadow-md' : 'border border-slate-200'} ${pricingLoading ? 'skeleton-shimmer' : ''}`}>
                    <CardContent className="p-6">
                      <div className="text-center pb-4">
                        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-slate-900">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                          <span className="text-sm text-slate-500">
                            {isYearly ? plan.yearlySuffix : plan.monthlySuffix}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                      </div>
                      <ul className="space-y-3 pt-4 border-t border-slate-200">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
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
              <Card className="border border-slate-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-start p-4 font-medium text-slate-500">{t.landing.pricingFeatureColumn}</th>
                          <th className="p-4 text-center font-medium text-slate-700">{t.landing.starter}</th>
                          <th className="p-4 text-center font-medium text-blue-600">{t.landing.growth}</th>
                          <th className="p-4 text-center font-medium text-slate-700">{t.landing.enterprise}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((feature, index) => (
                          <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-600">{feature.name}</td>
                            <td className="p-4 text-center">
                              {typeof feature.starter === 'boolean' ? (
                                feature.starter ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : <span className="text-slate-300">—</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-600">{feature.starter}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.growth === 'boolean' ? (
                                feature.growth ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : <span className="text-slate-300">—</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-600">{feature.growth}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.enterprise === 'boolean' ? (
                                feature.enterprise ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : <span className="text-slate-300">—</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-600">{feature.enterprise}</span>
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
        <section id="faq" className="py-20 md:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.faqTitle}
              </h2>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border border-slate-200 rounded-lg px-4 data-[state=open]:border-blue-200 data-[state=open]:bg-blue-50/30 transition-colors">
                    <AccordionTrigger className="text-left text-sm font-medium text-slate-900 hover:no-underline py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="py-20 md:py-28 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.landing.cta}</h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">{t.landing.ctaSubtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 h-12"
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
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {t.common.appName}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">{t.common.appDescription}</p>
              {/* Newsletter */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">{t.landing.newsletterTitle}</p>
                <p className="text-xs text-slate-500 mb-3">{t.landing.newsletterSubtitle}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t.landing.newsletterPlaceholder}
                      className="h-10 text-sm ps-9 pe-3 rounded-lg border-slate-300 focus:border-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim()) setEmailSubmitted(true);
                      }}
                    />
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
                    onClick={() => { if (email.trim()) setEmailSubmitted(true); }}
                  >
                    {emailSubmitted ? <Check className="w-4 h-4" /> : t.landing.newsletterSubscribe}
                  </Button>
                </div>
                {emailSubmitted && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Subscribed successfully!
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.landing.features}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>{t.landing.feature1Title}</li>
                <li>{t.landing.feature2Title}</li>
                <li>{t.landing.feature3Title}</li>
                <li>{t.landing.feature4Title}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.common.settings}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>{t.footer.about}</li>
                <li>{t.footer.help}</li>
                <li>{t.footer.contact}</li>
                <li>{t.footer.privacy}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.common.language}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>{t.footer.terms}</li>
                <li>{t.footer.rights}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {t.common.appName}. {t.footer.rights}.</p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Powered by TalentFlow AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-22 end-6 z-40 h-10 w-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center scroll-top-btn"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <AIChatbot />
    </div>
  );
}
