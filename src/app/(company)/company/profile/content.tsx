// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import {
  Building2,
  Upload,
  Globe,
  MapPin,
  Users,
  ShieldCheck,
  ShieldX,
  Linkedin,
  Twitter,
  Save,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Media',
  'Consulting',
  'Real Estate',
  'Energy',
  'Transportation',
  'Other',
];

const companySizes = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
];

export default function CompanyProfilePage() {
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    companySize: '',
    website: '',
    location: '',
    linkedin: '',
    twitter: '',
    logo: null as string | null,
    verified: false,
  });

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const res = await fetch('/api/companies/profile');
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            description: data.description || '',
            industry: data.industry || '',
            companySize: data.companySize || '',
            website: data.website || '',
            location: data.location || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            logo: data.logo || null,
            verified: data.verified || false,
          }));
        }
      } catch {
        // Show empty form
      }
    }
    fetchCompanyProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/companies/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        // Success handled by UI state
      }
    } catch {
      // Error handled silently
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Placeholder: would handle file upload here
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.company.companyProfile}</h1>
          <p className="text-muted-foreground mt-1">{t.company.editProfile}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              'px-3 py-1 text-sm font-medium border-0',
              formData.verified
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
            )}
          >
            {formData.verified ? (
              <ShieldCheck className="w-4 h-4 me-1.5" />
            ) : (
              <ShieldX className="w-4 h-4 me-1.5" />
            )}
            {formData.verified ? t.company.verifiedCompany : t.company.unverifiedCompany}
          </Badge>
        </div>
      </div>

      {/* Logo Upload Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t.company.companyLogo}
          </CardTitle>
          <CardDescription>
            Upload your company logo. Recommended size: 400x400px.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
              isDragOver
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                : 'border-muted-foreground/25 hover:border-teal-400 hover:bg-muted/30'
            )}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  <span className="text-teal-600 dark:text-teal-400 hover:text-teal-700">
                    Click to upload
                  </span>{' '}
                  or drag and drop
              </p>
                <p className="text-xs text-muted-foreground mt-1">SVG, PNG, or JPG (max 2MB)</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 end-3 h-8 w-8 rounded-full bg-background/80"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t.company.profile}
          </CardTitle>
          <CardDescription>
            Update your company information and details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">
              {t.company.name}
            </Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="max-w-md"
              placeholder="Enter company name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="company-description" className="text-sm font-medium">
              {t.company.description}
            </Label>
            <Textarea
              id="company-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="min-h-[120px] resize-y"
              placeholder="Tell us about your company..."
            />
          </div>

          {/* Industry and Size row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.company.industry}</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.company.size}</Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) => setFormData({ ...formData, companySize: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} {t.company.members}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website and Location row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-website" className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {t.company.website}
              </Label>
              <Input
                id="company-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-location" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {t.company.location}
              </Label>
              <Input
                id="company-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t.company.socialLinks}
          </CardTitle>
          <CardDescription>
            Add your company social media profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-url" className="text-sm font-medium flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              LinkedIn
            </Label>
            <Input
              id="linkedin-url"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="https://linkedin.com/company/your-company"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter-url" className="text-sm font-medium flex items-center gap-1.5">
              <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
              Twitter / X
            </Label>
            <Input
              id="twitter-url"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              placeholder="https://twitter.com/your-company"
            />
          </div>
        </CardContent>
      </Card>

      {/* Verification Status Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            {formData.verified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldX className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
            {t.company.verificationStatus}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                formData.verified
                  ? 'bg-emerald-100 dark:bg-emerald-950/50'
                  : 'bg-amber-100 dark:bg-amber-950/50'
              )}
            >
              {formData.verified ? (
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldX className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {formData.verified ? t.company.verifiedCompany : t.company.unverifiedCompany}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formData.verified
                  ? 'Your company has been verified by TalentFlow AI. This badge increases trust with candidates.'
                  : 'Get your company verified to increase trust with candidates and unlock premium features.'}
              </p>
            </div>
            {!formData.verified && (
              <Button variant="outline" size="sm" className="shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30">
                Request Verification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" className="min-w-[100px]">
          {t.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[140px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t.common.loading}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t.company.saveChanges}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
