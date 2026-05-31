'use client';

import React from 'react';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

interface CertificationCardProps {
  certifications: CertificationItem[];
  certDialogOpen: boolean;
  setCertDialogOpen: (v: boolean) => void;
  editingCert: CertificationItem | null;
  certForm: Partial<CertificationItem>;
  setCertForm: React.Dispatch<React.SetStateAction<Partial<CertificationItem>>>;
  openCertDialog: (cert?: CertificationItem) => void;
  saveCert: () => void;
  deleteCert: (id: string) => void;
}

export default function CertificationCard({
  certifications,
  certDialogOpen,
  setCertDialogOpen,
  editingCert,
  certForm,
  setCertForm,
  openCertDialog,
  saveCert,
  deleteCert,
}: CertificationCardProps) {
  const { t } = useI18n();

  return (
    <>
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              {t.candidate.certifications}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => openCertDialog()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t.candidate.addCertification}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No certifications added yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {certifications.map((cert) => (
                <div key={cert.id} className="group flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm">{cert.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuer}{cert.date ? ` • ${cert.date}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCertDialog(cert)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCert(cert.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certification Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCert ? 'Edit Certification' : t.candidate.addCertification}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={certForm.name || ''}
                onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                placeholder="e.g. AWS Certified Developer"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.issuer}</Label>
              <Input
                value={certForm.issuer || ''}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                placeholder="e.g. Amazon Web Services"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.candidate.date}</Label>
              <Input
                value={certForm.date || ''}
                onChange={(e) => setCertForm({ ...certForm, date: e.target.value })}
                placeholder="YYYY-MM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDialogOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveCert}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
