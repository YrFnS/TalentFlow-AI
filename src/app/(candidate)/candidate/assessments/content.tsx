'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Clock,
  CheckCircle2,
  Trophy,
  Play,
  FileQuestion,
  Timer,
  Zap,
  MessageSquare,
  Code2,
  BarChart3,
  Filter,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type AssessmentCategory = 'Technical' | 'Soft Skills' | 'Design' | 'Domain';

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  difficulty: Difficulty;
  duration: number; // minutes
  questionCount: number;
  icon: React.ElementType;
  gradient: string;
}

interface CompletedAssessment {
  id: string;
  title: string;
  score: number;
  percentile: number;
  date: string;
  category: AssessmentCategory;
}

const difficultyColors: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  Advanced: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
};

const categoryColors: Record<AssessmentCategory, string> = {
  Technical: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  'Soft Skills': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  Design: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400 border-0',
  Domain: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
};



// Skill Radar SVG Chart
function SkillRadar({ skills }: { skills: { label: string; value: number }[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 85;
  const levels = 5;

  const angleStep = (2 * Math.PI) / skills.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPoints = skills.map((s, i) => getPoint(i, s.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto">
      {/* Grid levels */}
      {Array.from({ length: levels }).map((_, level) => {
        const r = ((level + 1) / levels) * maxRadius;
        const points = skills.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={0.8}
          />
        );
      })}

      {/* Axis lines */}
      {skills.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxRadius * Math.cos(angle)}
            y2={cy + maxRadius * Math.sin(angle)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={0.8}
          />
        );
      })}

      {/* Data area */}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="#14b8a6"
        fillOpacity={0.15}
        stroke="#14b8a6"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="#14b8a6"
          stroke="white"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = maxRadius + 20;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[9px] font-medium"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

const skillDimensions: { label: string; value: number }[] = [];

export default function AssessmentsContent() {
  const { t } = useI18n();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [filterCategory, setFilterCategory] = useState<AssessmentCategory | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assessRes, completedRes] = await Promise.all([
          fetch('/api/candidate/assessments'),
          fetch('/api/candidate/assessments/completed'),
        ]);
        if (assessRes.ok) {
          const data = await assessRes.json();
          setAssessments(data);
        }
        if (completedRes.ok) {
          const data = await completedRes.json();
          setCompletedAssessments(data);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchData();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && a.difficulty !== filterDifficulty) return false;
    return true;
  });

  const completedCount = completedAssessments.length;
  const avgScore = completedAssessments.length > 0
    ? Math.round(completedAssessments.reduce((sum, a) => sum + a.score, 0) / completedAssessments.length)
    : 0;
  const topPercentile = completedAssessments.length > 0
    ? Math.max(...completedAssessments.map(a => a.percentile))
    : 0;

  const openStartDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.assessments.title}</h1>
            <p className="text-sm text-muted-foreground">{t.assessments.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <FileQuestion className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.assessments.available}</p>
                <p className="text-xl font-bold">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.assessments.completed}</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.assessments.avgScore}</p>
                <p className="text-xl font-bold">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-700 opacity-[0.06]" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.assessments.topPercentile}</p>
                <p className="text-xl font-bold">{topPercentile}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Radar Chart */}
      {skillDimensions.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              {t.assessments.skillRadar}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <SkillRadar skills={skillDimensions} />
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full">
                {skillDimensions.map((s) => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-muted/20 border border-border/30">
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-400">{s.value}%</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">{t.assessments.completedAssessments}</p>
            <p className="mt-1 text-xs text-muted-foreground">Complete an assessment to see your skill radar chart.</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as AssessmentCategory | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.assessments.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.assessments.allCategories}</SelectItem>
            <SelectItem value="Technical">{t.assessments.catTechnical}</SelectItem>
            <SelectItem value="Soft Skills">{t.assessments.catSoftSkills}</SelectItem>
            <SelectItem value="Design">{t.assessments.catDesign}</SelectItem>
            <SelectItem value="Domain">{t.assessments.catDomain}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v as Difficulty | 'all')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t.assessments.filterDifficulty} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.assessments.allDifficulties}</SelectItem>
            <SelectItem value="Beginner">{t.assessments.diffBeginner}</SelectItem>
            <SelectItem value="Intermediate">{t.assessments.diffIntermediate}</SelectItem>
            <SelectItem value="Advanced">{t.assessments.diffAdvanced}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Available Assessments Grid */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <FileQuestion className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          {t.assessments.availableAssessments}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAssessments.length === 0 ? (
            <Card className="border-dashed border-border/50 col-span-full">
              <CardContent className="p-12 text-center">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">{t.assessments.noAssessments}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back later for available assessments</p>
              </CardContent>
            </Card>
          ) : (
            filteredAssessments.map((assessment) => {
              const AssessmentIcon = assessment.icon;
              const isCompleted = completedAssessments.some(c => c.title === assessment.title);
              return (
                <Card key={assessment.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-md transition-shadow">
                  <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center relative', assessment.gradient)}>
                    <AssessmentIcon className="h-8 w-8 text-white/30" />
                    <div className="absolute top-2 start-2 flex gap-1">
                      <Badge className={cn('text-[9px]', difficultyColors[assessment.difficulty])}>
                        {assessment.difficulty}
                      </Badge>
                    </div>
                    <div className="absolute top-2 end-2">
                      <Badge className={cn('text-[9px]', categoryColors[assessment.category])}>
                        {assessment.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold">{assessment.title}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{assessment.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.duration} {t.assessments.minutes}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileQuestion className="h-3 w-3" />
                        {assessment.questionCount} {t.assessments.questions}
                      </span>
                    </div>
                    <Button
                      className={cn(
                        'w-full h-8 text-xs gap-1.5',
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700'
                      )}
                      onClick={() => openStartDialog(assessment)}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t.assessments.retake}
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          {t.assessments.startAssessment}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Assessments */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t.assessments.completedAssessments}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {completedAssessments.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No completed assessments yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Start an assessment above to see your results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.assessments.assessmentTitle}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.assessments.category}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.assessments.score}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.assessments.percentile}</th>
                    <th className="text-start text-xs font-medium text-muted-foreground p-3">{t.assessments.completedDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {completedAssessments.map((result) => (
                    <tr key={result.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <span className="text-sm font-medium">{result.title}</span>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('text-[10px]', categoryColors[result.category])}>
                          {result.category}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                result.score >= 90 ? 'bg-emerald-500' : result.score >= 70 ? 'bg-teal-500' : 'bg-amber-500'
                              )}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                          <span className={cn(
                            'text-sm font-medium',
                            result.score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : result.score >= 70 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'
                          )}>
                            {result.score}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-sm font-medium">{result.percentile}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">{result.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Assessment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.assessments.startAssessment}</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4 py-2">
              <div className={cn('h-24 rounded-xl bg-gradient-to-br flex items-center justify-center relative', selectedAssessment.gradient)}>
                <selectedAssessment.icon className="h-10 w-10 text-white/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{selectedAssessment.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedAssessment.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                  <Timer className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-sm font-bold">{selectedAssessment.duration} {t.assessments.minutes}</p>
                  <p className="text-[10px] text-muted-foreground">{t.assessments.timeLimit}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                  <FileQuestion className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-sm font-bold">{selectedAssessment.questionCount}</p>
                  <p className="text-[10px] text-muted-foreground">{t.assessments.questions}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                  <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-sm font-bold">{selectedAssessment.difficulty}</p>
                  <p className="text-[10px] text-muted-foreground">{t.assessments.difficulty}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{t.assessments.instructions}</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.assessments.instruction1}</li>
                  <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.assessments.instruction2}</li>
                  <li className="text-[10px] text-amber-600 dark:text-amber-500">• {t.assessments.instruction3}</li>
                </ul>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 gap-1.5">
              <Play className="h-4 w-4" />
              {t.assessments.beginAssessment}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
