'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  currentTitle: string;
  linkedin: string;
  portfolio: string;
  availability: string;
  expectedSalary: string;
}

interface PersonalInfoCardProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
}

export default function PersonalInfoCard({ personalInfo, setPersonalInfo }: PersonalInfoCardProps) {
  const { t } = useI18n();

  return (
    <Card className="border-0 shadow-sm card-hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-600" />
          {t.candidate.personalInfo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.auth.name}</Label>
            <Input
              id="name"
              value={personalInfo.name}
              onChange={(e) => setPersonalInfo({ ...personalInfo, name: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ ...personalInfo, email: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t.candidate.phone}</Label>
            <Input
              id="phone"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t.candidate.location}</Label>
            <Input
              id="location"
              value={personalInfo.location}
              onChange={(e) => setPersonalInfo({ ...personalInfo, location: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentTitle">{t.candidate.currentTitle}</Label>
            <Input
              id="currentTitle"
              value={personalInfo.currentTitle}
              onChange={(e) => setPersonalInfo({ ...personalInfo, currentTitle: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">{t.candidate.availability}</Label>
            <Select
              value={personalInfo.availability}
              onValueChange={(v) => setPersonalInfo({ ...personalInfo, availability: v })}
            >
              <SelectTrigger id="availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open to work</SelectItem>
                <SelectItem value="not-looking">Not looking</SelectItem>
                <SelectItem value="open-offers">Open to offers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">{t.candidate.linkedin}</Label>
            <Input
              id="linkedin"
              value={personalInfo.linkedin}
              onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">{t.candidate.portfolio}</Label>
            <Input
              id="portfolio"
              value={personalInfo.portfolio}
              onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: (e.target as unknown as { value: string }).value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">{t.candidate.bio}</Label>
            <Textarea
              id="bio"
              value={personalInfo.bio}
              onChange={(e) => setPersonalInfo({ ...personalInfo, bio: (e.target as unknown as { value: string }).value })}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
