'use client';

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  Info,
  Send,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface EEOSurveyProps {
  onSubmit?: (data: EEOSurveyData) => void;
  onSave?: (data: EEOSurveyData) => void;
}

export interface EEOSurveyData {
  gender: string;
  ethnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
  declinedToIdentify: boolean;
}

export default function EEOSurvey({ onSubmit, onSave }: EEOSurveyProps) {
  const { t } = useI18n();
  const [gender, setGender] = useState<string>('');
  const [ethnicity, setEthnicity] = useState<string>('');
  const [veteranStatus, setVeteranStatus] = useState<string>('');
  const [disabilityStatus, setDisabilityStatus] = useState<string>('');
  const [declinedToIdentify, setDeclinedToIdentify] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeclineChange = (checked: boolean) => {
    setDeclinedToIdentify(checked);
    if (checked) {
      setGender('');
      setEthnicity('');
      setVeteranStatus('');
      setDisabilityStatus('');
    }
  };

  const isFormValid = declinedToIdentify || (gender && ethnicity && veteranStatus && disabilityStatus);

  const getSurveyData = (): EEOSurveyData => ({
    gender: declinedToIdentify ? 'Prefer Not to Say' : gender,
    ethnicity: declinedToIdentify ? 'Prefer Not to Say' : ethnicity,
    veteranStatus: declinedToIdentify ? 'Prefer Not to Say' : veteranStatus,
    disabilityStatus: declinedToIdentify ? 'Prefer Not to Say' : disabilityStatus,
    declinedToIdentify,
  });

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = getSurveyData();
    if (onSubmit) {
      onSubmit(data);
    }
    setIsSubmitting(false);
    toast.success(t.eeo.submitSurvey, {
      description: declinedToIdentify
        ? t.eeo.declineSelfIdentify
        : t.eeo.selfIdentified,
    });
  };

  const handleSave = () => {
    const data = getSurveyData();
    if (onSave) {
      onSave(data);
    }
    toast.success('Saved', {
      description: 'Survey data saved as draft',
    });
  };

  return (
    <Card className="border-border/50 max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {t.eeo.voluntarySurvey}
        </CardTitle>
        <CardDescription>{t.eeo.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{t.eeo.voluntaryDisclaimer}</p>
        </div>

        {/* Decline checkbox */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
          <Checkbox
            id="decline"
            checked={declinedToIdentify}
            onCheckedChange={(checked) => handleDeclineChange(checked as boolean)}
          />
          <Label htmlFor="decline" className="text-sm font-medium cursor-pointer">
            {t.eeo.declineSelfIdentify}
          </Label>
        </div>

        {/* Gender Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t.eeo.gender}</Label>
          <Select value={gender} onValueChange={setGender} disabled={declinedToIdentify}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t.eeo.gender} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">{t.eeo.male}</SelectItem>
              <SelectItem value="Female">{t.eeo.female}</SelectItem>
              <SelectItem value="Non-Binary">{t.eeo.nonBinary}</SelectItem>
              <SelectItem value="Other">{t.eeo.other}</SelectItem>
              <SelectItem value="Prefer Not to Say">{t.eeo.preferNotToSay}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ethnicity Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t.eeo.ethnicity}</Label>
          <Select value={ethnicity} onValueChange={setEthnicity} disabled={declinedToIdentify}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t.eeo.ethnicity} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hispanic or Latino">{t.eeo.hispanicOrLatino}</SelectItem>
              <SelectItem value="White">{t.eeo.white}</SelectItem>
              <SelectItem value="Black or African American">{t.eeo.blackOrAfricanAmerican}</SelectItem>
              <SelectItem value="Asian">{t.eeo.asian}</SelectItem>
              <SelectItem value="Native Hawaiian or Pacific Islander">{t.eeo.nativeHawaiian}</SelectItem>
              <SelectItem value="American Indian or Alaska Native">{t.eeo.americanIndian}</SelectItem>
              <SelectItem value="Two or More Races">{t.eeo.twoOrMoreRaces}</SelectItem>
              <SelectItem value="Prefer Not to Say">{t.eeo.preferNotToSay}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Veteran Status Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t.eeo.veteranStatus}</Label>
          <Select value={veteranStatus} onValueChange={setVeteranStatus} disabled={declinedToIdentify}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t.eeo.veteranStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">{t.eeo.yes}</SelectItem>
              <SelectItem value="No">{t.eeo.no}</SelectItem>
              <SelectItem value="Prefer Not to Say">{t.eeo.preferNotToSay}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disability Status Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t.eeo.disabilityStatus}</Label>
          <Select value={disabilityStatus} onValueChange={setDisabilityStatus} disabled={declinedToIdentify}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t.eeo.disabilityStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">{t.eeo.yes}</SelectItem>
              <SelectItem value="No">{t.eeo.no}</SelectItem>
              <SelectItem value="Prefer Not to Say">{t.eeo.preferNotToSay}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit / Save buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? '...' : t.eeo.submitSurvey}
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {t.common.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
