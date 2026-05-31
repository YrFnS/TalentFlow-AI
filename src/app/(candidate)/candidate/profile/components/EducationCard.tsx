'use client';

import React from 'react';
import { Plus, Pencil, Trash2, GraduationCap, Calendar } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface EducationCardProps {
  educations: EducationItem[];
  eduDialogOpen: boolean;
  setEduDialogOpen: (v: boolean) => void;
  editingEdu: EducationItem | null;
  eduForm: Partial<EducationItem>;
  setEduForm: React.Dispatch<React.SetStateAction<Partial<EducationItem>>>;
  openEduDialog: (edu?: EducationItem) => void;
  saveEdu: () => void;
  deleteEdu: (id: string) => void;
}

export default function EducationCard({
  educations,
  eduDialogOpen,
  setEduDialogOpen,
  editingEdu,
  eduForm,
  setEduForm,
  openEduDialog,
  saveEdu,
  deleteEdu,
}: EducationCardProps) {
  const { t } = useI18n();

  return (
    <>
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              {t.candidate.education}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => openEduDialog()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t.candidate.addEducation}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {educations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No education added yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
              {educations.map((edu) => (
                <div key={edu.id} className="group p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{edu.degree} in {edu.field}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {edu.startDate} — {edu.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEduDialog(edu)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEdu(edu.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education Dialog */}
      <Dialog open={eduDialogOpen} onOpenChange={setEduDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEdu ? t.candidate.editEducation : t.candidate.addEducation}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.candidate.institution}</Label>
              <Input
                value={eduForm.institution || ''}
                onChange={(e) => setEduForm({ ...eduForm, institution: (e.target as unknown as { value: string }).value })}
                placeholder="e.g. MIT"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.degree}</Label>
              <Select value={eduForm.degree || ''} onValueChange={(v) => setEduForm({ ...eduForm, degree: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="Associate">Associate</SelectItem>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Doctorate">Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.field}</Label>
              <Input
                value={eduForm.field || ''}
                onChange={(e) => setEduForm({ ...eduForm, field: (e.target as unknown as { value: string }).value })}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.candidate.startDate}</Label>
                <Input
                  value={eduForm.startDate || ''}
                  onChange={(e) => setEduForm({ ...eduForm, startDate: (e.target as unknown as { value: string }).value })}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.candidate.endDate}</Label>
                <Input
                  value={eduForm.endDate || ''}
                  onChange={(e) => setEduForm({ ...eduForm, endDate: (e.target as unknown as { value: string }).value })}
                  placeholder="YYYY-MM"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduDialogOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveEdu}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
