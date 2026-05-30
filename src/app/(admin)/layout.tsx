// @ts-nocheck
'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/store/i18n-store';
import { useAuth } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Brain,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Menu,
  LogOut,
  User,
  ChevronDown,
  X,
  Sparkles,
  ChevronRight,
  Home,
  Shield,
  HeartPulse,
  DollarSign,
  Megaphone,
  LifeBuoy,
  MessageSquare,
  Shield as ShieldIcon,
  Download,
  Map,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { href: '/admin/companies', icon: Building2, labelKey: 'companies' as const },
  { href: '/admin/users', icon: Users, labelKey: 'users' as const },
  { href: '/admin/audit-logs', icon: ScrollText, labelKey: 'auditLogs' as const },
  { href: '/admin/health', icon: HeartPulse, labelKey: 'platformHealth' as const },
  { href: '/admin/ai-usage', icon: DollarSign, labelKey: 'aiUsage' as const },
  { href: '/admin/announcements', icon: Megaphone, labelKey: 'announcements' as const },
  { href: '/admin/support', icon: LifeBuoy, labelKey: 'support' as const },
  { href: '/admin/feedback', icon: MessageSquare, labelKey: 'feedback' as const },
  { href: '/admin/security', icon: Shield, labelKey: 'security' as const },
  { href: '/admin/compliance', icon: ShieldIcon, labelKey: 'compliance' as const },
  { href: '/admin/exports', icon: Download, labelKey: 'exports' as const },
  { href: '/admin/eeo', icon: ShieldIcon, labelKey: 'eeo' as const },
  { href: '/admin/gdpr', icon: ShieldIcon, labelKey: 'gdpr' as const },
  { href: '/admin/billing', icon: DollarSign, labelKey: 'billing' as const },
  { href: '/admin/roadmap', icon: Map, labelKey: 'roadmap' as const },
  { href: '/admin/features', icon: Flag, labelKey: 'features' as const },
  { href: '/admin/ai-settings', icon: Brain, labelKey: 'aiSettings' as const },
  { href: '/admin/settings', icon: Settings, labelKey: 'settings' as const },
];

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/companies': 'Companies',
  '/admin/users': 'Users',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/health': 'Platform Health',
  '/admin/ai-usage': 'AI Usage',
  '/admin/announcements': 'Announcements',
  '/admin/support': 'Support',
  '/admin/feedback': 'Feedback',
  '/admin/security': 'Security',
  '/admin/compliance': 'Compliance',
  '/admin/exports': 'Exports',
  '/admin/eeo': 'EEO/DEI',
  '/admin/gdpr': 'GDPR',
  '/admin/billing': 'Billing',
  '/admin/roadmap': 'Roadmap',
  '/admin/features': 'Features',
  '/admin/ai-settings': 'AI Settings',
  '/admin/settings': 'Settings',
};

const notifications = [
  { id: 1, title: 'New company registration', desc: 'TechCorp Inc. registered 2h ago', time: '2h ago', read: false, icon: Building2, type: 'application' as const },
  { id: 2, title: 'User reported content', desc: 'Flagged review needs moderation', time: '4h ago', read: false, icon: Shield, type: 'system' as const },
  { id: 3, title: 'System backup complete', desc: 'Database backup finished successfully', time: '1d ago', read: true, icon: ScrollText, type: 'system' as const },
  { id: 4, title: 'Interview scheduled', desc: 'Alex Johnson interview at 3pm', time: '1h ago', read: false, icon: Users, type: 'interview' as const },
  { id: 5, title: 'AI analysis complete', desc: 'Resume screening for Frontend Dev', time: '5h ago', read: true, icon: Brain, type: 'ai' as const },
];

function AdminSidebarContent() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      <SidebarHeader className="px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold">TalentFlow AI</span>
            <span className="text-xs text-muted-foreground">{t.admin.title}</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.admin.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="stagger-children">
              {adminNavItems.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t.nav[item.labelKey]}
                      className={cn(
                        'transition-all duration-200 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400',
                        isActive && 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 sidebar-active-indicator nav-item-active'
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn('h-4 w-4', isActive && 'text-teal-600 dark:text-teal-400')} />
                        <span>{t.nav[item.labelKey]}</span>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap min-w-0 group-data-[collapsible=icon]:hidden">
          <Sparkles className="h-3 w-3 text-teal-500 shrink-0" />
          <span className="truncate">Powered by TalentFlow AI</span>
        </div>
      </SidebarFooter>
    </>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useI18n();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = breadcrumbMap[href] || seg.charAt(0).toUpperCase() + seg.slice(1);
    return { href, label };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/admin" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function TopBar() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb />

      <div className="flex-1 flex items-center gap-4">
        <div className="hidden md:flex relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t.common.search}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Change language">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocale('en')}>
              <span className={cn(locale === 'en' && 'font-bold')}>English</span>
              {locale === 'en' && <span className="ms-auto text-teal-600">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale('ar')}>
              <span className={cn(locale === 'ar' && 'font-bold')}>العربية</span>
              {locale === 'ar' && <span className="ms-auto text-teal-600">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-teal-500 text-[10px] font-bold text-white flex items-center justify-center notification-dot">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {t.common.notifications}
                <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 notification-dot" />
                  {t.notifEnhanced?.live || 'Live'}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-teal-600">
                {t.common.markAllRead}
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {notifications.length > 0 ? notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 p-3 cursor-pointer">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    n.read ? 'bg-muted text-muted-foreground' : 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
                  )}>
                    <n.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0 notification-dot" />}
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
                <AvatarImage src={user?.image} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'AD'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm">{user?.name || 'Admin User'}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                </div>
                <p className="text-xs text-muted-foreground">{user?.email || 'admin@talentflow.ai'}</p>
                <Badge className="w-fit text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 mt-1">
                  <Shield className="w-3 h-3 me-1" />
                  Super Admin
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <User className="me-2 h-4 w-4" />
                {t.common.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
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
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { dir } = useI18n();

  return (
    <div dir={dir} className={cn(dir === 'rtl' ? 'font-sans' : '')}>
      <SidebarProvider>
        <Sidebar
          side={dir === 'rtl' ? 'right' : 'left'}
          collapsible="icon"
          className="border-sidebar-border"
        >
          <AdminSidebarContent />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <TopBar />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
