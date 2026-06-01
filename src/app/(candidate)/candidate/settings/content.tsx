// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Globe, Shield, Bell, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import ProfileUploadZone from '@/components/profile-upload-zone';
import TwoFactorSection from '@/components/shared/two-factor-section';
import SessionManagementSection from '@/components/shared/session-management-section';

export default function CandidateSettingsContent() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.nav.settings}</h1>
        <p className="text-muted-foreground">{t.settings.candidateSettingsDesc}</p>
      </div>

      {/* Profile Upload Zone */}
      <ProfileUploadZone
        name="John Doe"
        initials="JD"
        role="Candidate"
      />

      <div className="grid gap-6">
        {/* Language & Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              {t.settings.languageAppearance}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.language}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.choosePreferredLanguage}</p>
              </div>
              <div className="flex gap-2">
                <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('en')} className={locale === 'en' ? 'bg-blue-600' : ''}>
                  English
                </Button>
                <Button variant={locale === 'ar' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('ar')} className={locale === 'ar' ? 'bg-blue-600' : ''}>
                  العربية
                </Button>
              </div>
            </div>
            <div className="section-divider" />
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.darkMode}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.toggleDarkModeDesc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? t.settings.lightModeLabel : t.settings.darkModeLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              {t.settings.notifications}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.jobAlerts}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.jobAlertsDesc}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="section-divider" />
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.appUpdates}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.appUpdatesDesc}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="section-divider" />
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.interviewReminders}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.interviewRemindersDesc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              {t.settings.security}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 max-w-sm">
              <div className="grid gap-2">
                <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
                <Input id="current-password" type="password" placeholder={t.settings.currentPasswordPlaceholder} className="focus-ring" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t.settings.newPassword}</Label>
                <Input id="new-password" type="password" placeholder={t.settings.newPasswordPlaceholder} className="focus-ring" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t.settings.confirmPassword}</Label>
                <Input id="confirm-password" type="password" placeholder={t.settings.confirmPasswordPlaceholder} className="focus-ring" />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-fit btn-save-success">
                {t.settings.updatePassword}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Section */}
        <TwoFactorSection />

        {/* Session Management Section */}
        <SessionManagementSection />

        {/* Profile Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {t.settings.profileVisibility}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.publicProfile}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.publicProfileDesc}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="section-divider" />
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.showSalary}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.showSalaryDesc}</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
