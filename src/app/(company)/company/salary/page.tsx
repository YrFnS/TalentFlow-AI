'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Filter,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentSalary {
  name: string;
  avgSalary: number;
  color: string;
}

interface RoleSalary {
  id: string;
  role: string;
  department: string;
  min: number;
  max: number;
  avg: number;
  marketDelta: number;
}

const defaultDeptColors = [
  'from-teal-500 to-emerald-500',
  'from-emerald-500 to-green-500',
  'from-cyan-500 to-teal-500',
  'from-green-500 to-emerald-500',
  'from-teal-600 to-cyan-500',
  'from-emerald-600 to-teal-500',
];

export default function SalaryPage() {
  const { t } = useI18n();
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departmentSalaries, setDepartmentSalaries] = useState<DepartmentSalary[]>([]);
  const [roleSalaries, setRoleSalaries] = useState<RoleSalary[]>([]);
  const [salaryStats, setSalaryStats] = useState({ avgSalary: null as number | null, medianSalary: null as number | null, minSalary: null as number | null, maxSalary: null as number | null, marketBenchmark: null as number | null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalaryData() {
      try {
        const res = await fetch('/api/salary');
        if (res.ok) {
          const data = await res.json();
          setDepartmentSalaries(data.departments || []);
          setRoleSalaries(data.roles || []);
          setSalaryStats({
            avgSalary: data.avgSalary ?? null,
            medianSalary: data.medianSalary ?? null,
            minSalary: data.minSalary ?? null,
            maxSalary: data.maxSalary ?? null,
            marketBenchmark: data.marketBenchmark ?? null,
          });
        }
      } catch {
        // Show empty states
      } finally {
        setLoading(false);
      }
    }
    fetchSalaryData();
  }, []);

  const maxDeptSalary = departmentSalaries.length > 0 ? Math.max(...departmentSalaries.map(d => d.avgSalary)) : 1;

  const filteredRoles = departmentFilter === 'all'
    ? roleSalaries
    : roleSalaries.filter(r => r.department === departmentFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.salary.title}</h1>
            <p className="text-sm text-muted-foreground">{t.salary.subtitle}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t.salary.exportReport}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.salary.avgSalary}</p>
                <p className="text-xl font-bold">{salaryStats.avgSalary != null ? `$${salaryStats.avgSalary.toLocaleString()}` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.salary.medianSalary}</p>
                <p className="text-xl font-bold">{salaryStats.medianSalary != null ? `$${salaryStats.medianSalary.toLocaleString()}` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.salary.salaryRange}</p>
                <p className="text-xl font-bold">{salaryStats.minSalary != null && salaryStats.maxSalary != null ? `$${Math.round(salaryStats.minSalary / 1000)}K-$${Math.round(salaryStats.maxSalary / 1000)}K` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.salary.marketBenchmark}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{salaryStats.marketBenchmark != null ? `+${salaryStats.marketBenchmark}%` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Salary Comparison */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.salary.departmentComparison}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {departmentSalaries.length > 0 ? departmentSalaries.map((dept, idx) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-muted-foreground">${(dept.avgSalary / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', dept.color || defaultDeptColors[idx % defaultDeptColors.length])}
                    style={{ width: `${(dept.avgSalary / maxDeptSalary) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No salary data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Distribution Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.salary.distribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentSalaries.length > 0 ? (
            <div className="w-full h-56 relative">
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No salary distribution data available</p>
              </div>
            </div>
            ) : (
            <div className="w-full h-56 relative">
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No salary data available</p>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-Based Salary Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.salary.roleBasedSalary}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder={t.salary.filterDepartment} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.salary.allDepartments}</SelectItem>
                  <SelectItem value="Engineering">{t.salary.engineering}</SelectItem>
                  <SelectItem value="Design">{t.salary.design}</SelectItem>
                  <SelectItem value="Marketing">{t.salary.marketing}</SelectItem>
                  <SelectItem value="Sales">{t.salary.sales}</SelectItem>
                  <SelectItem value="HR">{t.salary.hr}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t.salary.role}</TableHead>
                  <TableHead className="text-xs">{t.salary.department}</TableHead>
                  <TableHead className="text-xs">{t.salary.min}</TableHead>
                  <TableHead className="text-xs">{t.salary.max}</TableHead>
                  <TableHead className="text-xs">{t.salary.average}</TableHead>
                  <TableHead className="text-xs">{t.salary.marketDelta}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                  <TableRow key={role.id} className="gradient-border-start">
                    <TableCell className="text-sm font-medium py-3">{role.role}</TableCell>
                    <TableCell className="text-sm py-3">
                      <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                        {role.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm py-3">${role.min.toLocaleString()}</TableCell>
                    <TableCell className="text-sm py-3">${role.max.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-semibold py-3">${role.avg.toLocaleString()}</TableCell>
                    <TableCell className="py-3">
                      <div className={cn('flex items-center gap-1 text-sm font-medium',
                        role.marketDelta >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {role.marketDelta >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {role.marketDelta >= 0 ? '+' : ''}{role.marketDelta}%
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No salary data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
