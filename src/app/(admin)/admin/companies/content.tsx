// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  Building2,
  Search,
  ShieldCheck,
  ShieldX,
  Eye,
  Ban,
  CheckCircle2,
  MoreHorizontal,
  RefreshCw,
  Globe,
  MapPin,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { members: number; jobs: number };
}

export default function CompaniesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; company: Company } | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch {
      // Will show empty table
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleAction = async (type: string, company: Company) => {
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, action: type }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Company ${type === 'verify' ? 'verified' : type === 'unverify' ? 'unverified' : type === 'suspend' ? 'suspended' : 'activated'} successfully`,
        });
        fetchCompanies();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update company', variant: 'destructive' });
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const openConfirm = (type: string, company: Company) => {
    setConfirmAction({ type, company });
    setConfirmOpen(true);
  };

  const openDetail = (company: Company) => {
    setSelectedCompany(company);
    setDetailOpen(true);
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.location?.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.admin.manageCompanies}</h1>
          <p className="text-muted-foreground text-sm">{t.admin.searchCompanies}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCompanies} className="gap-2">
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
                placeholder={t.admin.searchCompanies}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.admin.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.allStatuses}</SelectItem>
                <SelectItem value="verified">{t.admin.verified}</SelectItem>
                <SelectItem value="unverified">{t.admin.unverified}</SelectItem>
                <SelectItem value="active">{t.admin.active}</SelectItem>
                <SelectItem value="suspended">{t.admin.suspended}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            {t.admin.manageCompanies}
            <Badge variant="secondary" className="ml-2">{filteredCompanies.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.admin.companyName}</TableHead>
                  <TableHead>{t.admin.industry}</TableHead>
                  <TableHead>{t.admin.location}</TableHead>
                  <TableHead>{t.admin.members}</TableHead>
                  <TableHead>{t.admin.verified}</TableHead>
                  <TableHead>{t.admin.status}</TableHead>
                  <TableHead className="text-right">{t.admin.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t.common.noResults}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-950 dark:text-emerald-300">
                              {company.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{company.name}</p>
                            {company.website && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{company.website}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{company.industry || '—'}</TableCell>
                      <TableCell className="text-sm">{company.location || '—'}</TableCell>
                      <TableCell className="text-sm">{company._count?.members || 0}</TableCell>
                      <TableCell>
                        {company.verified ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {t.admin.verified}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t.admin.unverified}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.isActive ? (
                          <Badge className="bg-teal-100 text-blue-700 hover:bg-teal-100 dark:bg-teal-950">
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(company)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t.admin.viewDetails}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {company.verified ? (
                              <DropdownMenuItem onClick={() => openConfirm('unverify', company)}>
                                <ShieldX className="mr-2 h-4 w-4" />
                                {t.admin.unverifyCompany}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openConfirm('verify', company)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {t.admin.verifyCompany}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {company.isActive ? (
                              <DropdownMenuItem onClick={() => openConfirm('suspend', company)} className="text-red-600">
                                <Ban className="mr-2 h-4 w-4" />
                                {t.admin.suspend}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openConfirm('activate', company)} className="text-emerald-600">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t.admin.activate}
                              </DropdownMenuItem>
                            )}
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

      {/* Company Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {t.admin.companyDetails}
            </DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg dark:bg-emerald-950 dark:text-emerald-300">
                    {selectedCompany.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCompany.verified ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3 mr-1" /> {t.admin.verified}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t.admin.unverified}</Badge>
                    )}
                    {selectedCompany.isActive ? (
                      <Badge className="bg-teal-100 text-blue-700 dark:bg-teal-950">
                        {t.admin.active}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{t.admin.suspended}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.industry}</p>
                  <p className="text-sm font-medium">{selectedCompany.industry || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.size}</p>
                  <p className="text-sm font-medium">{selectedCompany.companySize || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.location}</p>
                  <p className="text-sm font-medium">{selectedCompany.location || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.website}</p>
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:underline flex items-center gap-1">
                      {selectedCompany.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium">—</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.members}</p>
                  <p className="text-sm font-medium">{selectedCompany._count?.members || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.admin.totalJobs}</p>
                  <p className="text-sm font-medium">{selectedCompany._count?.jobs || 0}</p>
                </div>
              </div>
              {selectedCompany.description && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t.admin.description}</p>
                    <p className="text-sm">{selectedCompany.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'suspend' ? t.admin.confirmSuspend :
               confirmAction?.type === 'activate' ? t.admin.confirmActivate :
               confirmAction?.type === 'verify' ? t.admin.verifyCompany :
               t.admin.unverifyCompany}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.type} &quot;{confirmAction?.company.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              className={confirmAction?.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              onClick={() => confirmAction && handleAction(confirmAction.type, confirmAction.company)}
            >
              {t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
