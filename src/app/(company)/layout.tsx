"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
	BarChart3,
	Bell,
	Briefcase,
	Building2,
	Calendar,
	ChevronDown,
	FileCheck,
	FileText,
	GitBranch,
	Globe,
	LayoutDashboard,
	Loader2,
	LogOut,
	Menu,
	Moon,
	Settings,
	Sparkles,
	Sun,
	UserSearch,
	Users,
	Video,
	Workflow,
} from "lucide-react";
import { apiFetch, getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/store/auth-store";
import { useI18n } from "@/store/i18n-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import AIChatbot from "@/components/shared/ai-chatbot";

type Notification = {
	id: string;
	title: string;
	message: string;
	type: string;
	link: string | null;
	isRead: boolean;
	createdAt: string;
};

type NavItem = {
	href: string;
	label: string;
	icon: typeof LayoutDashboard;
	roles?: string[];
};

type NavGroup = { label: string; items: NavItem[] };

const editorRoles = [
	"SUPER_ADMIN",
	"ADMIN",
	"COMPANY_ADMIN",
	"HR_MANAGER",
	"RECRUITER",
];
const adminRoles = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN"];
const groups: NavGroup[] = [
	{
		label: "Recruiting",
		items: [
			{ href: "/company", label: "Dashboard", icon: LayoutDashboard },
			{ href: "/company/jobs", label: "Jobs", icon: Briefcase },
			{ href: "/company/pipeline", label: "Pipeline", icon: GitBranch },
			{ href: "/company/candidates", label: "Candidates", icon: UserSearch },
			{ href: "/company/applications", label: "Applications", icon: FileText },
			{ href: "/company/interviews", label: "Interviews", icon: Video },
			{ href: "/company/offers", label: "Offers", icon: FileCheck },
		],
	},
	{
		label: "Talent",
		items: [
			{ href: "/company/directory", label: "Directory", icon: Users },
			{ href: "/company/onboarding", label: "Onboarding", icon: Workflow },
			{ href: "/company/calendar", label: "Calendar", icon: Calendar },
		],
	},
	{
		label: "Insights & automation",
		items: [
			{ href: "/company/analytics", label: "Analytics", icon: BarChart3 },
			{ href: "/company/reports", label: "Reports", icon: FileText },
			{
				href: "/company/workflows",
				label: "Workflows",
				icon: Workflow,
				roles: editorRoles,
			},
			{
				href: "/company/ai-settings",
				label: "AI settings",
				icon: Sparkles,
				roles: editorRoles,
			},
		],
	},
	{
		label: "Administration",
		items: [
			{ href: "/company/team", label: "Team", icon: Users, roles: adminRoles },
			{
				href: "/company/billing",
				label: "Billing",
				icon: Building2,
				roles: adminRoles,
			},
			{
				href: "/company/integrations",
				label: "Integrations",
				icon: Globe,
				roles: adminRoles,
			},
			{
				href: "/company/settings",
				label: "Company settings",
				icon: Settings,
				roles: adminRoles,
			},
		],
	},
];

function initials(name?: string) {
	if (!name) return "U";
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const { user } = useAuth();
	const visibleGroups = useMemo(
		() =>
			groups
				.map((group) => ({
					...group,
					items: group.items.filter(
						(item) => !item.roles || item.roles.includes(user?.role || ""),
					),
				}))
				.filter((group) => group.items.length > 0),
		[user?.role],
	);

	return (
		<div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
			<Link
				href="/company"
				onClick={onNavigate}
				className="flex h-16 items-center gap-3 border-b px-4"
			>
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<Sparkles className="h-5 w-5" />
				</div>
				<div>
					<p className="text-sm font-bold">TalentFlow AI</p>
					<p className="text-xs text-muted-foreground">Recruiting workspace</p>
				</div>
			</Link>
			<div className="border-b p-3">
				<div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-3">
					<Building2 className="h-4 w-4 text-primary" />
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">
							{user?.companyName || "Company workspace"}
						</p>
						<p className="text-xs text-muted-foreground">
							{user?.role?.replaceAll("_", " ") || "Loading account"}
						</p>
					</div>
				</div>
			</div>
			<ScrollArea className="flex-1">
				<nav className="space-y-5 p-3">
					{visibleGroups.map((group) => (
						<div key={group.label}>
							<p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								{group.label}
							</p>
							<div className="space-y-1">
								{group.items.map((item) => {
									const active =
										item.href === "/company"
											? pathname === item.href
											: pathname.startsWith(item.href);
									const Icon = item.icon;
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={onNavigate}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
												active
													? "bg-sidebar-primary text-sidebar-primary-foreground"
													: "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
											)}
										>
											<Icon className="h-4 w-4" />
											{item.label}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</nav>
			</ScrollArea>
			<div className="border-t p-4 text-xs text-muted-foreground">
				Focused on secure, real hiring workflows.
			</div>
		</div>
	);
}

export default function CompanyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, isLoading, logout, validateSession } = useAuth();
	const { locale, setLocale, dir } = useI18n();
	const { theme, setTheme } = useTheme();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [notificationsLoading, setNotificationsLoading] = useState(false);

	useEffect(() => {
		void validateSession();
	}, [validateSession]);

	useEffect(() => {
		document.documentElement.dir = dir;
		document.documentElement.lang = locale;
	}, [dir, locale]);

	async function loadNotifications() {
		setNotificationsLoading(true);
		try {
			const response = await fetch("/api/notifications", { cache: "no-store" });
			if (response.ok) setNotifications(await response.json());
		} finally {
			setNotificationsLoading(false);
		}
	}

	useEffect(() => {
		if (user?.id) void loadNotifications();
	}, [user?.id]);

	async function markAllRead() {
		const response = await apiFetch("/api/notifications", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ markAll: true }),
		});
		if (response.ok)
			setNotifications((items) =>
				items.map((item) => ({ ...item, isRead: true })),
			);
	}

	async function openNotification(notification: Notification) {
		if (!notification.isRead) {
			const response = await apiFetch("/api/notifications", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: notification.id }),
			});
			if (!response.ok) console.error(await getApiErrorMessage(response));
			else
				setNotifications((items) =>
					items.map((item) =>
						item.id === notification.id ? { ...item, isRead: true } : item,
					),
				);
		}
		if (notification.link) window.location.assign(notification.link);
	}

	const unread = notifications.filter((item) => !item.isRead).length;

	return (
		<div className="min-h-screen bg-background" dir={dir}>
			<aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e lg:block">
				<Navigation />
			</aside>
			<div className="lg:ps-64">
				<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-6">
					<div className="flex items-center gap-3">
						<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="lg:hidden">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side={dir === "rtl" ? "right" : "left"}
								className="w-72 p-0"
							>
								<SheetTitle className="sr-only">Navigation</SheetTitle>
								<Navigation onNavigate={() => setMobileOpen(false)} />
							</SheetContent>
						</Sheet>
						<div className="lg:hidden">
							<p className="text-sm font-bold">TalentFlow AI</p>
							<p className="text-xs text-muted-foreground">
								{user?.companyName || "Company"}
							</p>
						</div>
						<div className="hidden lg:block">
							<p className="text-sm font-medium">
								{user?.companyName || "Company workspace"}
							</p>
							<p className="text-xs text-muted-foreground">
								Secure hiring operations
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setLocale(locale === "en" ? "ar" : "en")}
							aria-label="Change language"
						>
							<Globe className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							aria-label="Toggle theme"
						>
							{theme === "dark" ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
						</Button>
						<DropdownMenu
							onOpenChange={(open) => open && void loadNotifications()}
						>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="relative"
									aria-label="Notifications"
								>
									<Bell className="h-4 w-4" />
									{unread > 0 && (
										<Badge className="absolute -end-1 -top-1 h-4 min-w-4 p-0 text-[9px]">
											{unread}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-80">
								<DropdownMenuLabel className="flex items-center justify-between">
									<span>Notifications</span>
									{unread > 0 && (
										<Button
											variant="ghost"
											size="sm"
											className="h-auto p-0 text-xs"
											onClick={() => void markAllRead()}
										>
											Mark all read
										</Button>
									)}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{notificationsLoading ? (
									<div className="flex justify-center p-8">
										<Loader2 className="h-5 w-5 animate-spin" />
									</div>
								) : notifications.length === 0 ? (
									<p className="p-8 text-center text-sm text-muted-foreground">
										No notifications yet.
									</p>
								) : (
									notifications.slice(0, 8).map((notification) => (
										<DropdownMenuItem
											key={notification.id}
											className="cursor-pointer items-start gap-3 p-3"
											onClick={() => void openNotification(notification)}
										>
											<span
												className={cn(
													"mt-1.5 h-2 w-2 rounded-full",
													notification.isRead ? "bg-muted" : "bg-primary",
												)}
											/>
											<div>
												<p className="text-sm font-medium">
													{notification.title}
												</p>
												<p className="mt-0.5 text-xs text-muted-foreground">
													{notification.message}
												</p>
												<p className="mt-1 text-[10px] text-muted-foreground">
													{new Date(notification.createdAt).toLocaleString()}
												</p>
											</div>
										</DropdownMenuItem>
									))
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="ms-1 gap-2 px-2">
									<Avatar className="h-8 w-8">
										<AvatarImage src={user?.image} />
										<AvatarFallback>
											{isLoading ? "…" : initials(user?.name)}
										</AvatarFallback>
									</Avatar>
									<span className="hidden max-w-32 truncate text-sm md:inline">
										{isLoading ? "Loading…" : user?.name || "Account"}
									</span>
									<ChevronDown className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<p>{user?.name || "Account"}</p>
									<p className="truncate text-xs font-normal text-muted-foreground">
										{user?.email || ""}
									</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/company/settings">
										<Settings className="me-2 h-4 w-4" />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive" onClick={logout}>
									<LogOut className="me-2 h-4 w-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>
				<main className="p-4 lg:p-6">{children}</main>
			</div>
			<AIChatbot source="company" />
		</div>
	);
}
