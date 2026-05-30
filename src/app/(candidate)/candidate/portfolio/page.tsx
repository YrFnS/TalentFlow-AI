// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  FolderOpen,
  Plus,
  Eye,
  Heart,
  ExternalLink,
  Github,
  Globe,
  Code2,
  Lock,
  Upload,
  Filter,
  Star,
  Layers,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ProjectStatus = 'Active' | 'Completed' | 'Archived';
type Visibility = 'Public' | 'Private';

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  githubUrl: string;
  date: string;
  views: number;
  likes: number;
  status: ProjectStatus;
  visibility: Visibility;
  featured: boolean;
  gradient: string;
  icon: React.ElementType;
}

const techColors: Record<string, string> = {
  'React': 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400 border-0',
  'Next.js': 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0',
  'TypeScript': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0',
  'Node.js': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  'Python': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  'Tailwind CSS': 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  'PostgreSQL': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border-0',
  'MongoDB': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-0',
  'GraphQL': 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400 border-0',
  'Docker': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0',
  'AWS': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-0',
  'Redis': 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-0',
  'Prisma': 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-0',
  'Vue.js': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  'Django': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-0',
  'TensorFlow': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-0',
  'Figma': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-0',
  'Rust': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0',
  'Go': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-0',
  'Kubernetes': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-0',
};

const statusColors: Record<ProjectStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0',
  Completed: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0',
  Archived: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0',
};

const gradients = [
  'from-teal-500 to-emerald-600',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-violet-600',
  'from-green-500 to-emerald-600',
  'from-sky-500 to-blue-600',
];



const allStatuses: ProjectStatus[] = ['Active', 'Completed', 'Archived'];
const allVisibilities: Visibility[] = ['Public', 'Private'];

export default function PortfolioPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterTech, setFilterTech] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [filterVisibility, setFilterVisibility] = useState<Visibility | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTechTag, setNewTechTag] = useState('');
  const [newTechTags, setNewTechTags] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/candidate/portfolio');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchProjects();
  }, []);

  // Get all unique techs
  const allTechs = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach(p => p.techStack.forEach(t => techSet.add(t)));
    return Array.from(techSet).sort();
  }, [projects]);

  // Skills frequency map for tag cloud
  const skillFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    projects.forEach(p => p.techStack.forEach(t => {
      freq[t] = (freq[t] || 0) + 1;
    }));
    return freq;
  }, [projects]);

  const filteredProjects = projects.filter((p) => {
    if (filterTech !== 'all' && !p.techStack.includes(filterTech)) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterVisibility !== 'all' && p.visibility !== filterVisibility) return false;
    if (featuredOnly && !p.featured) return false;
    return true;
  });

  const featuredProjects = filteredProjects.filter(p => p.featured);
  const otherProjects = filteredProjects.filter(p => !p.featured);

  const totalProjects = projects.length;
  const publicCount = projects.filter(p => p.visibility === 'Public').length;
  const featuredCount = projects.filter(p => p.featured).length;
  const totalViews = projects.reduce((sum, p) => sum + p.views, 0);

  const addTechTag = () => {
    if (newTechTag.trim() && !newTechTags.includes(newTechTag.trim())) {
      setNewTechTags([...newTechTags, newTechTag.trim()]);
      setNewTechTag('');
    }
  };

  const removeTechTag = (tag: string) => {
    setNewTechTags(newTechTags.filter(t => t !== tag));
  };

  const getTechColor = (tech: string) => techColors[tech] || 'bg-muted text-muted-foreground border-0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight heading-glow">{t.portfolio.title}</h1>
            <p className="text-sm text-muted-foreground">{t.portfolio.subtitle}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 me-2" />
              {t.portfolio.addProject}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.portfolio.addProject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.portfolio.projectTitle}</label>
                <Input placeholder={t.portfolio.projectTitlePlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.portfolio.projectDescription}</label>
                <Input placeholder={t.portfolio.projectDescPlaceholder} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.portfolio.techStack}</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t.portfolio.addTechTag}
                    value={newTechTag}
                    onChange={(e) => setNewTechTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechTag())}
                  />
                  <Button variant="outline" size="sm" onClick={addTechTag} className="shrink-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {newTechTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newTechTags.map(tag => (
                      <Badge key={tag} className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-0 gap-1">
                        {tag}
                        <button onClick={() => removeTechTag(tag)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.portfolio.liveUrl}</label>
                  <Input placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.portfolio.githubUrl}</label>
                  <Input placeholder="https://github.com/..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.portfolio.screenshot}</label>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border/50 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">{t.portfolio.dragDrop}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.portfolio.visibility}</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t.portfolio.selectVisibility} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">{t.portfolio.public}</SelectItem>
                      <SelectItem value="Private">{t.portfolio.private}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.portfolio.featured}</label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 gap-2"
                    onClick={() => {}}
                  >
                    <Star className={cn('h-4 w-4', false ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground')} />
                    {t.portfolio.toggleFeatured}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.common.cancel}</Button>
              </DialogClose>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700">
                {t.common.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.portfolio.totalProjects}</p>
                <p className="text-xl font-bold">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.portfolio.publicProjects}</p>
                <p className="text-xl font-bold">{publicCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.portfolio.featuredProjects}</p>
                <p className="text-xl font-bold">{featuredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 stat-card-shine card-click-ripple">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.portfolio.totalViews}</p>
                <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            {t.portfolio.featuredSection}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProjects.map((project) => {
              const ProjectIcon = project.icon;
              return (
                <Card key={project.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Gradient Thumbnail */}
                  <div className={cn('h-32 bg-gradient-to-br flex items-center justify-center relative', project.gradient)}>
                    <ProjectIcon className="h-12 w-12 text-white/30" />
                    <div className="absolute top-3 start-3">
                      <Badge className="text-[10px] bg-white/20 text-white border-0 backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5 me-0.5 fill-amber-300 text-amber-300" />
                        {t.portfolio.featured}
                      </Badge>
                    </div>
                    <div className="absolute top-3 end-3">
                      <Badge className={cn('text-[10px]', statusColors[project.status])}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold">{project.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map(tech => (
                        <Badge key={tech} className={cn('text-[9px]', getTechColor(tech))}>
                          {tech}
                        </Badge>
                      ))}
                      {project.techStack.length > 3 && (
                        <Badge className="text-[9px] bg-muted text-muted-foreground border-0">
                          +{project.techStack.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        {project.liveUrl && (
                          <a href={project.liveUrl} className="text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors" title="Live Demo">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a href={project.githubUrl} className="text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors" title="GitHub">
                            <Github className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <span className="text-[10px] text-muted-foreground">{project.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{project.views}</span>
                        <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{project.likes}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterTech} onValueChange={setFilterTech}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder={t.portfolio.filterTech} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.portfolio.allTech}</SelectItem>
            {allTechs.map(tech => <SelectItem key={tech} value={tech}>{tech}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ProjectStatus | 'all')}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder={t.portfolio.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.portfolio.allStatuses}</SelectItem>
            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterVisibility} onValueChange={(v) => setFilterVisibility(v as Visibility | 'all')}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder={t.portfolio.filterVisibility} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.portfolio.allVisibilities}</SelectItem>
            {allVisibilities.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant={featuredOnly ? 'default' : 'outline'}
          size="sm"
          className={cn('h-8 text-xs gap-1.5 shrink-0', featuredOnly && 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 border-0')}
          onClick={() => setFeaturedOnly(!featuredOnly)}
        >
          <Star className="h-3.5 w-3.5" />
          {t.portfolio.featuredOnly}
        </Button>
      </div>

      {/* All Projects Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          {t.portfolio.allProjects}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherProjects.map((project) => {
            const ProjectIcon = project.icon;
            return (
              <Card key={project.id} className="border-border/50 gradient-border-start overflow-hidden hover:shadow-md transition-shadow">
                {/* Mini Thumbnail */}
                <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center relative', project.gradient)}>
                  <ProjectIcon className="h-8 w-8 text-white/25" />
                  <div className="absolute top-2 end-2 flex items-center gap-1">
                    {project.visibility === 'Private' && (
                      <Lock className="h-3 w-3 text-white/60" />
                    )}
                    <Badge className={cn('text-[9px]', statusColors[project.status])}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <h4 className="text-xs font-semibold truncate">{project.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    {project.techStack.slice(0, 2).map(tech => (
                      <Badge key={tech} className={cn('text-[8px]', getTechColor(tech))}>
                        {tech}
                      </Badge>
                    ))}
                    {project.techStack.length > 2 && (
                      <Badge className="text-[8px] bg-muted text-muted-foreground border-0">
                        +{project.techStack.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{project.views}</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{project.likes}</span>
                    </div>
                    <span>{project.date}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {otherProjects.length === 0 && featuredProjects.length === 0 && (
            <Card className="border-dashed border-border/50 col-span-full">
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t.portfolio.noProjects}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Skills Showcase */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.portfolio.skillsShowcase}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-3 p-4">
            {Object.entries(skillFrequency)
              .sort(([, a], [, b]) => b - a)
              .map(([skill, count]) => {
                const maxCount = Math.max(...Object.values(skillFrequency));
                const ratio = count / maxCount;
                const size = 0.75 + ratio * 0.75; // font size in rem
                return (
                  <button
                    key={skill}
                    onClick={() => setFilterTech(filterTech === skill ? 'all' : skill)}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all hover:shadow-md cursor-pointer',
                      filterTech === skill
                        ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50'
                        : 'border-border/50 bg-muted/20 hover:border-teal-200 dark:hover:border-teal-800',
                    )}
                    style={{ fontSize: `${size}rem` }}
                  >
                    <span className={cn(
                      'font-medium',
                      filterTech === skill ? 'text-teal-700 dark:text-teal-400' : 'text-foreground/80',
                    )}>
                      {skill}
                    </span>
                    <span className="text-[10px] text-muted-foreground">({count})</span>
                  </button>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
