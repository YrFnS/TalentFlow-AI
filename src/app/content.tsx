// @ts-nocheck
'use client';

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
  Building2,
  User,
  Menu,
  X,
  Languages,
  Mail,
  Twitter,
  Linkedin,
  Github,
} from 'lucide-react';

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
function AnimateOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`}
      style={delay > 0 ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
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
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-slate-900">
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
  const { stats, loading: statsLoading } = usePlatformStats();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const features = [
    { icon: Brain, title: t.landing.feature1Title, desc: t.landing.feature1Desc, color: 'text-slate-600 bg-slate-100' },
    { icon: GitBranch, title: t.landing.feature2Title, desc: t.landing.feature2Desc, color: 'text-blue-600 bg-blue-50' },
    { icon: Video, title: t.landing.feature3Title, desc: t.landing.feature3Desc, color: 'text-slate-600 bg-slate-100' },
    { icon: Target, title: t.landing.feature4Title, desc: t.landing.feature4Desc, color: 'text-blue-600 bg-blue-50' },
    { icon: Globe, title: t.landing.feature5Title, desc: t.landing.feature5Desc, color: 'text-slate-600 bg-slate-100' },
    { icon: Settings2, title: t.landing.feature6Title, desc: t.landing.feature6Desc, color: 'text-blue-600 bg-blue-50' },
  ];

  const steps = [
    { num: '01', title: t.landing.step1, desc: t.landing.step1Desc, icon: User },
    { num: '02', title: t.landing.step2, desc: t.landing.step2Desc, icon: Building2 },
    { num: '03', title: t.landing.step3, desc: t.landing.step3Desc, icon: Brain },
    { num: '04', title: t.landing.step4, desc: t.landing.step4Desc, icon: ArrowRight },
  ];

  const pricing = [
    {
      name: t.landing.starter,
      price: t.landing.starterPrice,
      desc: t.landing.starterDesc,
      features: [
        t.landing.pricingStarterFeature1,
        t.landing.pricingStarterFeature2,
        t.landing.pricingStarterFeature3,
        t.landing.pricingStarterFeature4,
        t.landing.pricingStarterFeature5,
      ],
      popular: false,
    },
    {
      name: t.landing.growth,
      price: t.landing.growthPrice,
      desc: t.landing.growthDesc,
      features: [
        t.landing.pricingGrowthFeature1,
        t.landing.pricingGrowthFeature2,
        t.landing.pricingGrowthFeature3,
        t.landing.pricingGrowthFeature4,
        t.landing.pricingGrowthFeature5,
        t.landing.pricingGrowthFeature6,
        t.landing.pricingGrowthFeature7,
      ],
      popular: true,
    },
    {
      name: t.landing.enterprise,
      price: t.landing.enterprisePrice,
      desc: t.landing.enterpriseDesc,
      features: [
        t.landing.pricingEnterpriseFeature1,
        t.landing.pricingEnterpriseFeature2,
        t.landing.pricingEnterpriseFeature3,
        t.landing.pricingEnterpriseFeature4,
        t.landing.pricingEnterpriseFeature5,
        t.landing.pricingEnterpriseFeature6,
        t.landing.pricingEnterpriseFeature7,
        t.landing.pricingEnterpriseFeature8,
      ],
      popular: false,
    },
  ];

  const faqs = [
    { q: t.landing.faq1Q, a: t.landing.faq1A },
    { q: t.landing.faq2Q, a: t.landing.faq2A },
    { q: t.landing.faq3Q, a: t.landing.faq3A },
    { q: t.landing.faq4Q, a: t.landing.faq4A },
    { q: t.landing.faq5Q, a: t.landing.faq5A },
    { q: t.landing.faq6Q, a: t.landing.faq6A },
  ];

  const scrollToSection = (id: string) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                {t.common.appName}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                title={t.common.language}
              >
                <Languages className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                {t.auth.signIn}
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/auth/register')}>
                {t.landing.getStarted}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.features}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.howItWorks}</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-sm text-muted-foreground hover:text-foreground">{t.landing.pricing}</button>
              <button onClick={() => scrollToSection('faq')} className="block text-sm text-muted-foreground hover:text-foreground">FAQ</button>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
                  <Languages className="w-4 h-4 me-1" /> {locale === 'en' ? 'العربية' : 'English'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/auth/login')}>{t.auth.signIn}</Button>
                <Button className="flex-1 bg-blue-600 text-white" onClick={() => router.push('/auth/register')}>{t.landing.getStarted}</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-slate-100 text-slate-700 border-slate-200">
                {t.common.poweredBy}
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900">
                {t.landing.hero}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                {t.landing.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-12"
                  onClick={() => router.push('/auth/register')}
                >
                  {t.landing.getStarted}
                  <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-12"
                  onClick={() => router.push('/candidate/jobs')}
                >
                  {t.landing.viewJobs}
                </Button>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {statsLoading ? (
                <>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-slate-900">—</div>
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterCandidatesLabel}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-slate-900">—</div>
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterCompaniesLabel}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-slate-900">—</div>
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterJobsLabel}</p>
                  </div>
                </>
              ) : stats ? (
                <>
                  <div className="text-center">
                    <AnimatedCounter target={stats.candidates} suffix="+" />
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterCandidatesLabel}</p>
                  </div>
                  <div className="text-center">
                    <AnimatedCounter target={stats.companies} suffix="+" />
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterCompaniesLabel}</p>
                  </div>
                  <div className="text-center">
                    <AnimatedCounter target={stats.jobs} suffix="+" />
                    <p className="text-sm text-muted-foreground mt-1">{t.landing.counterJobsLabel}</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.features}
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <AnimateOnScroll key={index} delay={index * 0.1}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.howItWorks}
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <AnimateOnScroll key={index} delay={index * 0.1}>
                  <div className="text-center">
                    <div className="relative inline-flex mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-white border-2 border-blue-600 text-xs font-bold flex items-center justify-center text-blue-600">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.pricing}
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricing.map((plan, index) => (
                <AnimateOnScroll key={index} delay={index * 0.1}>
                  <Card className={`h-full relative ${plan.popular ? 'border-2 border-blue-600 shadow-xl' : 'border border-slate-200'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">
                          {t.landing.popular}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="text-center pb-4">
                        <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                      </div>
                      <ul className="space-y-3 pt-4 border-t">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => router.push('/auth/register')}
                      >
                        {t.landing.getStarted}
                      </Button>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-28 bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t.landing.faqTitle}
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
            </AnimateOnScroll>

            <AnimateOnScroll>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border border-slate-200 rounded-lg px-4">
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

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="relative overflow-hidden rounded-2xl bg-slate-900 p-12 md:p-16 text-center text-white">
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.landing.cta}</h2>
                <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">{t.landing.ctaSubtitle}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-slate-900 hover:bg-white/90 text-lg px-8 h-12"
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

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {t.common.appName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t.common.appDescription}</p>
              {/* Newsletter */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">{t.landing.newsletterTitle}</p>
                <p className="text-xs text-muted-foreground mb-3">{t.landing.newsletterSubtitle}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t.landing.newsletterPlaceholder}
                      className="h-10 text-sm ps-9 pe-3 rounded-lg border-slate-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim()) setEmailSubmitted(true);
                      }}
                    />
                  </div>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4"
                    onClick={() => { if (email.trim()) setEmailSubmitted(true); }}
                  >
                    {emailSubmitted ? <Check className="w-4 h-4" /> : t.landing.newsletterSubscribe}
                  </Button>
                </div>
                {emailSubmitted && (
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Subscribed successfully!
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.landing.features}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.landing.feature1Title}</li>
                <li>{t.landing.feature2Title}</li>
                <li>{t.landing.feature3Title}</li>
                <li>{t.landing.feature4Title}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.common.settings}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.footer.about}</li>
                <li>{t.footer.help}</li>
                <li>{t.footer.contact}</li>
                <li>{t.footer.privacy}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">{t.common.language}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t.footer.terms}</li>
                <li>{t.footer.rights}</li>
              </ul>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Twitter className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Linkedin className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Github className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {t.common.appName}. {t.footer.rights}.</p>
            <p>Powered by TalentFlow AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
