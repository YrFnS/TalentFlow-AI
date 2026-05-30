// @ts-nocheck
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  Mail,
  Shield,
  UserCog,
  UserPlus,
  ClipboardCheck,
  Trash2,
  MoreHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface TeamMember {
  id: string;
  userId: string;
  companyId: string;
  role: string;
  title: string | null;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

const roleConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  COMPANY_ADMIN: {
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-200 dark:border-teal-800/30',
    icon: Shield,
  },
  HR_MANAGER: {
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800/30',
    icon: UserCog,
  },
  RECRUITER: {
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800/30',
    icon: UserPlus,
  },
  REVIEWER: {
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
    icon: ClipboardCheck,
  },
};

const roles = ['COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER', 'REVIEWER'];

export default function TeamPage() {
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('RECRUITER');
  const [inviteName, setInviteName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      m.user.name.toLowerCase().includes(query) ||
      m.user.email.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteName || undefined,
          companyId: 'demo-company',
        }),
      });
      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => [...prev, newMember]);
        setInviteEmail('');
        setInviteRole('RECRUITER');
        setInviteName('');
        setInviteOpen(false);
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await fetch(`/api/team?memberId=${memberToRemove.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        setRemoveDialogOpen(false);
        setMemberToRemove(null);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      COMPANY_ADMIN: t.company.companyAdmin,
      HR_MANAGER: t.company.hrManager,
      RECRUITER: t.company.recruiter,
      REVIEWER: t.company.reviewer,
    };
    return labels[role] || role;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const roleStats = roles.map((role) => ({
    role,
    count: members.filter((m) => m.role === role).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.company.teamManagement}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {members.length} {t.company.members.toLowerCase()}
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 me-2" />
              {t.company.inviteMember}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t.company.inviteMember}</DialogTitle>
              <DialogDescription>
                {t.company.selectRole}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.company.email}</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="ps-9"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.auth.name}</label>
                <Input
                  placeholder="Full Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.company.role}</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => {
                      const config = roleConfig[role];
                      const Icon = config.icon;
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('w-4 h-4', config.color)} />
                            {getRoleLabel(role)}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleInvite}
                disabled={!inviteEmail || submitting}
              >
                {submitting ? t.common.loading : t.company.inviteMember}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roleStats.map((stat) => {
          const config = roleConfig[stat.role];
          const Icon = config.icon;
          return (
            <Card key={stat.role} className={cn('border', config.borderColor)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(stat.role)}</p>
                    <p className="text-xl font-bold">{stat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.company.searchMembers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
      </div>

      {/* Team Members */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t.company.noMembers}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? t.common.noResults : t.company.inviteMember}
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredMembers.map((member) => {
              const config = roleConfig[member.role] || roleConfig.REVIEWER;
              const Icon = config.icon;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className={cn('text-xs', config.bgColor, config.color)}>
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.user.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0 font-medium',
                          config.color,
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <Icon className="w-3 h-3 me-1" />
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{member.user.email}</span>
                      {member.title && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground truncate">{member.title}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Join Date (hidden on mobile) */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{t.company.joinDate}</span>
                    <span className="text-xs font-medium">{formatDate(member.joinedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Edit Role Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <UserCog className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.company.updateRole}</span>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {roles.map((role) => {
                          const roleCfg = roleConfig[role];
                          const RIcon = roleCfg.icon;
                          return (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleUpdateRole(member.id, role)}
                              disabled={member.role === role}
                              className={cn(member.role === role && 'bg-accent/50')}
                            >
                              <RIcon className={cn('w-4 h-4 me-2', roleCfg.color)} />
                              {getRoleLabel(role)}
                              {member.role === role && (
                                <span className="ms-auto text-teal-600 text-xs">✓</span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setMemberToRemove(member);
                        setRemoveDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.company.confirmRemove}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.company.confirmRemoveMessage}
              {memberToRemove && (
                <span className="block mt-2 font-medium text-foreground">
                  {memberToRemove.user.name} ({memberToRemove.user.email})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.company.removeMember}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
