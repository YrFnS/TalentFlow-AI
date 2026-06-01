// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Play,
  Code,
  Palette,
  Server,
  BarChart3,
  Cpu,
  Shield,
  Filter,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type CourseStatus = 'not-started' | 'in-progress' | 'completed';

interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  difficulty: Difficulty;
  category: string;
  progress: number;
  status: CourseStatus;
  icon: React.ElementType;
  gradient: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  coursesCount: number;
  totalHours: number;
  progress: number;
  courses: { title: string; completed: boolean }[];
}

const difficultyConfig: Record<Difficulty, { color: string }> = {
  Beginner: { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-0' },
  Intermediate: { color: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0' },
  Advanced: { color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0' },
};

const statusBtnConfig: Record<CourseStatus, { label: string; variant: 'default' | 'outline'; color: string }> = {
  'not-started': { label: 'Start', variant: 'default', color: 'bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700' },
  'in-progress': { label: 'Continue', variant: 'default', color: 'bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700' },
  'completed': { label: 'Completed', variant: 'outline', color: '' },
};



export default function LearningPage() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<{ id: string; title: string; match: number; difficulty: Difficulty; provider: string }[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function fetchLearningData() {
      try {
        const res = await fetch('/api/candidate/learning');
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          setLearningPaths(data.learningPaths || []);
          setRecommendedCourses(data.recommended || []);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchLearningData();
  }, []);

  const coursesEnrolled = courses.filter(c => c.status !== 'not-started').length;
  const coursesCompleted = courses.filter(c => c.status === 'completed').length;
  const hoursLearned = 0;
  const certificatesEarned = 0;

  const filteredCourses = courses.filter(c => {
    const diffMatch = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const catMatch = categoryFilter === 'all' || c.category === categoryFilter;
    return diffMatch && statusMatch && catMatch;
  });

  const categories = [...new Set(courses.map(c => c.category))];

  const renderProgressRing = (progress: number, size: number = 48) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`pathGrad-${progress}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(20, 184, 166)" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="4" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={`url(#pathGrad-${progress})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold">{progress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight ">{t.learning.title}</h1>
            <p className="text-sm text-muted-foreground">{t.learning.subtitle}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          {t.learning.browseCourses}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.learning.coursesEnrolled}</p>
                <p className="text-xl font-bold">{coursesEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.learning.completed}</p>
                <p className="text-xl font-bold">{coursesCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.learning.hoursLearned}</p>
                <p className="text-xl font-bold">{hoursLearned}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.learning.certificatesEarned}</p>
                <p className="text-xl font-bold">{certificatesEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {t.learning.featuredCourses}
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder={t.learning.filterDifficulty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.learning.allDifficulties}</SelectItem>
                <SelectItem value="Beginner">{t.learning.beginner}</SelectItem>
                <SelectItem value="Intermediate">{t.learning.intermediate}</SelectItem>
                <SelectItem value="Advanced">{t.learning.advanced}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder={t.learning.filterStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.learning.allStatuses}</SelectItem>
                <SelectItem value="not-started">{t.learning.notStarted}</SelectItem>
                <SelectItem value="in-progress">{t.learning.inProgress}</SelectItem>
                <SelectItem value="completed">{t.learning.completedStatus}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder={t.learning.filterCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.learning.allCategories}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCourses.length === 0 ? (
            <Card className="border-dashed border-border/50 col-span-full">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No courses found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Browse available courses and start learning</p>
              </CardContent>
            </Card>
          ) : (
            filteredCourses.slice(0, 4).map((course) => {
              const CourseIcon = course.icon;
              const diffCfg = difficultyConfig[course.difficulty];
              const btnCfg = statusBtnConfig[course.status];
              return (
                <Card key={course.id} className="border-border/50 overflow-hidden group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center', course.gradient)}>
                    <CourseIcon className="h-8 w-8 text-white/80" />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.provider}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-[10px]', diffCfg.color)}>{course.difficulty}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    </div>
                    {course.status !== 'not-started' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{t.learning.progress}</span>
                          <span className="text-[10px] font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={btnCfg.variant}
                      className={cn('w-full h-8 text-xs', btnCfg.color)}
                      disabled={course.status === 'completed'}
                    >
                      {course.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                          {btnCfg.label}
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 me-1" />
                          {btnCfg.label}
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

      {/* My Learning Paths */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          {t.learning.myLearningPaths}
        </h2>
        {learningPaths.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No learning paths yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Start a learning path to guide your skill development</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningPaths.map((path) => (
              <Card key={path.id} className="border-border/50 hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    {renderProgressRing(path.progress, 52)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{path.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {path.coursesCount} {t.learning.courses}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {path.totalHours}h
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {path.courses.map((course, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {course.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-border/50 shrink-0" />
                        )}
                        <span className={cn(course.completed ? 'text-foreground' : 'text-muted-foreground')}>{course.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommended for You */}
      {recommendedCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {t.learning.recommendedForYou}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedCourses.map((course) => {
              const diffCfg = difficultyConfig[course.difficulty];
              return (
                <Card key={course.id} className="border-border/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="text-[10px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 gap-1">
                        <Sparkles className="h-3 w-3" />
                        {course.match}% {t.learning.match}
                      </Badge>
                      <Badge className={cn('text-[10px]', diffCfg.color)}>{course.difficulty}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.provider}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1 hover:bg-slate-50 hover:text-blue-700 dark:hover:text-blue-400 hover:border-slate-200 dark:hover:border-teal-800">
                      {t.learning.startCourse}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
