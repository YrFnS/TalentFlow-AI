// @ts-nocheck
'use client'

import React, { useState, useCallback, useRef } from 'react';
import {
  User,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Sparkles,
  FileText,
  GraduationCap,
  Award,
  X,
  CheckCircle2,
  Circle,
  Briefcase,
  Calendar,
  CloudUpload,
  Loader2,
  Zap,
  Trash,
  Eye,
} from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';

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

export default function ProfilePage() {
  const { t } = useI18n();

  // Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    currentTitle: '',
    linkedin: '',
    portfolio: '',
    availability: 'open',
    expectedSalary: '',
  });

  const [isPublic, setIsPublic] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);

  const [educations, setEducations] = useState<EducationItem[]>([]);

  const [certifications, setCertifications] = useState<CertificationItem[]>([]);

  // Dialog states
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [eduDialogOpen, setEduDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);

  // Form states
  const [expForm, setExpForm] = useState<Partial<ExperienceItem>>({});
  const [eduForm, setEduForm] = useState<Partial<EducationItem>>({});
  const [certForm, setCertForm] = useState<Partial<CertificationItem>>({});

  // Resume states
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile completeness
  const profileCompleteness = (() => {
    let score = 0;
    const total = 8;
    if (personalInfo.name) score++;
    if (personalInfo.phone) score++;
    if (personalInfo.location) score++;
    if (personalInfo.bio) score++;
    if (experiences.length > 0) score++;
    if (educations.length > 0) score++;
    if (skills.length > 0) score++;
    if (certifications.length > 0) score++;
    return Math.round((score / total) * 100);
  })();

  const addSkill = useCallback(() => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  }, [newSkill, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  }, [skills]);

  const openExpDialog = (exp?: ExperienceItem) => {
    if (exp) {
      setEditingExp(exp);
      setExpForm(exp);
    } else {
      setEditingExp(null);
      setExpForm({ title: '', company: '', description: '', startDate: '', endDate: '', current: false });
    }
    setExpDialogOpen(true);
  };

  const saveExp = () => {
    if (editingExp) {
      setExperiences(experiences.map((e) => (e.id === editingExp.id ? { ...e, ...expForm } as ExperienceItem : e)));
    } else {
      setExperiences([...experiences, { ...expForm, id: Date.now().toString() } as ExperienceItem]);
    }
    setExpDialogOpen(false);
  };

  const deleteExp = (id: string) => setExperiences(experiences.filter((e) => e.id !== id));

  const openEduDialog = (edu?: EducationItem) => {
    if (edu) {
      setEditingEdu(edu);
      setEduForm(edu);
    } else {
      setEditingEdu(null);
      setEduForm({ institution: '', degree: '', field: '', startDate: '', endDate: '' });
    }
    setEduDialogOpen(true);
  };

  const saveEdu = () => {
    if (editingEdu) {
      setEducations(educations.map((e) => (e.id === editingEdu.id ? { ...e, ...eduForm } as EducationItem : e)));
    } else {
      setEducations([...educations, { ...eduForm, id: Date.now().toString() } as EducationItem]);
    }
    setEduDialogOpen(false);
  };

  const deleteEdu = (id: string) => setEducations(educations.filter((e) => e.id !== id));

  const openCertDialog = (cert?: CertificationItem) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm(cert);
    } else {
      setEditingCert(null);
      setCertForm({ name: '', issuer: '', date: '' });
    }
    setCertDialogOpen(true);
  };

  const saveCert = () => {
    if (editingCert) {
      setCertifications(certifications.map((c) => (c.id === editingCert.id ? { ...c, ...certForm } as CertificationItem : c)));
    } else {
      setCertifications([...certifications, { ...certForm, id: Date.now().toString() } as CertificationItem]);
    }
    setCertDialogOpen(false);
  };

  const deleteCert = (id: string) => setCertifications(certifications.filter((c) => c.id !== id));

  // Resume upload handlers
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

    const maxSize = 5 * 1024 * 1024; // 5MB
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

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
    // Reset input value so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveResume = () => {
    setUploadedFile(null);
    setParsedData(null);
    setUploadProgress(0);
  };

  const handleParseResume = async () => {
    if (!uploadedFile) return;

    setIsParsing(true);
    try {
      // Read the file content as text for parsing
      const response = await fetch(uploadedFile.url);
      const blob = await response.blob();

      // For text-based extraction, read the file content
      let resumeText = '';
      try {
        resumeText = await blob.text();
      } catch {
        // If binary file (PDF, DOCX), use file name and metadata as context
        resumeText = `Resume file: ${uploadedFile.name}. File type: ${uploadedFile.type}. Uploaded at: ${uploadedFile.uploadedAt}. This is a ${uploadedFile.type.includes('pdf') ? 'PDF' : 'Word'} document that contains professional experience, education, skills, and certifications.`;
      }

      // If the text is too short or looks like binary data, skip mock data
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

    // Fill personal info from parsed data
    if (parsedData.name) {
      setPersonalInfo((prev) => ({ ...prev, name: parsedData.name! }));
    }
    if (parsedData.email) {
      setPersonalInfo((prev) => ({ ...prev, email: parsedData.email! }));
    }
    if (parsedData.phone) {
      setPersonalInfo((prev) => ({ ...prev, phone: parsedData.phone! }));
    }

    // Merge skills (add new ones that don't already exist)
    if (parsedData.skills && parsedData.skills.length > 0) {
      const newSkills = parsedData.skills.filter(
        (skill) => !skills.some((existing) => existing.toLowerCase() === skill.toLowerCase())
      );
      if (newSkills.length > 0) {
        setSkills((prev) => [...prev, ...newSkills]);
      }
    }

    // Add experiences from parsed data
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

    // Add education from parsed data
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

    // Add certifications from parsed data
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.candidate.myProfile}</h1>
          <p className="text-muted-foreground mt-1">{t.resume.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {}}>
            <Sparkles className="h-4 w-4 text-teal-600" />
            {t.candidate.aiAnalyzeResume}
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            {t.common.save}
          </Button>
        </div>
      </div>

      {/* ===== RESUME UPLOAD SECTION ===== */}
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
            /* Drag & Drop Upload Area */
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? 'border-teal-400 bg-teal-50 dark:border-teal-600'
                  : 'border-teal-300 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/20'
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
                  <CloudUpload className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.resume.uploadArea}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.resume.or}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 border-teal-300 text-teal-600 hover:bg-teal-50"
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
            /* Uploaded File Info */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleRemoveResume}
                    aria-label={t.resume.removeResume}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.resume.uploading}</span>
                    <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Parse with AI Button */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="gap-2 flex-1 border-teal-300 text-teal-600 hover:bg-teal-50"
                  onClick={handleParseResume}
                  disabled={isParsing || isUploading}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.resume.parsing}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {t.resume.parseWithAI}
                    </>
                  )}
                </Button>
              </div>

              {/* Parsed Results */}
              {parsedData && (
                <div className="space-y-4 animate-fade-in-up">
                  <Separator />

                  {/* Extracted Info Overview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-teal-600" />
                      {t.resume.extractedInfo}
                    </h3>

                    {/* Personal Info from Resume */}
                    {(parsedData.name || parsedData.email || parsedData.phone) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {parsedData.name && (
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 dark:border-teal-800">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.name}</p>
                            <p className="text-sm font-medium mt-0.5">{parsedData.name}</p>
                          </div>
                        )}
                        {parsedData.email && (
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 dark:border-teal-800">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.email}</p>
                            <p className="text-sm font-medium mt-0.5 truncate">{parsedData.email}</p>
                          </div>
                        )}
                        {parsedData.phone && (
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 dark:border-teal-800">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t.resume.phone}</p>
                            <p className="text-sm font-medium mt-0.5">{parsedData.phone}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extracted Skills */}
                    {parsedData.skills && parsedData.skills.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">{t.resume.extractedSkills} ({parsedData.skills.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedData.skills.map((skill, idx) => (
                            <Badge
                              key={`parsed-skill-${idx}`}
                              variant="secondary"
                              className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950 border-0"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Experience */}
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

                    {/* Extracted Education */}
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

                    {/* Extracted Certifications */}
                    {parsedData.certifications && parsedData.certifications.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">{t.resume.certifications} ({parsedData.certifications.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedData.certifications.map((cert, idx) => (
                            <Badge
                              key={`parsed-cert-${idx}`}
                              variant="outline"
                              className="text-xs border-teal-300"
                            >
                              {cert.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fill Profile Button */}
                  <div className="pt-2">
                    <Button
                      className="gap-2 bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
                      onClick={handleFillProfile}
                    >
                      <Sparkles className="h-4 w-4" />
                      {t.resume.fillProfile}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1.5">{t.resume.fillProfileDesc}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show upload progress when uploading without a file card */}
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

      {/* Profile Completeness with Animated Ring & Suggested Actions */}
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Animated Progress Ring */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
                  <circle
                    cx="50" cy="50" r="42"
                    stroke="url(#profileGrad)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - profileCompleteness / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-teal-600">{profileCompleteness}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">{t.candidate.profileCompleteness}</p>
            </div>

            {/* Suggested Actions */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-3">{t.profileComplete.completeProfile}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'photo', label: t.profileComplete.addPhoto, done: !!personalInfo.name },
                  { key: 'experience', label: t.profileComplete.addExperience, done: experiences.length > 0 },
                  { key: 'education', label: t.profileComplete.addEducation, done: educations.length > 0 },
                  { key: 'certifications', label: t.profileComplete.addCertifications, done: certifications.length > 0 },
                  { key: 'skills', label: t.profileComplete.addSkills, done: skills.length > 0 },
                  { key: 'summary', label: t.profileComplete.writeSummary, done: !!personalInfo.bio },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  {profileCompleteness === 100
                    ? t.profileComplete.motivationComplete
                    : profileCompleteness >= 75
                      ? t.profileComplete.motivationAlmost
                      : profileCompleteness >= 50
                        ? t.profileComplete.motivationHalf
                        : t.profileComplete.motivationStart}
                </p>
              </div>
            </div>

            {/* Public Profile Toggle */}
            <div className="shrink-0 sm:self-center">
              <div className="flex flex-col items-center gap-2">
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                <div className="text-center">
                  <p className="text-xs font-medium">{t.candidate.publicProfile}</p>
                  <p className="text-[10px] text-muted-foreground">{t.candidate.publicProfileDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            {t.candidate.personalInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.auth.name}</Label>
              <Input
                id="name"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.candidate.phone}</Label>
              <Input
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.candidate.location}</Label>
              <Input
                id="location"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTitle">{t.candidate.currentTitle}</Label>
              <Input
                id="currentTitle"
                value={personalInfo.currentTitle}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">{t.candidate.availability}</Label>
              <Select
                value={personalInfo.availability}
                onValueChange={(v) => setPersonalInfo({ ...personalInfo, availability: v })}
              >
                <SelectTrigger id="availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open to work</SelectItem>
                  <SelectItem value="not-looking">Not looking</SelectItem>
                  <SelectItem value="open-offers">Open to offers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">{t.candidate.linkedin}</Label>
              <Input
                id="linkedin"
                value={personalInfo.linkedin}
                onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">{t.candidate.portfolio}</Label>
              <Input
                id="portfolio"
                value={personalInfo.portfolio}
                onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">{t.candidate.bio}</Label>
              <Textarea
                id="bio"
                value={personalInfo.bio}
                onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-0 shadow-sm card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            {t.candidate.skills}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="pl-2.5 pr-1 py-1 text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-1.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t.candidate.addSkill}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="h-9 max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={addSkill} className="h-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
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

      {/* Education */}
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

      {/* Certifications */}
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
                onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
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
                onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.candidate.startDate}</Label>
                <Input
                  value={eduForm.startDate || ''}
                  onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.candidate.endDate}</Label>
                <Input
                  value={eduForm.endDate || ''}
                  onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
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
    </div>
  );
}
