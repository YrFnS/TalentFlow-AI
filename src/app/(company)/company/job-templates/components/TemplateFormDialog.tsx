// @ts-nocheck
import React from 'react';
import { useI18n } from '@/store/i18n-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, MapPin } from 'lucide-react';
import type { TemplateFormData } from './constants';
import TagInput from './TagInput';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: () => void;
  isEdit?: boolean;
  formData: TemplateFormData;
  onFormDataChange: (data: TemplateFormData) => void;
  saving: boolean;
}

export default function TemplateFormDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  isEdit,
  formData,
  onFormDataChange,
  saving,
}: TemplateFormDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dialog-content-glow">
        <DialogHeader className="dialog-header-accent pt-2">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t.jobTemplates.editTemplate : t.jobTemplates.createTemplate}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.templateName}</Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder={t.jobTemplates.templateNamePlaceholder}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.jobTitle}</Label>
            <Input
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Frontend Developer"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.description}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Describe the role and what makes it exciting..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.department}</Label>
              <Select
                value={formData.department}
                onValueChange={(val) => onFormDataChange({ ...formData, department: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">{t.jobTemplates.engineering}</SelectItem>
                  <SelectItem value="design">{t.jobTemplates.design}</SelectItem>
                  <SelectItem value="marketing">{t.jobTemplates.marketing}</SelectItem>
                  <SelectItem value="sales">{t.jobTemplates.sales}</SelectItem>
                  <SelectItem value="hr">{t.jobTemplates.humanResources}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.jobType}</Label>
              <Select
                value={formData.jobType}
                onValueChange={(val) => onFormDataChange({ ...formData, jobType: val })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.requirements}</Label>
            <TagInput
              tags={formData.requirements}
              onTagsChange={(requirements) => onFormDataChange({ ...formData, requirements })}
              placeholder="Add a requirement and press Enter..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.responsibilities}</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => onFormDataChange({ ...formData, responsibilities: e.target.value })}
              placeholder="Describe the key responsibilities..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.benefits}</Label>
            <TagInput
              tags={formData.benefits}
              onTagsChange={(benefits) => onFormDataChange({ ...formData, benefits })}
              placeholder="Add a benefit and press Enter..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.salaryRange}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DollarSign className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => onFormDataChange({ ...formData, salaryMin: e.target.value })}
                  placeholder="Min"
                  className="ps-7 h-9"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => onFormDataChange({ ...formData, salaryMax: e.target.value })}
                  placeholder="Max"
                  className="ps-7 h-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.location}</Label>
              <div className="relative">
                <MapPin className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={formData.location}
                  onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="ps-7 h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t.jobTemplates.remote}</Label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  checked={formData.remote}
                  onCheckedChange={(checked) => onFormDataChange({ ...formData, remote: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.remote ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.jobTemplates.skills}</Label>
            <TagInput
              tags={formData.skills}
              onTagsChange={(skills) => onFormDataChange({ ...formData, skills })}
              placeholder="Add a skill and press Enter..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9">{t.common.cancel}</Button>
          </DialogClose>
          <Button
            onClick={onSubmit}
            disabled={saving || !formData.name.trim() || !formData.title.trim()}
            className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white h-9"
          >
            {saving && <Loader2 className="w-4 h-4 me-1 animate-spin" />}
            {isEdit ? t.jobTemplates.updateTemplate : t.jobTemplates.saveTemplate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
