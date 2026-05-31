'use client';

import React from 'react';
import { Plus, Pencil, Trash2, Briefcase, Calendar } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface ExperienceCardProps {
  experiences: ExperienceItem[];
  expDialogOpen: boolean;
  setExpDialogOpen: (v: boolean) => void;
  editingExp: ExperienceItem | null;
  expForm: Partial<ExperienceItem>;
  setExpForm: React.Dispatch<React.SetStateAction<Partial<ExperienceItem>>>;
  openExpDialog: (exp?: ExperienceItem) => void;
  saveExp: () => void;
  deleteExp: (id: string) => void;
}

export default function ExperienceCard({
  experiences,
  expDialogOpen,
  setExpDialogOpen,
  editingExp,
  expForm,
  setExpForm,
  openExpDialog,
  saveExp,
  deleteExp,
}: ExperienceCardProps) {
  const { t } = useI18n();

  return (
    <>
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              {t.candidate.experience}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => openExpDialog()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t.candidate.addExperience}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No experience added yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
              {experiences.map((exp) => (
                <div key={exp.id} className="group p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exp.startDate} — {exp.current ? t.candidate.present : exp.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openExpDialog(exp)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteExp(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Dialog */}
      <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExp ? t.candidate.editExperience : t.candidate.addExperience}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.candidate.currentTitle}</Label>
              <Input
                value={expForm.title || ''}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                placeholder="e.g. Senior Developer"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.company}</Label>
              <Input
                value={expForm.company || ''}
                onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                placeholder="e.g. TechCorp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.candidate.startDate}</Label>
                <Input
                  value={expForm.startDate || ''}
                  onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.candidate.endDate}</Label>
                <Input
                  value={expForm.current ? '' : expForm.endDate || ''}
                  onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  placeholder="YYYY-MM"
                  disabled={expForm.current}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={expForm.current || false}
                onCheckedChange={(c) => setExpForm({ ...expForm, current: c, endDate: c ? '' : expForm.endDate })}
              />
              <Label>{t.candidate.present}</Label>
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.description}</Label>
              <Textarea
                value={expForm.description || ''}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                rows={3}
                placeholder="Describe your role and achievements..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialogOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveExp}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
