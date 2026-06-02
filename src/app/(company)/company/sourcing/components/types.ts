// @ts-nocheck
export interface PastCandidate {
  id: string;
  name: string;
  currentTitle: string;
  location: string;
  experienceYears: number;
  skills: string[];
  matchScore: number;
  lastActive: string;
  matchReasons: string[];
  appliedBefore: string;
  availability: 'available' | 'not_available' | 'open_to_work';
}

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface SourcingCampaign {
  id: string;
  name: string;
  jobId: string | null;
  jobTitle: string | null;
  criteria: {
    skills: string[];
    experience?: number;
    location?: string;
  };
  matchedCount: number;
  contactedCount: number;
  respondedCount: number;
  status: CampaignStatus;
  createdAt: string;
}

export type EngagementEventType = 'EMAIL_SENT' | 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'INTERVIEW_SCHEDULED' | 'APPLIED' | 'VIEWED_PROFILE';

export interface EngagementEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  type: EngagementEventType;
  campaignName: string | null;
  details: string;
  date: string;
}
