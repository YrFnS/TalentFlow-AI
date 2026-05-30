// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Grid3X3,
  List,
  Plus,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Department = 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'HR' | 'Operations';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: Department;
  email: string;
  phone: string;
  joinDate: string;
  location: string;
}

const departments: Department[] = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Operations'];

const gradientPairs: Record<string, string> = {
  Engineering: 'from-teal-400 to-cyan-500',
  Design: 'from-emerald-400 to-teal-500',
  Marketing: 'from-cyan-400 to-emerald-500',
  Sales: 'from-teal-500 to-emerald-600',
  HR: 'from-emerald-500 to-teal-600',
  Operations: 'from-cyan-500 to-teal-600',
};

const initialEmployees: Employee[] = [];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function DirectoryPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredEmployees = initialEmployees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const deptCounts = departments.reduce((acc, dept) => {
    acc[dept] = initialEmployees.filter(e => e.department === dept).length;
    return acc;
  }, {} as Record<string, number>);

  const openDetail = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.directory.title}</h1>
            <p className="text-sm text-muted-foreground">{t.directory.subtitle}</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white">
          <Plus className="h-4 w-4 me-2" />
          {t.directory.addEmployee}
        </Button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.directory.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className={cn('h-8 px-3', viewMode === 'grid' && 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white')}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4 me-1.5" />
            {t.directory.gridView}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={cn('h-8 px-3', viewMode === 'list' && 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white')}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 me-1.5" />
            {t.directory.listView}
          </Button>
        </div>
      </div>

      {/* Department Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDept('All')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            selectedDept === 'All'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400'
          )}
        >
          {t.directory.allDepartments}
          <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">{initialEmployees.length}</Badge>
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              selectedDept === dept
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400'
            )}
          >
            {dept}
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full',
              selectedDept === dept ? 'bg-white/20 text-white' : 'bg-muted-foreground/10'
            )}>
              {deptCounts[dept]}
            </span>
          </button>
        ))}
      </div>

      {/* Employee Grid/List */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">{t.directory.noEmployees}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className="border-border/50 hover:shadow-md transition-shadow cursor-pointer hover:border-teal-200 dark:hover:border-teal-800"
              onClick={() => openDetail(emp)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white text-lg font-bold',
                    gradientPairs[emp.department]
                  )}>
                    {getInitials(emp.name)}
                  </div>
                  <h3 className="mt-3 font-semibold text-sm">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{emp.role}</p>
                  <Badge className="mt-2 text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                    {emp.department}
                  </Badge>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className="border-border/50 hover:shadow-md transition-shadow cursor-pointer hover:border-teal-200 dark:hover:border-teal-800"
              onClick={() => openDetail(emp)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold',
                    gradientPairs[emp.department]
                  )}>
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{emp.name}</h3>
                      <Badge className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                        {emp.department}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {emp.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {emp.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.directory.employeeDetails}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-white text-2xl font-bold',
                  gradientPairs[selectedEmployee.department]
                )}>
                  {getInitials(selectedEmployee.name)}
                </div>
                <h3 className="mt-3 text-lg font-bold">{selectedEmployee.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                <Badge className="mt-2 text-xs bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                  {selectedEmployee.department}
                </Badge>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{selectedEmployee.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{selectedEmployee.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{t.directory.joinedOn} {selectedEmployee.joinDate}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
