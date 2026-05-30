'use client'

import { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Bell, Shield, Bot } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import ProfileUploadZone from '@/components/profile-upload-zone';
import TwoFactorSection from '@/components/shared/two-factor-section';
import SessionManagementSection from '@/components/shared/session-management-section';

interface ChatbotConfigData {
  id?: string;
  companyId?: string;
  welcomeMessage: string;
  personality: string;
  enabledFeatures: string[];
  knowledgeBase: string | null;
  isActive: boolean;
}

export default function CompanySettingsContent() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();

  // Chatbot config state
  const [chatbotActive, setChatbotActive] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! I'm your AI recruiting assistant. How can I help?");
  const [personality, setPersonality] = useState('professional');
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(['job_search', 'application_status', 'faq', 'interview_prep']);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [savingChatbot, setSavingChatbot] = useState(false);

  // Load chatbot config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/chatbot/config?companyId=current');
        if (res.ok) {
          const data: ChatbotConfigData = await res.json();
          setChatbotActive(data.isActive);
          setWelcomeMessage(data.welcomeMessage);
          setPersonality(data.personality);
          setEnabledFeatures(data.enabledFeatures);
          if (data.knowledgeBase) {
            setKnowledgeBase(typeof data.knowledgeBase === 'string' ? data.knowledgeBase : JSON.stringify(data.knowledgeBase, null, 2));
          }
        }
      } catch {
        // Use defaults
      }
    }
    loadConfig();
  }, []);

  const toggleFeature = (feature: string) => {
    setEnabledFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSaveChatbot = async () => {
    setSavingChatbot(true);
    try {
      const res = await fetch('/api/chatbot/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'current',
          welcomeMessage,
          personality,
          enabledFeatures,
          knowledgeBase: knowledgeBase.trim() ? JSON.parse(knowledgeBase) : null,
          isActive: chatbotActive,
        }),
      });

      if (res.ok) {
        toast.success(t.chatbot.saveSuccess);
      } else {
        // If JSON parse fails for knowledge base, try without it
        const retryRes = await fetch('/api/chatbot/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: 'current',
            welcomeMessage,
            personality,
            enabledFeatures,
            knowledgeBase: null,
            isActive: chatbotActive,
          }),
        });
        if (retryRes.ok) {
          toast.success(t.chatbot.saveSuccess);
        } else {
          toast.error(t.chatbot.saveError);
        }
      }
    } catch {
      toast.error(t.chatbot.saveError);
    } finally {
      setSavingChatbot(false);
    }
  };

  const cb = t.chatbot;

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.nav.settings}</h1>
        <p className="text-muted-foreground">{t.settings.companySettingsDesc}</p>
      </div>

      {/* Profile Upload Zone */}
      <ProfileUploadZone
        name="Sarah Chen"
        initials="SC"
        role="HR Manager · TechVision Inc."
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-600" />
              {t.settings.languageAppearance}
            </CardTitle>
            <CardDescription>{t.settings.choosePreferredLanguage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.language}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.chooseLanguage}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('en')} className={locale === 'en' ? 'bg-teal-600' : ''}>English</Button>
                <Button variant={locale === 'ar' ? 'default' : 'outline'} size="sm" onClick={() => setLocale('ar')} className={locale === 'ar' ? 'bg-teal-600' : ''}>العربية</Button>
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
              <Bell className="h-5 w-5 text-teal-600" />
              {t.settings.notifications}
            </CardTitle>
            <CardDescription>{t.settings.notificationsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.settings.emailNotif}</Label>
                <p className="text-sm text-muted-foreground">{t.settings.emailNotifDesc}</p>
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

        {/* Chatbot Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-600" />
              {cb.settingsTitle}
            </CardTitle>
            <CardDescription>{cb.settingsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Chatbot Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{cb.settingsToggle}</Label>
                <p className="text-sm text-muted-foreground">{cb.settingsToggleDesc}</p>
              </div>
              <Switch
                checked={chatbotActive}
                onCheckedChange={setChatbotActive}
              />
            </div>

            <div className="section-divider" />

            {/* Welcome Message */}
            <div className="grid gap-2">
              <Label htmlFor="chatbot-welcome">{cb.welcomeMessage}</Label>
              <Input
                id="chatbot-welcome"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder={cb.welcomeMessagePlaceholder}
                className="focus-ring"
                disabled={!chatbotActive}
              />
            </div>

            <div className="section-divider" />

            {/* Personality Selector */}
            <div className="grid gap-2">
              <Label>{cb.personality}</Label>
              <div className="flex items-center gap-2">
                {(['professional', 'friendly', 'casual'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={personality === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPersonality(p)}
                    disabled={!chatbotActive}
                    className={personality === p ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    {p === 'professional' ? cb.personalityProfessional : p === 'friendly' ? cb.personalityFriendly : cb.personalityCasual}
                  </Button>
                ))}
              </div>
            </div>

            <div className="section-divider" />

            {/* Feature Toggles */}
            <div className="grid gap-3">
              <Label className="font-medium">{t.settings.notifications}</Label>
              <div className="space-y-3">
                {[
                  { key: 'job_search', label: cb.featureJobSearch },
                  { key: 'application_status', label: cb.featureAppStatus },
                  { key: 'faq', label: cb.featureFaq },
                  { key: 'interview_prep', label: cb.featureInterviewPrep },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between">
                    <Label className="text-sm font-normal">{feature.label}</Label>
                    <Switch
                      checked={enabledFeatures.includes(feature.key)}
                      onCheckedChange={() => toggleFeature(feature.key)}
                      disabled={!chatbotActive}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="section-divider" />

            {/* Knowledge Base Editor */}
            <div className="grid gap-2">
              <Label htmlFor="chatbot-knowledge">{cb.knowledgeBase}</Label>
              <Textarea
                id="chatbot-knowledge"
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder={cb.knowledgeBasePlaceholder}
                className="min-h-[120px] font-mono text-sm focus-ring"
                disabled={!chatbotActive}
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveChatbot}
              disabled={savingChatbot || !chatbotActive}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white btn-save-success"
            >
              {savingChatbot ? '...' : t.settings.updatePassword ? t.common.save || 'Save' : 'Save'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              {t.settings.security}
            </CardTitle>
            <CardDescription>{t.settings.securityDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
              <Input id="current-password" type="password" placeholder={t.settings.currentPasswordPlaceholder} className="focus-ring" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">{t.settings.newPassword}</Label>
              <Input id="new-password" type="password" placeholder={t.settings.newPasswordPlaceholder} className="focus-ring" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">{t.settings.confirmPassword}</Label>
              <Input id="confirm-new-password" type="password" placeholder={t.settings.confirmPasswordPlaceholder} className="focus-ring" />
            </div>
            <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white btn-save-success">
              {t.settings.updatePassword}
            </Button>
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
