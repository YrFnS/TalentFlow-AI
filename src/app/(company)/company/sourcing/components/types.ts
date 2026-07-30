export type TalentAvailability =
  | 'available'
  | 'not_available'
  | 'open_to_work';

export interface PastCandidate {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  currentTitle: string;
  location: string;
  experienceYears: number;
  skills: string[];
  matchScore: number;
  lastActive: string;
  matchReasons: string[];
  appliedBefore: string;
  availability: TalentAvailability;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  previousApplications: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    status: string;
    stage: string | null;
    appliedAt: string;
    updatedAt: string;
  }>;
}

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface SourcingJob {
  id: string;
  title: string;
  status: string;
}

export interface SourcingCampaign {
  id: string;
  name: string;
  jobId: string | null;
  jobTitle: string | null;
  criteria: {
    skills: string[];
    experienceMin?: number;
    experienceMax?: number;
    location?: string;
    jobTitle?: string;
  };
  matchedCount: number;
  contactedCount: number;
  respondedCount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export type EngagementEventType =
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'EMAIL_CLICKED'
  | 'INTERVIEW_SCHEDULED'
  | 'APPLIED'
  | 'VIEWED_PROFILE';

export interface EngagementEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string | null;
  candidateImage: string | null;
  type: EngagementEventType;
  campaignName: string | null;
  details: Record<string, unknown>;
  date: string;
}
