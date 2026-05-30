// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  Users,
  Search,
  Ban,
  CheckCircle2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  Shield,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCsrf } from '@/hooks/use-csrf';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  emailVerified: string | null;
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  ADMIN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MODERATOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  COMPANY_ADMIN: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  HR_MANAGER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  RECRUITER: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  REVIEWER: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  CANDIDATE: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
};

const roles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_ADMIN', 'HR_MANAGER', 'RECRUITER', 'REVIEWER', 'CANDIDATE'];

export default function UsersPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { csrfToken } = useCsrf();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: UserItem } | null>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Will show empty table
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (type: string, user: UserItem) => {
    try {
      if (type === 'delete') {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({ id: user.id }),
        });
        if (res.ok) {
          toast({ title: 'Success', description: 'User deleted successfully' });
          fetchUsers();
        } else {
          toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({ id: user.id, action: type }),
        });
        if (res.ok) {
          toast({
            title: 'Success',
            description: `User ${type === 'suspend' ? 'suspended' : 'activated'} successfully`,
          });
          fetchUsers();
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleRoleUpdate = async () => {
    if (!editRoleUser || !newRole) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ id: editRoleUser.id, action: 'role', role: newRole }),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'User role updated successfully' });
        fetchUsers();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
    setEditRoleOpen(false);
    setEditRoleUser(null);
  };

  const openConfirm = (type: string, user: UserItem) => {
    setConfirmAction({ type, user });
    setConfirmOpen(true);
  };

  const openEditRole = (user: UserItem) => {
    setEditRoleUser(user);
    setNewRole(user.role);
    setEditRoleOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.admin.manageUsers}</h1>
          <p className="text-muted-foreground text-sm">{t.admin.searchUsers}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.admin.refreshData}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.admin.searchUsers}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.admin.filterByRole} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.allRoles}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>{role.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            {t.admin.manageUsers}
            <Badge variant="secondary" className="ml-2">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.admin.name}</TableHead>
                  <TableHead>{t.admin.email}</TableHead>
                  <TableHead>{t.admin.role}</TableHead>
                  <TableHead>{t.admin.status}</TableHead>
                  <TableHead>{t.admin.joined}</TableHead>
                  <TableHead className="text-right">{t.admin.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t.common.noResults}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-950 dark:text-emerald-300">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            {user.emailVerified && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-xs text-emerald-600">Verified</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] || 'bg-slate-100 text-slate-700'}>
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t.admin.active}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            {t.admin.suspended}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditRole(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t.admin.editRole}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isActive ? (
                              <DropdownMenuItem onClick={() => openConfirm('suspend', user)} className="text-red-600">
                                <Ban className="mr-2 h-4 w-4" />
                                {t.admin.suspend}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openConfirm('activate', user)} className="text-emerald-600">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t.admin.activate}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openConfirm('delete', user)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.admin.deleteUser}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              {t.admin.editRole}
            </DialogTitle>
            <DialogDescription>
              Change role for {editRoleUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder={t.admin.filterByRole} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>{role.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleRoleUpdate}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'delete' ? t.admin.confirmDelete :
               confirmAction?.type === 'suspend' ? t.admin.confirmSuspend :
               t.admin.confirmActivate}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'delete'
                ? `${t.admin.confirmDeleteMessage}`
                : confirmAction?.type === 'suspend'
                ? `Are you sure you want to suspend "${confirmAction?.user.name}"?`
                : `Are you sure you want to activate "${confirmAction?.user.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className={confirmAction?.type === 'delete' || confirmAction?.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              onClick={() => confirmAction && handleAction(confirmAction.type, confirmAction.user)}
            >
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
