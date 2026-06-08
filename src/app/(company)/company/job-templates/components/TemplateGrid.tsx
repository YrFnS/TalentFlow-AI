// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, FileText, Building2, Briefcase } from 'lucide-react';
import type { JobTemplate } from './constants';
import TemplateCard from './TemplateCard';

interface TemplateGridProps {
  loading: boolean;
  filteredTemplates: JobTemplate[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterDepartment: string;
  onFilterDepartmentChange: (val: string) => void;
  filterJobType: string;
  onFilterJobTypeChange: (val: string) => void;
  onUse: (template: JobTemplate) => void;
  onEdit: (template: JobTemplate) => void;
  onDelete: (template: JobTemplate) => void;
  onCreateNew: () => void;
}

export default function TemplateGrid({
  loading,
  filteredTemplates,
  searchQuery,
  onSearchChange,
  filterDepartment,
  onFilterDepartmentChange,
  filterJobType,
  onFilterJobTypeChange,
  onUse,
  onEdit,
  onDelete,
  onCreateNew,
}: TemplateGridProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.jobTemplates.searchTemplates}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
        <Select value={filterDepartment} onValueChange={onFilterDepartmentChange}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <Building2 className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={t.jobTemplates.filterDepartment} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.jobTemplates.allDepartments}</SelectItem>
            <SelectItem value="engineering">{t.jobTemplates.engineering}</SelectItem>
            <SelectItem value="design">{t.jobTemplates.design}</SelectItem>
            <SelectItem value="marketing">{t.jobTemplates.marketing}</SelectItem>
            <SelectItem value="sales">{t.jobTemplates.sales}</SelectItem>
            <SelectItem value="hr">{t.jobTemplates.humanResources}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterJobType} onValueChange={onFilterJobTypeChange}>
          <SelectTrigger className="w-full sm:w-44 h-9">
            <Briefcase className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={t.jobTemplates.filterJobType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.jobTemplates.allJobTypes}</SelectItem>
            <SelectItem value="full-time">Full Time</SelectItem>
            <SelectItem value="part-time">Part Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-12 bg-muted rounded" />
                <div className="flex gap-1.5">
                  <div className="h-5 bg-muted rounded w-14" />
                  <div className="h-5 bg-muted rounded w-14" />
                  <div className="h-5 bg-muted rounded w-14" />
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="h-8 flex-1 bg-muted rounded" />
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUse}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed animate-fade-in-up">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t.jobTemplates.noTemplates}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t.jobTemplates.subtitle}</p>
            <Button
              className="mt-4 bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
              onClick={onCreateNew}
            >
              <Plus className="w-4 h-4 me-2" />
              {t.jobTemplates.createTemplate}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
