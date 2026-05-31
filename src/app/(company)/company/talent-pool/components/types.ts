// @ts-nocheck

export type PoolCategory = 'Silver' | 'Gold' | 'Platinum' | 'General';

export interface Pool {
  id: string;
  name: string;
  description: string;
  category: PoolCategory;
  memberCount: number;
  lastActivity: string;
  memberIds: string[];
}

export interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  skills: string[];
  matchScore: number;
  lastContacted: string;
  poolIds: string[];
  email: string;
  availability: string;
  tags: string[];
  activityTimeline: ActivityEntry[];
}

export interface ActivityEntry {
  id: string;
  type: 'email' | 'call' | 'note' | 'job' | 'pool';
  description: string;
  date: string;
}

export interface RecentActivity {
  id: string;
  description: string;
  time: string;
  type: string;
}
