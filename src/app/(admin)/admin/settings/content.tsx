// @ts-nocheck
'use client'

import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Globe, Shield, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import ProfileUploadZone from '@/components/profile-upload-zone';
import TwoFactorSection from '@/components/shared/two-factor-section';
import SessionManagementSection from '@/components/shared/session-management-section';

export default function AdminSettingsContent() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.nav.settings}</h1>
        <p className="text-muted-foreground">{t.settings.adminSettingsDesc}</p>
      </div>

      {/* Profile Upload Zone */}
      <ProfileUploadZone
        name="Admin User"
        initials="AU"
        role="Super Admin"
      />

      <div className="grid gap-6">
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
                <p className="text-sm text-muted-foreground">{t.settings.chooseLanguage}</p>
              </div>
              <div className="flex gap-2">
                <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('en')} className={locale === 'en' ? 'bg-blue-600' : ''}>English</Button>
                <Button variant={locale === 'ar' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('ar')} className={locale === 'ar' ? 'bg-blue-600' : ''}>العربية</Button>
              </div>
            </div>
            <div className="section-divider" />
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.darkMode}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.toggleDarkMode}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? t.settings.lightModeLabel : t.settings.darkModeLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              {t.settings.security}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>{t.settings.changePassword}</Label>
              <div className="grid gap-2 max-w-sm">
                <Input type="password" placeholder={t.settings.currentPasswordPlaceholder} className="focus-ring" />
                <Input type="password" placeholder={t.settings.newPasswordPlaceholder} className="focus-ring" />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-fit btn-save-success">{t.settings.updatePassword}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Section */}
        <TwoFactorSection />

        {/* Session Management Section */}
        <SessionManagementSection />
      </div>
    </div>
  );
}
