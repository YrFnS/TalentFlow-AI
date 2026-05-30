'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  FileText,
  User,
  Sparkles,
  Settings,
  Bell,
  Sun,
  Moon,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Brain,
  Compass,
  Radar,
  Bookmark,
  Mic,
  Route,
  Mail,
  Users as UsersIcon,
  Award,
  GraduationCap,
  FolderOpen,
  Video,
  Building2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AIChatbot from '@/components/shared/ai-chatbot';

const candidateNavItems = [
  { titleKey: 'dashboard', href: '/candidate', icon: LayoutDashboard },
  { titleKey: 'explore', href: '/candidate/explore', icon: Compass },
  { titleKey: 'jobs', href: '/candidate/jobs', icon: Search },
  { titleKey: 'savedJobs', href: '/candidate/saved-jobs', icon: Bookmark },
  { titleKey: 'applications', href: '/candidate/applications', icon: FileText },
  { titleKey: 'skills', href: '/candidate/skills', icon: Radar },
  { titleKey: 'assessments', href: '/candidate/assessments', icon: Brain },
  { titleKey: 'takeAssessment', href: '/candidate/take-assessment', icon: Award },
  { titleKey: 'interviewPrep', href: '/candidate/interview-prep', icon: Mic },
  { titleKey: 'careerPath', href: '/candidate/career-path', icon: Route },
  { titleKey: 'messages', href: '/candidate/messages', icon: Mail },
  { titleKey: 'network', href: '/candidate/network', icon: UsersIcon },
  { titleKey: 'certifications', href: '/candidate/certifications', icon: Award },
  { titleKey: 'learning', href: '/candidate/learning', icon: GraduationCap },
  { titleKey: 'portfolio', href: '/candidate/portfolio', icon: FolderOpen },
  { titleKey: 'videoInterview', href: '/candidate/video-interview', icon: Video },
  { titleKey: 'internalJobs', href: '/candidate/internal-jobs', icon: Building2 },
  { titleKey: 'notifications', href: '/candidate/notifications', icon: Bell },
  { titleKey: 'profile', href: '/candidate/profile', icon: User },
  { titleKey: 'aiTools', href: '/candidate/ai-tools', icon: Sparkles },
  { titleKey: 'settings', href: '/candidate/settings', icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  '/candidate': 'Dashboard',
  '/candidate/explore': 'Explore',
  '/candidate/jobs': 'Jobs',
  '/candidate/saved-jobs': 'Saved Jobs',
  '/candidate/skills': 'Skills',
  '/candidate/assessments': 'Assessments',
  '/candidate/take-assessment': 'Take Assessment',
  '/candidate/interview-prep': 'Interview Prep',
  '/candidate/career-path': 'Career Path',
  '/candidate/messages': 'Messages',
  '/candidate/network': 'Network',
  '/candidate/certifications': 'Certifications',
  '/candidate/learning': 'Learning',
  '/candidate/portfolio': 'Portfolio',
  '/candidate/video-interview': 'Video Interview',
  '/candidate/internal-jobs': 'Internal Jobs',
  '/candidate/notifications': 'Notifications',
  '/candidate/applications': 'Applications',
  '/candidate/profile': 'Profile',
  '/candidate/ai-tools': 'AI Tools',
  '/candidate/settings': 'Settings',
};

const notifications = [
  { id: 1, title: 'Interview Scheduled', desc: 'Your interview for Senior Developer at TechCorp is tomorrow', time: '2h ago', read: false, icon: Briefcase, type: 'interview' as const },
  { id: 2, title: 'Application Update', desc: 'Your application for Product Manager moved to Screening', time: '1d ago', read: false, icon: FileText, type: 'application' as const },
  { id: 3, title: 'New Job Match', desc: '3 new jobs match your profile', time: '2d ago', read: true, icon: Search, type: 'ai' as const },
  { id: 4, title: 'New Message', desc: 'Recruiter from TechVision sent you a message', time: '5h ago', read: false, icon: Mail, type: 'message' as const },
];

function CandidateSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, logout } = useAuth();

  const navMap: Record<string, string> = {
    dashboard: t.nav.dashboard,
    explore: t.nav.explore,
    jobs: t.nav.jobs,
    savedJobs: t.nav.savedJobs,
    applications: t.nav.applications,
    skills: t.nav.skills,
    assessments: t.nav.assessments,
    takeAssessment: t.nav.takeAssessment,
    interviewPrep: t.nav.interviewPrep,
    careerPath: t.nav.careerPath,
    messages: t.nav.messages,
    network: t.nav.network,
    certifications: t.nav.certifications,
    learning: t.nav.learning,
    portfolio: t.nav.portfolio,
    videoInterview: t.nav.videoInterview,
    internalJobs: t.nav.internalJobs,
    notifications: t.common.notifications,
    profile: t.common.profile,
    aiTools: t.ai.aiPowered,
    settings: t.common.settings,
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/candidate" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">TalentFlow AI</span>
            <span className="text-[11px] text-muted-foreground">Candidate Portal</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t.candidate.myProfile}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="stagger-children">
              {candidateNavItems.map((item) => {
                const isActive =
                  item.href === '/candidate'
                    ? pathname === '/candidate'
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={navMap[item.titleKey]}
                      className={cn(
                        'transition-all duration-200 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400',
                        isActive && 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 sidebar-active-indicator nav-item-active'
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn('h-4 w-4', isActive && 'text-teal-600 dark:text-teal-400')} />
                        <span>{navMap[item.titleKey]}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 whitespace-nowrap min-w-0 group-data-[collapsible=icon]:hidden">
          <Sparkles className="h-3 w-3 text-teal-500 shrink-0" />
          <span className="truncate">Powered by TalentFlow AI</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton asChild tooltip={t.common.logout} className="text-muted-foreground hover:text-destructive transition-colors">
              <button onClick={logout}>
                <LogOut className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">{t.common.logout}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
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
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/candidate" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function TopBar() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mounted, setMounted] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="shrink-0" />
      <Separator orientation="vertical" className="h-6" />
      <Breadcrumb />

      {/* Search */}
      <div className="relative flex-1 max-w-md ms-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.common.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          title={t.common.language}
          aria-label={t.common.language}
        >
          <Globe className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={t.common.theme}
            aria-label={t.common.theme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-1 text-[10px] bg-teal-500 text-white border-0 notification-dot">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{t.common.notifications}</span>
                <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 notification-dot" />
                  {t.notifEnhanced?.live || 'Live'}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-teal-600 hover:text-teal-700">
                {t.common.markAllRead}
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {notifications.length > 0 ? notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 p-3 cursor-pointer">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    n.read ? 'bg-muted text-muted-foreground' : 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
                  )}>
                    <n.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 notification-dot" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60 gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium">{t.notifEnhanced?.noNotifications || 'No notifications yet'}</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user?.name || 'John Doe'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.name || 'John Doe'}</span>
                <span className="text-xs text-muted-foreground">{user?.email || 'john@example.com'}</span>
                <Badge className="w-fit text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 mt-1">
                  <Brain className="w-3 h-3 me-1" />
                  Candidate
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/candidate/profile" className="cursor-pointer">
                <User className="me-2 h-4 w-4" />
                {t.common.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/candidate/ai-tools" className="cursor-pointer">
                <Sparkles className="me-2 h-4 w-4" />
                {t.ai.aiPowered}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="me-2 h-4 w-4" />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { dir, locale } = useI18n();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  return (
    <div dir={dir} className={dir === 'rtl' ? 'font-sans' : ''}>
      <SidebarProvider defaultOpen>
        <CandidateSidebar />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
        <AIChatbot source="candidate" />
      </SidebarProvider>
    </div>
  );
}
