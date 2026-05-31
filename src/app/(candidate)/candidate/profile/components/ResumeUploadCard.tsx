'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CloudUpload,
  Loader2,
  Zap,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: {
    title: string;
    company: string;
    description: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
  rawText?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  currentTitle: string;
  linkedin: string;
  portfolio: string;
  availability: string;
  expectedSalary: string;
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

interface ResumeUploadCardProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>;
  setEducations: React.Dispatch<React.SetStateAction<EducationItem[]>>;
  setCertifications: React.Dispatch<React.SetStateAction<CertificationItem[]>>;
}

export default function ResumeUploadCard({
  personalInfo,
  setPersonalInfo,
  skills,
  setSkills,
  setExperiences,
  setEducations,
  setCertifications,
}: ResumeUploadCardProps) {
  const { t } = useI18n();

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.';
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit.';
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setParsedData(null);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 15;
      });
    }, 200);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/resume/upload', { method: 'POST', body: formData });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.resume.uploadError);
      }
      const data = await response.json();
      setUploadedFile(data.file);
      toast.success(t.resume.uploadSuccess);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      toast.error(error instanceof Error ? error.message : t.resume.uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  };
  const handleBrowseClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleUpload(files[0]);
    e.target.value = '';
  };
  const handleRemoveResume = () => { setUploadedFile(null); setParsedData(null); setUploadProgress(0); };

  const handleParseResume = async () => {
    if (!uploadedFile) return;
    setIsParsing(true);
    try {
      const response = await fetch(uploadedFile.url);
      const blob = await response.blob();
      let resumeText = '';
      try { resumeText = await blob.text(); } catch {
        resumeText = `Resume file: ${uploadedFile.name}. File type: ${uploadedFile.type}. Uploaded at: ${uploadedFile.uploadedAt}. This is a ${uploadedFile.type.includes('pdf') ? 'PDF' : 'Word'} document that contains professional experience, education, skills, and certifications.`;
      }
      if (resumeText.trim().length < 50 || resumeText.includes('\0')) {
        resumeText = `Resume file: ${uploadedFile.name}. Please ensure the file contains readable text content for AI parsing.`;
      }
      const parseResponse = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || t.resume.parseError);
      }
      const data = await parseResponse.json();
      setParsedData(data.parsed);
      toast.success(t.resume.parseSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.resume.parseError);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFillProfile = () => {
    if (!parsedData) return;
    if (parsedData.name) setPersonalInfo((prev) => ({ ...prev, name: parsedData.name! }));
    if (parsedData.email) setPersonalInfo((prev) => ({ ...prev, email: parsedData.email! }));
    if (parsedData.phone) setPersonalInfo((prev) => ({ ...prev, phone: parsedData.phone! }));
    if (parsedData.skills && parsedData.skills.length > 0) {
      const newSkills = parsedData.skills.filter(
        (skill) => !skills.some((existing) => existing.toLowerCase() === skill.toLowerCase())
      );
      if (newSkills.length > 0) setSkills((prev) => [...prev, ...newSkills]);
    }
    if (parsedData.experience && parsedData.experience.length > 0) {
      const newExperiences = parsedData.experience.map((exp, idx) => ({
        id: `parsed-exp-${Date.now()}-${idx}`,
        title: exp.title || '',
        company: exp.company || '',
        description: exp.description || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
      }));
      setExperiences((prev) => [...prev, ...newExperiences]);
    }
    if (parsedData.education && parsedData.education.length > 0) {
      const newEducation = parsedData.education.map((edu, idx) => ({
        id: `parsed-edu-${Date.now()}-${idx}`,
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
      }));
      setEducations((prev) => [...prev, ...newEducation]);
    }
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      const newCerts = parsedData.certifications.map((cert, idx) => ({
        id: `parsed-cert-${Date.now()}-${idx}`,
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
      }));
      setCertifications((prev) => [...prev, ...newCerts]);
    }
    toast.success(t.resume.fillProfile);
  };

  return (
    <Card className="border-0 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          {t.resume.title}
        </CardTitle>
        <CardDescription>{t.resume.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragging
                ? 'border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-950/30'
                : 'border-teal-300 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBrowseClick(); }}
            aria-label={t.resume.uploadArea}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                <CloudUpload className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.resume.uploadArea}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.resume.or}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
              >
                <Upload className="w-3.5 h-3.5 me-1.5" />
                {t.resume.browseFiles}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">{t.resume.supportedFormats}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate">{uploadedFile.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{t.resume.fileSize}: {formatFileSize(uploadedFile.size)}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">{t.resume.lastUploaded}: {new Date(uploadedFile.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleRemoveResume} aria-label={t.resume.removeResume}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.resume.uploading}</span>
                  <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="gap-2 flex-1 border-teal-300 dark:border-teal-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                onClick={handleParseResume}
                disabled={isParsing || isUploading}
              >
                {isParsing ? (<><Loader2 className="h-4 w-4 animate-spin" />{t.resume.parsing}</>) : (<><Zap className="h-4 w-4" />{t.resume.parseWithAI}</>)}
              </Button>
            </div>

            {parsedData && (
              <div className="space-y-4 animate-fade-in-up">
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-teal-600" />
                    {t.resume.extractedInfo}
                  </h3>

                  {(parsedData.name || parsedData.email || parsedData.phone) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {parsedData.name && (
                        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.name}</p>
                          <p className="text-sm font-medium mt-0.5">{parsedData.name}</p>
                        </div>
                      )}
                      {parsedData.email && (
                        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.email}</p>
                          <p className="text-sm font-medium mt-0.5 truncate">{parsedData.email}</p>
                        </div>
                      )}
                      {parsedData.phone && (
                        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.phone}</p>
                          <p className="text-sm font-medium mt-0.5">{parsedData.phone}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {parsedData.skills && parsedData.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{t.resume.extractedSkills} ({parsedData.skills.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedData.skills.map((skill, idx) => (
                          <Badge key={`parsed-skill-${idx}`} variant="secondary" className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-0">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.experience && parsedData.experience.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{t.resume.extractedExperience} ({parsedData.experience.length})</p>
                      <ScrollArea className="max-h-40">
                        <div className="space-y-2">
                          {parsedData.experience.map((exp, idx) => (
                            <div key={`parsed-exp-${idx}`} className="p-2.5 rounded-lg border bg-card text-sm">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-xs">{exp.title}</p>
                                <span className="text-[10px] text-muted-foreground">{exp.startDate}{exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{exp.company}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {parsedData.education && parsedData.education.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{t.resume.extractedEducation} ({parsedData.education.length})</p>
                      <div className="space-y-2">
                        {parsedData.education.map((edu, idx) => (
                          <div key={`parsed-edu-${idx}`} className="p-2.5 rounded-lg border bg-card text-sm">
                            <p className="font-medium text-xs">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                            <p className="text-xs text-muted-foreground">{edu.institution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.certifications && parsedData.certifications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">{t.resume.certifications} ({parsedData.certifications.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedData.certifications.map((cert, idx) => (
                          <Badge key={`parsed-cert-${idx}`} variant="outline" className="text-xs border-teal-300 dark:border-teal-700">
                            {cert.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto" onClick={handleFillProfile}>
                    <Sparkles className="h-4 w-4" />
                    {t.resume.fillProfile}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5">{t.resume.fillProfileDesc}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isUploading && !uploadedFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t.resume.uploading}</span>
              <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
