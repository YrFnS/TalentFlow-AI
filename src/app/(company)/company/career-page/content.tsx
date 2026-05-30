'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { cn, getInitials } from '@/lib/utils';
import {
  Globe,
  Paintbrush,
  ImagePlus,
  Link2,
  Search,
  Eye,
  Upload,
  Copy,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Check,
  Sparkles,
  Building2,
  Type,
  FileText,
  Share2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CareerPageConfig {
  tagline: string;
  primaryColor: string;
  heroImageUrl: string | null;
  values: string[];
  benefits: string[];
  cultureText: string;
  socialLinks: { linkedin: string; twitter: string; github: string };
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
}

const colorPresets = [
  { name: 'Teal', value: 'teal', gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-500' },
  { name: 'Emerald', value: 'emerald', gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500' },
  { name: 'Green', value: 'green', gradient: 'from-green-500 to-lime-600', bg: 'bg-green-500' },
  { name: 'Cyan', value: 'cyan', gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-500' },
];

export default function CareerPageSettingsContent() {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<CareerPageConfig>({
    tagline: '',
    primaryColor: 'teal',
    heroImageUrl: null,
    values: [],
    benefits: [],
    cultureText: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
    },
    isPublished: false,
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: null,
  });

  const [newValue, setNewValue] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [isHeroDragOver, setIsHeroDragOver] = useState(false);

  const companySlug = '';
  const careerPageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/careers/${companySlug}`;

  const selectedColorPreset = colorPresets.find((c) => c.value === config.primaryColor) || colorPresets[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setLastSaved(new Date().toLocaleTimeString());
      toast.success(t.careerPage.saveChanges + ' ✓');
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(careerPageUrl);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const addValue = () => {
    if (newValue.trim()) {
      setConfig({ ...config, values: [...config.values, newValue.trim()] });
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setConfig({ ...config, values: config.values.filter((_, i) => i !== index) });
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setConfig({ ...config, benefits: [...config.benefits, newBenefit.trim()] });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setConfig({ ...config, benefits: config.benefits.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.careerPage.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.careerPage.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            'px-3 py-1 text-sm font-medium border-0',
            config.isPublished
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          )}>
            {config.isPublished ? t.careerPage.published : t.careerPage.draft}
          </Badge>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">{t.careerPage.lastSaved}: {lastSaved}</span>
          )}
        </div>
      </div>

      {/* Preview + Edit Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: Live Preview */}
        <div className="xl:col-span-2 order-2 xl:order-1">
          <Card className="sticky top-20 border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Live Preview
                </CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                  <a href={`/careers/${companySlug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 me-1" />
                    {t.careerPage.previewPage}
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Scaled-down preview */}
              <div className="origin-top scale-[0.55] w-[182%] -mb-[40%] rounded-lg border border-border/50 overflow-hidden bg-background shadow-sm">
                {/* Mini hero */}
                <div className={cn('py-8 px-4 text-center relative', selectedColorPreset.bg, 'bg-opacity-10')}>
                  <div className={cn('inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br text-white mb-2', selectedColorPreset.gradient)}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold gradient-text">{t.careerPage.joinTeam}</h3>
                  <p className="text-[9px] text-muted-foreground mt-1">{config.tagline}</p>
                  {/* Mini stats */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3 max-w-xs mx-auto">
                    {['0', '0', '0', ''].map((v, i) => (
                      <div key={i} className="bg-background/80 rounded p-1 text-center">
                        <p className="text-[8px] font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini positions */}
                <div className="p-3">
                  <h4 className="text-[9px] font-semibold mb-2">{t.careerPage.openPositions}</h4>
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-1.5 rounded border border-border/50 text-[7px]">
                        <div className="font-semibold">{t.careerPage.openPositions}</div>
                        <div className="text-muted-foreground">{t.careerPage.openPositions}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini culture */}
                <div className="p-3 bg-muted/20">
                  <h4 className="text-[9px] font-semibold mb-1">{t.careerPage.companyCulture}</h4>
                  <div className="flex flex-wrap gap-0.5">
                    {config.values.slice(0, 3).map((v, i) => (
                      <span key={i} className={cn('px-1 py-0.5 rounded text-[6px] text-white bg-gradient-to-r', selectedColorPreset.gradient)}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mini footer */}
                <div className="p-2 text-center border-t border-border/50">
                  <p className="text-[7px] text-muted-foreground flex items-center justify-center gap-0.5">
                    <Sparkles className="w-2 h-2 text-teal-500" />
                    {t.careerPage.poweredBy}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Edit Controls */}
        <div className="xl:col-span-3 order-1 xl:order-2 space-y-4">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="content" className="text-xs">
                <Type className="w-3.5 h-3.5 me-1.5" />
                Content
              </TabsTrigger>
              <TabsTrigger value="design" className="text-xs">
                <Paintbrush className="w-3.5 h-3.5 me-1.5" />
                Design
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs">
                <Search className="w-3.5 h-3.5 me-1.5" />
                SEO
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {/* Career Page URL */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.pageUrl}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input value={careerPageUrl} readOnly className="text-sm bg-muted/30" />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl} className="shrink-0 h-9 w-9">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Publish Toggle */}
              <Card className="border-border/60">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {config.isPublished ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{config.isPublished ? t.careerPage.publishPage : t.careerPage.unpublishPage}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.isPublished ? 'Your career page is live and visible to candidates' : 'Your career page is hidden from public view'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.isPublished}
                      onCheckedChange={(checked) => setConfig({ ...config, isPublished: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tagline */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.companyTagline}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    A brief tagline that appears on your career page hero section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    placeholder="Enter your company tagline..."
                    className="text-sm"
                  />
                </CardContent>
              </Card>

              {/* Values */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.companyValues}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Core values displayed on your career page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {config.values.map((val, i) => (
                      <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs gap-1.5 pr-1">
                        {val}
                        <button onClick={() => removeValue(i)} className="ml-0.5 hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={t.careerPage.addValue}
                      className="text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && addValue()}
                    />
                    <Button variant="outline" size="icon" onClick={addValue} className="shrink-0 h-9 w-9">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.benefits}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Perks and benefits shown on your career page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {config.benefits.map((ben, i) => (
                      <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs gap-1.5 pr-1">
                        {ben}
                        <button onClick={() => removeBenefit(i)} className="ml-0.5 hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder={t.careerPage.addBenefit}
                      className="text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                    />
                    <Button variant="outline" size="icon" onClick={addBenefit} className="shrink-0 h-9 w-9">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Culture Text */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.companyCulture}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    A brief description of your company culture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.cultureText}
                    onChange={(e) => setConfig({ ...config, cultureText: e.target.value })}
                    rows={3}
                    className="text-sm resize-y min-h-[80px]"
                    placeholder="Describe your company culture..."
                  />
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.socialLinks}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">LinkedIn</Label>
                    <Input
                      value={config.socialLinks.linkedin}
                      onChange={(e) => setConfig({ ...config, socialLinks: { ...config.socialLinks, linkedin: e.target.value } })}
                      placeholder="https://linkedin.com/company/..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Twitter / X</Label>
                    <Input
                      value={config.socialLinks.twitter}
                      onChange={(e) => setConfig({ ...config, socialLinks: { ...config.socialLinks, twitter: e.target.value } })}
                      placeholder="https://twitter.com/..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">GitHub</Label>
                    <Input
                      value={config.socialLinks.github}
                      onChange={(e) => setConfig({ ...config, socialLinks: { ...config.socialLinks, github: e.target.value } })}
                      placeholder="https://github.com/..."
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-4">
              {/* Primary Color */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Paintbrush className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.primaryColor}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose the accent color for your career page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setConfig({ ...config, primaryColor: preset.value })}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                          config.primaryColor === preset.value
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20 shadow-md'
                            : 'border-transparent hover:border-muted-foreground/20 bg-muted/30'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br shadow-sm', preset.gradient)} />
                        <span className="text-xs font-medium">{preset.name}</span>
                        {config.primaryColor === preset.value && (
                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hero Image */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.heroImage}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Upload a hero banner image for your career page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsHeroDragOver(true); }}
                    onDragLeave={() => setIsHeroDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsHeroDragOver(false);
                      // Placeholder: would handle file upload
                      toast.success('Image uploaded (demo)');
                    }}
                    className={cn(
                      'relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                      isHeroDragOver
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                        : 'border-muted-foreground/25 hover:border-teal-400 hover:bg-muted/30'
                    )}
                    onClick={() => toast.info('Image upload would open here')}
                  >
                    {config.heroImageUrl ? (
                      <div className="relative w-full h-full">
                        <img src={config.heroImageUrl} alt="Hero" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfig({ ...config, heroImageUrl: null }); }}
                          className="absolute top-2 end-2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm">
                          <span className="text-teal-600 dark:text-teal-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WebP (max 5MB, recommended 1200x400px)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    {t.careerPage.seoSettings}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Optimize how your career page appears in search results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t.careerPage.metaTitle}</Label>
                    <Input
                      value={config.metaTitle}
                      onChange={(e) => setConfig({ ...config, metaTitle: e.target.value })}
                      placeholder="Careers at [Company Name]"
                      className="text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">{config.metaTitle.length}/60 characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t.careerPage.metaDescription}</Label>
                    <Textarea
                      value={config.metaDescription}
                      onChange={(e) => setConfig({ ...config, metaDescription: e.target.value })}
                      placeholder="Join our team and..."
                      rows={2}
                      className="text-sm resize-y min-h-[60px]"
                    />
                    <p className="text-[10px] text-muted-foreground">{config.metaDescription.length}/160 characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">OG Image</Label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px]">
                        OG
                      </div>
                      <div>
                        <p className="text-xs font-medium">Social Sharing Preview</p>
                        <p className="text-[10px] text-muted-foreground">1200x630px recommended</p>
                        <Button variant="outline" size="sm" className="text-[10px] h-6 mt-1" onClick={() => toast.info('OG image upload would open here')}>
                          <Upload className="w-3 h-3 me-1" /> Upload
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Search preview */}
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">Search Preview</p>
                    <div className="space-y-0.5">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate">{config.metaTitle}</p>
                      <p className="text-[10px] text-green-700 dark:text-green-400">{careerPageUrl}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{config.metaDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pb-6">
            <Button variant="outline" className="min-w-[100px]">{t.common.cancel}</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.common.loading}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {t.careerPage.saveChanges}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
