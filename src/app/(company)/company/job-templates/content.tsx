// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Plus } from 'lucide-react';
import type { JobTemplate, TemplateFormData } from './components/constants';
import { emptyForm } from './components/constants';
import StatsCards from './components/StatsCards';
import TemplateGrid from './components/TemplateGrid';
import TemplateFormDialog from './components/TemplateFormDialog';
import UseTemplateDialog from './components/UseTemplateDialog';
import DeleteTemplateDialog from './components/DeleteTemplateDialog';

export default function JobTemplatesContent() {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterJobType, setFilterJobType] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/job-templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || template.department === filterDepartment;
    const matchesJobType = filterJobType === 'all' || template.jobType === filterJobType;
    return matchesSearch && matchesDepartment && matchesJobType;
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/job-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, salaryMin: Number(formData.salaryMin) || 0, salaryMax: Number(formData.salaryMax) || 0 }),
      });
      if (res.ok) { toast.success(t.common.success); setCreateDialogOpen(false); setFormData(emptyForm); fetchTemplates(); }
      else { toast.error(t.common.error); }
    } catch { toast.error(t.common.error); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/job-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplate.id, ...formData, salaryMin: Number(formData.salaryMin) || 0, salaryMax: Number(formData.salaryMax) || 0 }),
      });
      if (res.ok) { toast.success(t.common.success); setEditDialogOpen(false); setSelectedTemplate(null); setFormData(emptyForm); fetchTemplates(); }
      else { toast.error(t.common.error); }
    } catch { toast.error(t.common.error); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/job-templates?id=${selectedTemplate.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success(t.common.success); setDeleteDialogOpen(false); setSelectedTemplate(null); fetchTemplates(); }
      else { toast.error(t.common.error); }
    } catch { toast.error(t.common.error); }
  };

  const openEditDialog = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name, title: template.title, description: template.description,
      department: template.department, jobType: template.jobType,
      requirements: [...template.requirements], responsibilities: template.responsibilities,
      benefits: [...template.benefits], salaryMin: String(template.salaryMin),
      salaryMax: String(template.salaryMax), location: template.location,
      remote: template.remote, skills: [...template.skills],
    });
    setEditDialogOpen(true);
  };

  const openUseDialog = (template: JobTemplate) => { setSelectedTemplate(template); setUseDialogOpen(true); };
  const openDeleteDialog = (template: JobTemplate) => { setSelectedTemplate(template); setDeleteDialogOpen(true); };

  const handleUseTemplate = () => {
    setUseDialogOpen(false);
    toast.success(`${t.jobTemplates.useTemplate}: ${selectedTemplate?.title}`, { description: t.jobTemplates.useThisTemplate });
  };

  const openCreateDialog = () => { setFormData(emptyForm); setCreateDialogOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br bg-blue-600">
              <Copy className="w-4 h-4 text-white" />
            </div>
            {t.jobTemplates.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t.jobTemplates.subtitle}</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md h-9">
          <Plus className="w-4 h-4 me-2" />
          {t.jobTemplates.createTemplate}
        </Button>
      </div>

      {/* Stats */}
      <StatsCards templates={templates} />

      {/* Filters + Grid + Empty State */}
      <TemplateGrid
        loading={loading}
        filteredTemplates={filteredTemplates}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterDepartment={filterDepartment}
        onFilterDepartmentChange={setFilterDepartment}
        filterJobType={filterJobType}
        onFilterJobTypeChange={setFilterJobType}
        onUse={openUseDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onCreateNew={openCreateDialog}
      />

      {/* Create Dialog */}
      <TemplateFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title={t.jobTemplates.createTemplate}
        onSubmit={handleCreate}
        formData={formData}
        onFormDataChange={setFormData}
        saving={saving}
      />

      {/* Edit Dialog */}
      <TemplateFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title={t.jobTemplates.editTemplate}
        onSubmit={handleEdit}
        isEdit
        formData={formData}
        onFormDataChange={setFormData}
        saving={saving}
      />

      {/* Use Dialog */}
      <UseTemplateDialog
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
        selectedTemplate={selectedTemplate}
        onConfirm={handleUseTemplate}
      />

      {/* Delete Dialog */}
      <DeleteTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
