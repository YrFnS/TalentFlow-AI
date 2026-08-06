'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type TeamRole =
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'RECRUITER'
  | 'REVIEWER';

type TeamMember = {
  id: string;
  userId: string;
  companyId: string;
  role: TeamRole;
  title: string | null;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    isActive: boolean;
  };
};

type RoleConfig = {
  label: string;
  description: string;
  icon: LucideIcon;
  className: string;
};

const roleOrder: TeamRole[] = [
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'RECRUITER',
  'REVIEWER',
];

const roleConfig: Record<TeamRole, RoleConfig> = {
  COMPANY_ADMIN: {
    label: 'Company admin',
    description: 'Company settings, billing, team access, and recruiting controls.',
    icon: Shield,
    className: 'bg-primary/10 text-primary',
  },
  HR_MANAGER: {
    label: 'HR manager',
    description: 'Full recruiting operations without company administration.',
    icon: UserCog,
    className: 'bg-cyan-500/10 text-cyan-700',
  },
  RECRUITER: {
    label: 'Recruiter',
    description: 'Jobs, candidates, applications, interviews, and offers.',
    icon: UserPlus,
    className: 'bg-amber-500/10 text-amber-700',
  },
  REVIEWER: {
    label: 'Reviewer',
    description: 'Read-only hiring review and interview collaboration.',
    icon: ClipboardCheck,
    className: 'bg-violet-500/10 text-violet-700',
  },
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamContent() {
  const { user, validateSession } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('RECRUITER');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/team', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to load team members'),
        );
      }
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to load team members',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void validateSession();
    void load();
  }, [load, validateSession]);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;

    return members.filter((member) => {
      const config = roleConfig[member.role];
      return (
        member.user.name.toLowerCase().includes(term) ||
        member.user.email.toLowerCase().includes(term) ||
        member.title?.toLowerCase().includes(term) ||
        config.label.toLowerCase().includes(term)
      );
    });
  }, [members, query]);

  const roleCounts = useMemo(
    () =>
      Object.fromEntries(
        roleOrder.map((role) => [
          role,
          members.filter((member) => member.role === role).length,
        ]),
      ) as Record<TeamRole, number>,
    [members],
  );

  async function inviteMember() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: inviteName.trim() || undefined,
          title: inviteTitle.trim() || undefined,
          role: inviteRole,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to add team member'),
        );
      }

      const result = (await response.json()) as {
        member: TeamMember;
        setupRequired: boolean;
        emailSent: boolean;
        emailError?: string | null;
      };

      setMembers((current) => [...current, result.member]);
      setInviteName('');
      setInviteEmail('');
      setInviteTitle('');
      setInviteRole('RECRUITER');
      setInviteOpen(false);

      if (!result.emailSent) {
        toast.warning(
          result.emailError ||
            'The member was added, but the invitation email could not be sent.',
        );
      } else {
        toast.success(
          result.setupRequired
            ? 'Member added and password setup email sent'
            : 'Member added and notification email sent',
        );
      }
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to add team member',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(member: TeamMember, role: TeamRole) {
    if (role === member.role) return;

    setUpdatingId(member.id);
    try {
      const response = await apiFetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, role }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to update member role'),
        );
      }

      const updated = (await response.json()) as TeamMember;
      setMembers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success('Member role updated');
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to update member role',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeMember() {
    if (!removeTarget) return;

    setRemoving(true);
    try {
      const response = await apiFetch(
        `/api/team?memberId=${encodeURIComponent(removeTarget.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Unable to remove team member'),
        );
      }

      setMembers((current) =>
        current.filter((member) => member.id !== removeTarget.id),
      );
      setRemoveTarget(null);
      toast.success('Company access removed');
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : 'Unable to remove team member',
      );
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roleOrder.map((role) => (
            <Skeleton key={role} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control company access and recruiting permissions for {members.length}{' '}
            member{members.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            Refresh
          </Button>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="me-2 h-4 w-4" />
                Add member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a team member</DialogTitle>
                <DialogDescription>
                  New accounts receive a secure password-setup link. Existing staff
                  accounts receive a sign-in notification.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-title">Job title</Label>
                  <Input
                    id="invite-title"
                    value={inviteTitle}
                    onChange={(event) => setInviteTitle(event.target.value)}
                    placeholder="Talent acquisition lead"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="invite-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invite-email"
                      className="ps-9"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Role *</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => setInviteRole(value as TeamRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOrder.map((role) => {
                        const config = roleConfig[role];
                        const Icon = config.icon;
                        return (
                          <SelectItem key={role} value={role}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {roleConfig[inviteRole].description}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={() => void inviteMember()} disabled={submitting}>
                  {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  Add member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roleOrder.map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <Card key={role}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{config.label}s</p>
                  <p className="mt-2 text-3xl font-bold">{roleCounts[role]}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.className}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, title, or role"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No team members found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query ? 'Change the search terms.' : 'Add the first company member.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMembers.map((member) => {
            const config = roleConfig[member.role];
            const Icon = config.icon;
            const isCurrentUser = member.userId === user?.id;

            return (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>{initials(member.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="ms-2 text-xs font-normal text-muted-foreground">
                              You
                            </span>
                          )}
                        </CardTitle>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.title || member.user.email}
                        </p>
                      </div>
                    </div>
                    {!member.user.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a
                      className="truncate hover:text-foreground hover:underline"
                      href={`mailto:${member.user.email}`}
                    >
                      {member.user.email}
                    </a>
                    <span>·</span>
                    <span>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.className}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          void updateRole(member, value as TeamRole)
                        }
                        disabled={isCurrentUser || updatingId === member.id}
                      >
                        <SelectTrigger className="w-44">
                          {updatingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {roleOrder.map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleConfig[role].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        disabled={isCurrentUser}
                        onClick={() => setRemoveTarget(member)}
                        aria-label={`Remove ${member.user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isCurrentUser && (
                    <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      Your own administrator role and membership cannot be changed
                      from this page.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open && !removing) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove company access?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.user.name} will immediately lose access to this
              company workspace. Their user account and historical activity are
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                void removeMember();
              }}
            >
              {removing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
