// @ts-nocheck
'use client'

import React, { useState, useRef } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Camera, Upload, X, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileUploadZoneProps {
  name: string;
  initials: string;
  role: string;
}

export default function ProfileUploadZone({ name, initials, role }: ProfileUploadZoneProps) {
  const { t } = useI18n();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Visual only - no actual upload
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            {/* Large Avatar */}
            <div className="relative">
              <Avatar className="w-16 h-16">
                {preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                onClick={() => setUploadOpen(true)}
                aria-label="Change photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{name}</h3>
              <p className="text-sm text-muted-foreground">{role}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="w-3 h-3 me-1.5" />
                {t.profileUpload?.changePhoto || 'Change Photo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profileUpload?.changePhoto || 'Change Photo'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Drag and Drop Zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-muted-foreground/25 hover:border-blue-400'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowse}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  </Avatar>
                  <p className="text-xs text-muted-foreground">{t.profileUpload?.dragToReplace || 'Drag a new image or click to replace'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ImagePlus className="w-7 h-7 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.profileUpload?.dragDrop || 'Drag & drop your photo here'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profileUpload?.or || 'or'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); handleBrowse(); }}>
                    <Upload className="w-3 h-3 me-1.5" />
                    {t.profileUpload?.browseFiles || 'Browse Files'}
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setUploadOpen(false); setPreview(null); }}>
              {t.common.cancel || 'Cancel'}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setUploadOpen(false); }}
              disabled={!preview}
            >
              {t.profileUpload?.upload || 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
