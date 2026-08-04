'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileHeader from './components/ProfileHeader';
import ResumeUploadCard from './components/ResumeUploadCard';
import ProfileCompletenessCard from './components/ProfileCompletenessCard';
import PersonalInfoCard, {
  type PersonalInfo,
} from './components/PersonalInfoCard';
import SkillsCard from './components/SkillsCard';
import ExperienceCard from './components/ExperienceCard';
import EducationCard from './components/EducationCard';
import CertificationCard from './components/CertificationCard';

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

interface ProfilePayload {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  profile: {
    id: string | null;
    phone: string;
    location: string;
    bio: string;
    currentTitle: string;
    linkedin: string;
    portfolio: string;
    availability: string;
    expectedSalary: string;
    isPublic: boolean;
    publicSlug: string | null;
    skills: string[];
    experienceYears: number | null;
    hasStoredResume: boolean;
    updatedAt: string | null;
  };
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
}

interface ProfileSnapshot {
  personalInfo: PersonalInfo;
  isPublic: boolean;
  skills: string[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
}

const EMPTY_PERSONAL_INFO: PersonalInfo = {
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
};

function localId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ProfilePage() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    EMPTY_PERSONAL_INFO,
  );
  const [isPublic, setIsPublic] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [hasStoredResume, setHasStoredResume] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [eduDialogOpen, setEduDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);
  const [expForm, setExpForm] = useState<Partial<ExperienceItem>>({});
  const [eduForm, setEduForm] = useState<Partial<EducationItem>>({});
  const [certForm, setCertForm] = useState<Partial<CertificationItem>>({});

  const savingRef = useRef(false);
  const revisionRef = useRef(0);

  const markDirty = useCallback(() => {
    revisionRef.current += 1;
    setDirty(true);
  }, []);

  const applyPayload = useCallback((payload: ProfilePayload) => {
    setPersonalInfo({
      name: payload.user.name || '',
      email: payload.user.email || '',
      phone: payload.profile.phone || '',
      location: payload.profile.location || '',
      bio: payload.profile.bio || '',
      currentTitle: payload.profile.currentTitle || '',
      linkedin: payload.profile.linkedin || '',
      portfolio: payload.profile.portfolio || '',
      availability: payload.profile.availability || 'open',
      expectedSalary: payload.profile.expectedSalary || '',
    });
    setIsPublic(payload.profile.isPublic);
    setSkills(Array.isArray(payload.profile.skills) ? payload.profile.skills : []);
    setExperiences(payload.experiences || []);
    setEducations(payload.educations || []);
    setCertifications(payload.certifications || []);
    setHasStoredResume(payload.profile.hasStoredResume);
    setLastSavedAt(
      payload.profile.updatedAt ? new Date(payload.profile.updatedAt) : null,
    );
  }, []);

  const loadProfile = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/candidate/profile', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Unable to load profile'),
          );
        }

        const payload = (await response.json()) as ProfilePayload;
        applyPayload(payload);
        revisionRef.current = 0;
        setDirty(false);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load profile');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyPayload],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const persistProfile = useCallback(
    async (
      overrides: Partial<ProfileSnapshot> = {},
      successMessage = 'Profile saved',
    ): Promise<boolean> => {
      if (savingRef.current) {
        toast.info('A profile save is already in progress');
        return false;
      }

      const snapshot: ProfileSnapshot = {
        personalInfo: overrides.personalInfo || personalInfo,
        isPublic: overrides.isPublic ?? isPublic,
        skills: overrides.skills || skills,
        experiences: overrides.experiences || experiences,
        educations: overrides.educations || educations,
        certifications: overrides.certifications || certifications,
      };
      const revisionAtStart = revisionRef.current;

      savingRef.current = true;
      setSaving(true);
      setError('');

      try {
        const response = await apiFetch('/api/candidate/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Unable to save profile'),
          );
        }

        const payload = (await response.json()) as ProfilePayload;
        if (revisionRef.current === revisionAtStart) {
          applyPayload(payload);
          setDirty(false);
        } else {
          setLastSavedAt(new Date());
          setDirty(true);
          toast.info('Saved, but newer edits still need to be saved');
        }
        toast.success(successMessage);
        return true;
      } catch (reason) {
        const message =
          reason instanceof Error ? reason.message : 'Unable to save profile';
        setError(message);
        setDirty(true);
        toast.error(message);
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [
      applyPayload,
      certifications,
      educations,
      experiences,
      isPublic,
      personalInfo,
      skills,
    ],
  );

  const updatePersonalInfo: Dispatch<SetStateAction<PersonalInfo>> = useCallback(
    (value) => {
      setPersonalInfo((current) =>
        typeof value === 'function' ? value(current) : value,
      );
      markDirty();
    },
    [markDirty],
  );

  const updateVisibility = useCallback(
    (value: boolean) => {
      setIsPublic(value);
      markDirty();
      void persistProfile({ isPublic: value }, 'Profile visibility updated');
    },
    [markDirty, persistProfile],
  );

  const addSkill = useCallback(() => {
    const normalized = newSkill.trim();
    if (!normalized) return;
    if (
      skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())
    ) {
      toast.info('This skill is already listed');
      return;
    }
    if (skills.length >= 100) {
      toast.error('A profile can contain up to 100 skills');
      return;
    }

    const next = [...skills, normalized];
    setSkills(next);
    setNewSkill('');
    markDirty();
    void persistProfile({ skills: next }, 'Skill added');
  }, [markDirty, newSkill, persistProfile, skills]);

  const removeSkill = useCallback(
    (skill: string) => {
      const next = skills.filter((item) => item !== skill);
      setSkills(next);
      markDirty();
      void persistProfile({ skills: next }, 'Skill removed');
    },
    [markDirty, persistProfile, skills],
  );

  const openExpDialog = (experience?: ExperienceItem) => {
    if (experience) {
      setEditingExp(experience);
      setExpForm(experience);
    } else {
      setEditingExp(null);
      setExpForm({
        title: '',
        company: '',
        description: '',
        startDate: '',
        endDate: '',
        current: false,
      });
    }
    setExpDialogOpen(true);
  };

  const saveExp = () => {
    const title = expForm.title?.trim() || '';
    const company = expForm.company?.trim() || '';
    const startDate = expForm.startDate?.trim() || '';
    if (!title || !company || !startDate) {
      toast.error('Title, company, and start date are required');
      return;
    }

    const item: ExperienceItem = {
      id: editingExp?.id || localId('experience'),
      title,
      company,
      description: expForm.description?.trim() || '',
      startDate,
      endDate: expForm.current ? '' : expForm.endDate?.trim() || '',
      current: Boolean(expForm.current),
    };
    const next = editingExp
      ? experiences.map((experience) =>
          experience.id === editingExp.id ? item : experience,
        )
      : [...experiences, item];

    setExperiences(next);
    setExpDialogOpen(false);
    markDirty();
    void persistProfile(
      { experiences: next },
      editingExp ? 'Experience updated' : 'Experience added',
    );
  };

  const deleteExp = (id: string) => {
    if (!window.confirm('Delete this experience entry?')) return;
    const next = experiences.filter((experience) => experience.id !== id);
    setExperiences(next);
    markDirty();
    void persistProfile({ experiences: next }, 'Experience deleted');
  };

  const openEduDialog = (education?: EducationItem) => {
    if (education) {
      setEditingEdu(education);
      setEduForm(education);
    } else {
      setEditingEdu(null);
      setEduForm({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
      });
    }
    setEduDialogOpen(true);
  };

  const saveEdu = () => {
    const institution = eduForm.institution?.trim() || '';
    const degree = eduForm.degree?.trim() || '';
    const startDate = eduForm.startDate?.trim() || '';
    if (!institution || !degree || !startDate) {
      toast.error('Institution, degree, and start date are required');
      return;
    }

    const item: EducationItem = {
      id: editingEdu?.id || localId('education'),
      institution,
      degree,
      field: eduForm.field?.trim() || '',
      startDate,
      endDate: eduForm.endDate?.trim() || '',
    };
    const next = editingEdu
      ? educations.map((education) =>
          education.id === editingEdu.id ? item : education,
        )
      : [...educations, item];

    setEducations(next);
    setEduDialogOpen(false);
    markDirty();
    void persistProfile(
      { educations: next },
      editingEdu ? 'Education updated' : 'Education added',
    );
  };

  const deleteEdu = (id: string) => {
    if (!window.confirm('Delete this education entry?')) return;
    const next = educations.filter((education) => education.id !== id);
    setEducations(next);
    markDirty();
    void persistProfile({ educations: next }, 'Education deleted');
  };

  const openCertDialog = (certification?: CertificationItem) => {
    if (certification) {
      setEditingCert(certification);
      setCertForm(certification);
    } else {
      setEditingCert(null);
      setCertForm({ name: '', issuer: '', date: '' });
    }
    setCertDialogOpen(true);
  };

  const saveCert = () => {
    const name = certForm.name?.trim() || '';
    if (!name) {
      toast.error('Certification name is required');
      return;
    }

    const item: CertificationItem = {
      id: editingCert?.id || localId('certification'),
      name,
      issuer: certForm.issuer?.trim() || '',
      date: certForm.date?.trim() || '',
    };
    const next = editingCert
      ? certifications.map((certification) =>
          certification.id === editingCert.id ? item : certification,
        )
      : [...certifications, item];

    setCertifications(next);
    setCertDialogOpen(false);
    markDirty();
    void persistProfile(
      { certifications: next },
      editingCert ? 'Certification updated' : 'Certification added',
    );
  };

  const deleteCert = (id: string) => {
    if (!window.confirm('Delete this certification?')) return;
    const next = certifications.filter(
      (certification) => certification.id !== id,
    );
    setCertifications(next);
    markDirty();
    void persistProfile({ certifications: next }, 'Certification deleted');
  };

  const completenessItems = [
    Boolean(personalInfo.name && personalInfo.phone && personalInfo.location),
    Boolean(personalInfo.bio),
    skills.length > 0,
    experiences.length > 0,
    educations.length > 0,
    certifications.length > 0,
    hasStoredResume,
  ];
  const profileCompleteness = Math.round(
    (completenessItems.filter(Boolean).length / completenessItems.length) * 100,
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
        <Skeleton className="h-44" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
      <ProfileHeader
        onSave={() => void persistProfile()}
        saving={saving}
        dirty={dirty}
        lastSavedAt={lastSavedAt}
      />

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadProfile(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="me-2 h-4 w-4" />
              )}
              Reload saved profile
            </Button>
          </CardContent>
        </Card>
      )}

      <ResumeUploadCard hasStoredResume={hasStoredResume} />

      <ProfileCompletenessCard
        profileCompleteness={profileCompleteness}
        personalInfo={personalInfo}
        experiencesLength={experiences.length}
        educationsLength={educations.length}
        skillsLength={skills.length}
        certificationsLength={certifications.length}
        hasStoredResume={hasStoredResume}
        isPublic={isPublic}
        setIsPublic={updateVisibility}
      />

      <PersonalInfoCard
        personalInfo={personalInfo}
        setPersonalInfo={updatePersonalInfo}
      />

      <SkillsCard
        skills={skills}
        newSkill={newSkill}
        setNewSkill={setNewSkill}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <ExperienceCard
        experiences={experiences}
        expDialogOpen={expDialogOpen}
        setExpDialogOpen={setExpDialogOpen}
        editingExp={editingExp}
        expForm={expForm}
        setExpForm={setExpForm}
        openExpDialog={openExpDialog}
        saveExp={saveExp}
        deleteExp={deleteExp}
      />

      <EducationCard
        educations={educations}
        eduDialogOpen={eduDialogOpen}
        setEduDialogOpen={setEduDialogOpen}
        editingEdu={editingEdu}
        eduForm={eduForm}
        setEduForm={setEduForm}
        openEduDialog={openEduDialog}
        saveEdu={saveEdu}
        deleteEdu={deleteEdu}
      />

      <CertificationCard
        certifications={certifications}
        certDialogOpen={certDialogOpen}
        setCertDialogOpen={setCertDialogOpen}
        editingCert={editingCert}
        certForm={certForm}
        setCertForm={setCertForm}
        openCertDialog={openCertDialog}
        saveCert={saveCert}
        deleteCert={deleteCert}
      />
    </div>
  );
}
