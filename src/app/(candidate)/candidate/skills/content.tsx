// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Target,
  Briefcase,
  Lightbulb,
  Code2,
  Layers,
  MessageSquare,
  Trophy,
  Star,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface SkillCategory {
  name: string;
  icon: React.ElementType;
  skills: { name: string; proficiency: number; years?: number }[];
}

export default function CandidateSkillsPage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '', proficiency: 'intermediate', years: '' });
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/candidate/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.skills) {
            setProfileSkills(data.profile.skills);
          }
        }
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    programming: true,
    frameworks: true,
    soft: false,
  });

  // Build skill categories from real profile skills
  const skillCategories: SkillCategory[] = profileSkills.length > 0
    ? [
        {
          name: t.skillsAssessment.programmingLanguages,
          icon: Code2,
          skills: profileSkills.slice(0, Math.ceil(profileSkills.length / 3)).map((s) => ({
            name: s,
            proficiency: 0,
            years: 0,
          })),
        },
        {
          name: t.skillsAssessment.frameworks,
          icon: Layers,
          skills: profileSkills.slice(Math.ceil(profileSkills.length / 3), Math.ceil(profileSkills.length * 2 / 3)).map((s) => ({
            name: s,
            proficiency: 0,
            years: 0,
          })),
        },
        {
          name: t.skillsAssessment.softSkills,
          icon: MessageSquare,
          skills: profileSkills.slice(Math.ceil(profileSkills.length * 2 / 3)).map((s) => ({
            name: s,
            proficiency: 0,
          })),
        },
      ]
    : [];

  const radarSkills = profileSkills.length > 0
    ? [
        { label: t.skillsAssessment.technicalSkills, value: 0, key: 'technical' },
        { label: t.skillsAssessment.communication, value: 0, key: 'communication' },
        { label: t.skillsAssessment.leadership, value: 0, key: 'leadership' },
        { label: t.skillsAssessment.problemSolving, value: 0, key: 'problemSolving' },
        { label: t.skillsAssessment.creativity, value: 0, key: 'creativity' },
        { label: t.skillsAssessment.teamwork, value: 0, key: 'teamwork' },
      ]
    : [];

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getProficiencyColor = (value: number) => {
    if (value >= 85) return 'bg-emerald-500';
    if (value >= 70) return 'bg-slate-500';
    if (value >= 50) return 'bg-cyan-500';
    return 'bg-slate-400';
  };

  const getProficiencyLabel = (value: number) => {
    if (value >= 85) return t.skillsAssessment.expert;
    if (value >= 70) return t.skillsAssessment.advanced;
    if (value >= 50) return t.skillsAssessment.intermediate;
    return t.skillsAssessment.beginner;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-muted animate-pulse" /><div><div className="h-6 w-40 bg-muted animate-pulse rounded" /><div className="h-4 w-60 bg-muted animate-pulse rounded mt-1" /></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-64 bg-muted animate-pulse rounded-xl" /><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-blue-600 text-white">
            {t.skillsAssessment.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.skillsAssessment.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg">
              <Plus className="h-4 w-4 me-2" />
              {t.skillsAssessment.addNewSkill}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.skillsAssessment.addNewSkill}</DialogTitle>
              <DialogDescription>Add a new skill to your profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.skillsAssessment.skillName}</label>
                <Input
                  placeholder="e.g., Rust, Docker, Figma..."
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.skillsAssessment.category}</label>
                <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programming">{t.skillsAssessment.programmingLanguages}</SelectItem>
                    <SelectItem value="frameworks">{t.skillsAssessment.frameworks}</SelectItem>
                    <SelectItem value="soft">{t.skillsAssessment.softSkills}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.skillsAssessment.proficiency}</label>
                <Select value={newSkill.proficiency} onValueChange={(v) => setNewSkill({ ...newSkill, proficiency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t.skillsAssessment.beginner}</SelectItem>
                    <SelectItem value="intermediate">{t.skillsAssessment.intermediate}</SelectItem>
                    <SelectItem value="advanced">{t.skillsAssessment.advanced}</SelectItem>
                    <SelectItem value="expert">{t.skillsAssessment.expert}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.skillsAssessment.yearsOfExperience}</label>
                <Input type="number" min="0" max="30" placeholder="e.g., 3" value={newSkill.years} onChange={(e) => setNewSkill({ ...newSkill, years: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
              <Button className="bg-gradient-to-r bg-blue-600 text-white" onClick={() => setDialogOpen(false)}>{t.skillsAssessment.addSkill}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State when no skills */}
      {profileSkills.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950/50 dark:to-emerald-950/50 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-blue-500/60" />
            </div>
            <h3 className="text-lg font-semibold">No skills added yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Add your skills to see your skill profile, radar chart, and job match scores.
              You can also upload your resume to auto-detect skills.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button className="bg-gradient-to-r bg-blue-600 text-white" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 me-2" />
                Add Skills
              </Button>
              <Button variant="outline" asChild>
                <a href="/candidate/profile">Upload Resume</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Radar Chart + Skill Match */}
      {profileSkills.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">{t.skillsAssessment.radarChart}</CardTitle>
              <CardDescription>Your skill profile across 6 dimensions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {radarSkills.length >= 3 ? (
                <>
                  <svg width={260} height={260} viewBox="0 0 260 260" className="w-full max-w-[300px]">
                    {Array.from({ length: 5 }).map((_, level) => {
                      const r = ((level + 1) / 5) * 100;
                      const points = Array.from({ length: radarSkills.length })
                        .map((_, i) => {
                          const angle = (Math.PI * 2 * i) / radarSkills.length - Math.PI / 2;
                          return `${130 + r * Math.cos(angle)},${130 + r * Math.sin(angle)}`;
                        }).join(' ');
                      return <polygon key={level} points={points} fill="none" stroke="#D1D5DB" strokeOpacity="0.5" strokeWidth="1" />;
                    })}
                    {radarSkills.map((_, i) => {
                      const angle = (Math.PI * 2 * i) / radarSkills.length - Math.PI / 2;
                      return <line key={i} x1="130" y1="130" x2={130 + 100 * Math.cos(angle)} y2={130 + 100 * Math.sin(angle)} stroke="#D1D5DB" strokeOpacity="0.5" strokeWidth="1" />;
                    })}
                    <polygon
                      points={radarSkills.map((skill, i) => {
                        const angle = (Math.PI * 2 * i) / radarSkills.length - Math.PI / 2;
                        const r = (skill.value / 100) * 100;
                        return `${130 + r * Math.cos(angle)},${130 + r * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="url(#radarGradient)" fillOpacity="0.45" stroke="#14b8a6" strokeWidth="2.5"
                    />
                    {radarSkills.map((skill, i) => {
                      const angle = (Math.PI * 2 * i) / radarSkills.length - Math.PI / 2;
                      const r = (skill.value / 100) * 100;
                      const cx = 130 + r * Math.cos(angle);
                      const cy = 130 + r * Math.sin(angle);
                      const labelR = 125;
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="4.5" fill="#14b8a6" stroke="white" strokeWidth="2" />
                          <text x={130 + labelR * Math.cos(angle)} y={130 + labelR * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[11px] font-medium">{skill.label}</text>
                        </g>
                      );
                    })}
                    <defs>
                      <radialGradient id="radarGradient"><stop offset="0%" stopColor="#14b8a6" stopOpacity="0.7" /><stop offset="100%" stopColor="#059669" stopOpacity="0.3" /></radialGradient>
                    </defs>
                  </svg>
                  <div className="grid grid-cols-3 gap-3 mt-4 w-full">
                    {radarSkills.map((skill) => (
                      <div key={skill.key} className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-blue-600">{skill.value}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{skill.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-8">Add more skills to generate your radar chart</p>
              )}
            </CardContent>
          </Card>

          {/* Skill Match Score */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {t.skillsAssessment.skillMatch}
              </CardTitle>
              <CardDescription>How your skills match applied positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">Apply to jobs to see your skill match scores</p>
                <Button variant="outline" className="mt-3" asChild>
                  <a href="/candidate/jobs">Browse Jobs</a>
                </Button>
              </div>

              {/* Recommended Skills - AI placeholder */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {t.skillsAssessment.recommendedSkills}
                </h4>
                <div className="text-center py-6 rounded-lg border border-dashed border-border/50">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Configure your AI provider to generate personalized skill recommendations</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href="/candidate/ai-tools">Go to AI Tools</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skill Categories */}
      {skillCategories.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t.skillsAssessment.skillCategories}</CardTitle>
            <CardDescription>Your skills organized by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillCategories.map((category, idx) => {
              const categoryKey = ['programming', 'frameworks', 'soft'][idx];
              const isExpanded = expandedCategories[categoryKey];

              return (
                <div key={category.name} className="rounded-xl border border-border/50 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                        <category.icon className="h-5 w-5" />
                      </div>
                      <div className="text-start">
                        <h4 className="text-sm font-semibold">{category.name}</h4>
                        <p className="text-xs text-muted-foreground">{category.skills.length} skills</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {category.skills.map((skill) => (
                        <div key={skill.name} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`text-[10px] border-0 ${getProficiencyColor(skill.proficiency)} text-white`}>
                                {getProficiencyLabel(skill.proficiency)}
                              </Badge>
                              {skill.years && <span className="text-xs text-muted-foreground">{skill.years} {t.skillsAssessment.years}</span>}
                            </div>
                          </div>
                          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`absolute inset-y-0 start-0 rounded-full ${getProficiencyColor(skill.proficiency)} transition-all duration-1000`} style={{ width: `${skill.proficiency}%` }} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{t.skillsAssessment.beginner}</span>
                            <span className="text-xs font-bold text-blue-600">{skill.proficiency}%</span>
                            <span className="text-[10px] text-muted-foreground">{t.skillsAssessment.expert}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
