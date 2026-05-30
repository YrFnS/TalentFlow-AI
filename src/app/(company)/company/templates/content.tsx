'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  Code,
  Palette,
  Megaphone,
  TrendingUp,
  Wrench,
  Search,
  Plus,
  Calendar,
  FileText,
} from 'lucide-react';

interface JobTemplate {
  id: number;
  name: string;
  category: string;
  icon: React.ElementType;
  gradient: string;
  usageCount: number;
  lastModified: string;
  description: string;
}

const initialTemplates: JobTemplate[] = [];

export default function TemplatesPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = [
    { key: 'all', label: t.templates.categories.all },
    { key: 'engineering', label: t.templates.categories.engineering },
    { key: 'design', label: t.templates.categories.design },
    { key: 'marketing', label: t.templates.categories.marketing },
    { key: 'sales', label: t.templates.categories.sales },
    { key: 'operations', label: t.templates.categories.operations },
  ];

  const filteredTemplates = initialTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t.templates.title}</h1>
          <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
            {initialTemplates.length}
          </Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="w-4 h-4 me-2" />
              {t.templates.createTemplate}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.templates.dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.templates.templateName}</label>
                <Input placeholder={t.templates.templateNamePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.templates.category}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.templates.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.key !== 'all').map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.templates.jobDescription}</label>
                <Textarea placeholder={t.templates.jobDescriptionPlaceholder} rows={4} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.templates.requirements}</label>
                <Textarea placeholder={t.templates.requirementsPlaceholder} rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.templates.benefits}</label>
                <Textarea placeholder={t.templates.benefitsPlaceholder} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                onClick={() => setDialogOpen(false)}
              >
                {t.templates.saveTemplate}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.templates.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9 h-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-muted/50 h-auto flex-wrap">
          {categories.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs sm:text-sm">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Cards Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            const categoryLabel = categories.find(c => c.key === template.category)?.label || template.category;
            return (
              <Card
                key={template.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${template.gradient} text-white shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-semibold leading-tight truncate">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1.5 text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0">
                        {categoryLabel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
                    {template.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Used {template.usageCount} times</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {template.lastModified}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs h-8"
                    >
                      {t.templates.useTemplate}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      {t.templates.edit}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 mb-4">
              <FileText className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t.templates.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t.templates.emptyDesc}</p>
            <Button
              className="mt-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 me-2" />
              {t.templates.createNew}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
