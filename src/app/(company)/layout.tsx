// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  UserSearch,
  FileText,
  Video,
  Users,
  Brain,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Menu,
  LogOut,
  User,
  Building2,
  Sparkles,
  Home,
  BarChart3,
  FileBarChart,
  Copy,
  GitMerge,
  UserPlus,
  Calendar,
  Award,
  DollarSign,
  Target,
  MessageSquare,
  Gift,
  ClipboardCheck,
  FileCheck,
  Mail,
  CalendarDays,
  Shield,
  ShieldCheck,
  MailCheck,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AIChatbot from '@/components/shared/ai-chatbot';

const navItems = [
  { href: '/company', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { href: '/company/jobs', icon: Briefcase, labelKey: 'jobs' as const },
  { href: '/company/pipeline', icon: GitBranch, labelKey: 'pipeline' as const },
  { href: '/company/candidates', icon: UserSearch, labelKey: 'candidates' as const },
  { href: '/company/applications', icon: FileText, labelKey: 'applications' as const },
  { href: '/company/interviews', icon: Video, labelKey: 'interviews' as const },
  { href: '/company/analytics', icon: BarChart3, labelKey: 'analytics' as const },
  { href: '/company/reports', icon: FileBarChart, labelKey: 'reports' as const },
  { href: '/company/templates', icon: Copy, labelKey: 'templates' as const },
  { href: '/company/workflows', icon: GitMerge, labelKey: 'workflows' as const },
  { href: '/company/directory', icon: Users, labelKey: 'directory' as const },
  { href: '/company/onboarding', icon: UserPlus, labelKey: 'onboarding' as const },
  { href: '/company/internal-jobs', icon: Building2, labelKey: 'internalJobs' as const },
  { href: '/company/leave', icon: Calendar, labelKey: 'leave' as const },
  { href: '/company/performance', icon: Award, labelKey: 'performance' as const },
  { href: '/company/salary', icon: DollarSign, labelKey: 'salary' as const },
  { href: '/company/goals', icon: Target, labelKey: 'goals' as const },
  { href: '/company/referrals', icon: Gift, labelKey: 'referrals' as const },
  { href: '/company/reviews', icon: ClipboardCheck, labelKey: 'reviews' as const },
  { href: '/company/calendar', icon: CalendarDays, labelKey: 'calendar' as const },
  { href: '/company/offers', icon: FileCheck, labelKey: 'offers' as const },
  { href: '/company/scorecards', icon: ClipboardCheck, labelKey: 'scorecards' as const },
  { href: '/company/email-templates', icon: Mail, labelKey: 'emailTemplates' as const },
  { href: '/company/email-logs', icon: MailCheck, labelKey: 'emailLogs' as const },
  { href: '/company/job-templates', icon: Copy, labelKey: 'jobTemplates' as const },
  { href: '/company/bulk-email', icon: MessageSquare, labelKey: 'bulkEmail' as const },
  { href: '/company/talent-pool', icon: Users, labelKey: 'talentPool' as const },
  { href: '/company/candidates/compare', icon: GitMerge, labelKey: 'comparison' as const },
  { href: '/company/sourcing', icon: Search, labelKey: 'sourcing' as const },
  { href: '/company/comments', icon: MessageSquare, labelKey: 'comments' as const },
  { href: '/company/sources', icon: BarChart3, labelKey: 'sources' as const },
  { href: '/company/skill-assessments', icon: Brain, labelKey: 'skillAssessments' as const },
  { href: '/company/risk-analysis', icon: Shield, labelKey: 'riskAnalysis' as const },
  { href: '/company/fair-hiring', icon: ShieldCheck, labelKey: 'fairHiring' as const },
  { href: '/company/job-boards', icon: Globe, labelKey: 'jobBoards' as const },
  { href: '/company/career-page', icon: Globe, labelKey: 'careerPage' as const },
  { href: '/company/eeo-reports', icon: ClipboardCheck, labelKey: 'eeoReports' as const },
  { href: '/company/video-interviews', icon: Video, labelKey: 'videoInterviews' as const },
  { href: '/company/reference-checks', icon: ShieldCheck, labelKey: 'referenceChecks' as const },
  { href: '/company/predictive-analytics', icon: Brain, labelKey: 'predictiveAnalytics' as const },
  { href: '/company/billing', icon: DollarSign, labelKey: 'billing' as const },
  { href: '/company/team', icon: Users, labelKey: 'team' as const },
  { href: '/company/ai-settings', icon: Brain, labelKey: 'aiSettings' as const },
  { href: '/company/job-workflows', icon: GitBranch, labelKey: 'jobWorkflows' as const },
  { href: '/company/integrations', icon: Plug, labelKey: 'integrations' as const },
  { href: '/company/settings', icon: Settings, labelKey: 'settings' as const },
];

const breadcrumbMap: Record<string, string> = {
  '/company': 'Dashboard',
  '/company/jobs': 'Jobs',
  '/company/pipeline': 'Pipeline',
  '/company/candidates': 'Candidates',
  '/company/applications': 'Applications',
  '/company/interviews': 'Interviews',
  '/company/analytics': 'Analytics',
  '/company/reports': 'Reports',
  '/company/templates': 'Templates',
  '/company/workflows': 'Workflows',
  '/company/directory': 'Directory',
  '/company/onboarding': 'Onboarding',
  '/company/internal-jobs': 'Internal Jobs',
  '/company/leave': 'Leave',
  '/company/performance': 'Performance',
  '/company/salary': 'Salary',
  '/company/goals': 'Goals',
  '/company/referrals': 'Referrals',
  '/company/reviews': 'Reviews',
  '/company/calendar': 'Calendar',
  '/company/offers': 'Offers',
  '/company/scorecards': 'Scorecards',
  '/company/email-templates': 'Email Templates',
  '/company/email-logs': 'Email Logs',
  '/company/job-templates': 'Job Templates',
  '/company/bulk-email': 'Bulk Email',
  '/company/talent-pool': 'Talent Pool',
  '/company/candidates/compare': 'Compare',
  '/company/sourcing': 'Sourcing',
  '/company/comments': 'Comments',
  '/company/sources': 'Sources',
  '/company/skill-assessments': 'Skill Assessments',
  '/company/risk-analysis': 'Risk Analysis',
  '/company/fair-hiring': 'Fair Hiring',
  '/company/job-boards': 'Job Boards',
  '/company/career-page': 'Career Page',
  '/company/eeo-reports': 'EEO Reports',
  '/company/video-interviews': 'Video Interviews',
  '/company/reference-checks': 'Reference Checks',
  '/company/predictive-analytics': 'Predictive Analytics',
  '/company/billing': 'Billing',
  '/company/team': 'Team',
  '/company/ai-settings': 'AI Settings',
  '/company/job-workflows': 'Job Workflows',
  '/company/integrations': 'Integrations',
  '/company/settings': 'Settings',
};

const notifications = [
  { id: 1, title: 'New application received', desc: 'Alex Johnson applied for Senior Frontend Engineer', time: '5m ago', read: false, icon: FileText, type: 'application' as const },
  { id: 2, title: 'Interview scheduled', desc: 'Maria Garcia - Product Designer interview tomorrow', time: '1h ago', read: false, icon: Video, type: 'interview' as const },
  { id: 3, title: 'Offer accepted', desc: 'David Kim accepted the DevOps Engineer offer', time: '3h ago', read: true, icon: Briefcase, type: 'application' as const },
  { id: 4, title: 'AI screening complete', desc: '5 candidates screened for Backend Developer', time: '2h ago', read: false, icon: Brain, type: 'ai' as const },
  { id: 5, title: 'New message', desc: 'Sarah from HR sent you a message', time: '6h ago', read: true, icon: MessageSquare, type: 'message' as const },
];

function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/company') return pathname === '/company';
    return pathname.startsWith(href);
  };

  return (
    <div className={cn('flex flex-col h-full', collapsed && 'w-16')}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-slate-200', collapsed && 'justify-center px-2')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900">TalentFlow AI</span>
            <span className="text-[10px] text-slate-500 leading-tight">HR & ATS Platform</span>
          </div>
        )}
      </div>

      {/* Company Badge */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium truncate text-slate-700">{user?.companyName || 'TechVision Inc.'}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-blue-600')} />
                      {!collapsed && <span>{t.nav[item.labelKey]}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {t.nav[item.labelKey]}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer branding */}
      {!collapsed && (
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap min-w-0 px-2">
            <Sparkles className="h-3 w-3 text-blue-600 shrink-0" />
            <span className="truncate">Powered by TalentFlow AI</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = breadcrumbMap[href] || seg.charAt(0).toUpperCase() + seg.slice(1);
    return { href, label };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/company" className="hover:text-slate-900 transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-slate-900">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-900 transition-colors">{crumb.label}</Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, dir } = useI18n();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = locale;
    }
  }, [dir, locale]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={dir}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-slate-200 bg-white sticky top-0 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-64 p-0 bg-white">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">TalentFlow AI</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -end-0.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-blue-600 text-white">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col h-screen sticky top-0 border-e border-slate-200 bg-white">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-slate-200 bg-white sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <Breadcrumb />
              <div className="relative flex-1 max-w-xs ms-4">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t.common.search}
                  className="ps-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Change language">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocale('en')}>
                    <span className="me-2">🇺🇸</span> English
                    {locale === 'en' && <span className="ms-auto text-blue-600">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale('ar')}>
                    <span className="me-2">🇸🇦</span> العربية
                    {locale === 'ar' && <span className="ms-auto text-blue-600">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Switcher */}
              {isMounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-0.5 -end-0.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-blue-600 text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-medium">{t.common.notifications}</span>
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {t.notifEnhanced?.live || 'Live'}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600">
                      {t.common.markAllRead}
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex items-start gap-3 p-3 cursor-pointer">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          n.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
                        )}>
                          <n.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900">{n.title}</span>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                          <p className="text-[10px] text-blue-600 mt-0.5">{n.time}</p>
                        </div>
                      </DropdownMenuItem>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Bell className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">{t.notifEnhanced?.noNotifications || 'No notifications yet'}</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.image} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                        {user?.name?.split(' ').map(n => n[0]).join('') || 'SC'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden xl:inline-block text-slate-700">{user?.name || 'Sarah Chen'}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">{user?.name || 'Sarah Chen'}</span>
                      <span className="text-xs text-slate-500">{user?.email || 'sarah@techvision.com'}</span>
                      <Badge className="w-fit text-[10px] bg-blue-50 text-blue-700 border-0 mt-1">
                        <Building2 className="w-3 h-3 me-1" />
                        HR Manager
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/company/settings" className="cursor-pointer">
                      <User className="me-2 h-4 w-4" />
                      {t.common.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/company/settings" className="cursor-pointer">
                      <Settings className="me-2 h-4 w-4" />
                      {t.common.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="me-2 h-4 w-4" />
                    {t.common.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <AIChatbot source="company" />
    </div>
  );
}
