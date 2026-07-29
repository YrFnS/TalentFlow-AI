'use client';

import type React from 'react';
import { LockKeyhole, User } from 'lucide-react';
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

export interface PersonalInfo {
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

export default function PersonalInfoCard({
  personalInfo,
  setPersonalInfo,
}: PersonalInfoCardProps) {
  const setField = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo((current) => ({ ...current, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Personal information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={personalInfo.name}
              maxLength={100}
              onChange={(event) => setField('name', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              Login email
              <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />
            </Label>
            <Input id="email" type="email" value={personalInfo.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email changes require account verification and are not handled from
              the public profile form.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={personalInfo.phone}
              maxLength={40}
              onChange={(event) => setField('phone', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={personalInfo.location}
              maxLength={250}
              onChange={(event) => setField('location', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentTitle">Current title</Label>
            <Input
              id="currentTitle"
              value={personalInfo.currentTitle}
              maxLength={250}
              onChange={(event) => setField('currentTitle', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select
              value={personalInfo.availability}
              onValueChange={(value) => setField('availability', value)}
            >
              <SelectTrigger id="availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open to work</SelectItem>
                <SelectItem value="employed">Employed, open to conversations</SelectItem>
                <SelectItem value="not_looking">Not looking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              type="url"
              value={personalInfo.linkedin}
              maxLength={2048}
              placeholder="https://www.linkedin.com/in/..."
              onChange={(event) => setField('linkedin', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input
              id="portfolio"
              type="url"
              value={personalInfo.portfolio}
              maxLength={2048}
              placeholder="https://..."
              onChange={(event) => setField('portfolio', event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="expectedSalary">Expected salary</Label>
            <Input
              id="expectedSalary"
              value={personalInfo.expectedSalary}
              maxLength={100}
              placeholder="Example: 2,500,000 IQD monthly"
              onChange={(event) => setField('expectedSalary', event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Professional summary</Label>
            <Textarea
              id="bio"
              value={personalInfo.bio}
              maxLength={10000}
              onChange={(event) => setField('bio', event.target.value)}
              rows={5}
              placeholder="Summarize your strengths, experience, and the roles you are targeting."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
