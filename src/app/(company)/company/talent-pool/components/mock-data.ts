// @ts-nocheck
'use client';

import type { Pool, Candidate, RecentActivity } from './types';

export const categoryColors: Record<string, string> = {
  Silver: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0',
  Gold: 'bg-amber-50 text-amber-700 dark:bg-amber-950 border-0',
  Platinum: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 border-0',
  General: 'bg-slate-50 text-blue-700 dark:bg-teal-950 border-0',
};

export const categoryIcons: Record<string, string> = {
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  General: '📋',
};

export const mockPools: Pool[] = [
  {
    id: 'pool-1',
    name: 'Senior Engineers',
    description: 'Experienced software engineers with 5+ years of expertise in modern tech stacks',
    category: 'Gold',
    memberCount: 12,
    lastActivity: '2 hours ago',
    memberIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'],
  },
  {
    id: 'pool-2',
    name: 'Design Talent',
    description: 'Creative designers with strong UX/UI and product design skills',
    category: 'Silver',
    memberCount: 8,
    lastActivity: '1 day ago',
    memberIds: ['c3', 'c5', 'c7', 'c9', 'c11', 'c13', 'c14', 'c15'],
  },
  {
    id: 'pool-3',
    name: 'Product Leaders',
    description: 'Strategic product managers and leaders with proven track records',
    category: 'Platinum',
    memberCount: 5,
    lastActivity: '3 days ago',
    memberIds: ['c1', 'c6', 'c10', 'c13', 'c15'],
  },
  {
    id: 'pool-4',
    name: 'General Pipeline',
    description: 'All promising candidates for general opportunities and future roles',
    category: 'General',
    memberCount: 25,
    lastActivity: '5 hours ago',
    memberIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15'],
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'c1', name: 'Sarah Chen', currentTitle: 'Senior Software Engineer', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], matchScore: 94, lastContacted: '2 days ago', poolIds: ['pool-1', 'pool-3', 'pool-4'], email: 'sarah.chen@email.com', availability: 'Open to offers', tags: ['Tech Lead', 'Full-Stack'],
    activityTimeline: [
      { id: 'a1', type: 'email', description: 'Sent follow-up email about Senior Architect role', date: '2 days ago' },
      { id: 'a2', type: 'call', description: 'Phone screening for Engineering Manager position', date: '1 week ago' },
      { id: 'a3', type: 'pool', description: 'Added to Senior Engineers pool', date: '2 weeks ago' },
    ],
  },
  {
    id: 'c2', name: 'Marcus Johnson', currentTitle: 'Backend Developer', skills: ['Python', 'Django', 'PostgreSQL', 'Docker'], matchScore: 88, lastContacted: '1 day ago', poolIds: ['pool-1', 'pool-4'], email: 'marcus.j@email.com', availability: 'Actively looking', tags: ['Backend', 'DevOps'],
    activityTimeline: [
      { id: 'a4', type: 'email', description: 'Shared job description for Lead Backend role', date: '1 day ago' },
      { id: 'a5', type: 'note', description: 'Strong system design skills, great culture fit', date: '5 days ago' },
    ],
  },
  {
    id: 'c3', name: 'Aisha Patel', currentTitle: 'Full-Stack Engineer', skills: ['React', 'Python', 'MongoDB', 'GraphQL'], matchScore: 91, lastContacted: '3 days ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'aisha.p@email.com', availability: 'Open to offers', tags: ['Full-Stack', 'Design'],
    activityTimeline: [
      { id: 'a6', type: 'call', description: 'Technical discussion about microservices architecture', date: '3 days ago' },
    ],
  },
  {
    id: 'c4', name: 'Tom Anderson', currentTitle: 'DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'], matchScore: 85, lastContacted: '5 days ago', poolIds: ['pool-1', 'pool-4'], email: 'tom.a@email.com', availability: 'Passive', tags: ['DevOps', 'Cloud'],
    activityTimeline: [
      { id: 'a7', type: 'email', description: 'Initial outreach email sent', date: '5 days ago' },
      { id: 'a8', type: 'pool', description: 'Added to Senior Engineers pool', date: '1 week ago' },
    ],
  },
  {
    id: 'c5', name: 'Priya Sharma', currentTitle: 'UI/UX Designer', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], matchScore: 92, lastContacted: '1 day ago', poolIds: ['pool-2', 'pool-4'], email: 'priya.s@email.com', availability: 'Actively looking', tags: ['Design', 'UX Research'],
    activityTimeline: [
      { id: 'a9', type: 'email', description: 'Sent portfolio review invitation', date: '1 day ago' },
      { id: 'a10', type: 'call', description: 'Design challenge discussion', date: '4 days ago' },
      { id: 'a11', type: 'note', description: 'Exceptional design thinking and attention to detail', date: '1 week ago' },
    ],
  },
  {
    id: 'c6', name: 'David Kim', currentTitle: 'Product Manager', skills: ['Strategy', 'Agile', 'Data Analysis', 'Leadership'], matchScore: 89, lastContacted: '4 days ago', poolIds: ['pool-3', 'pool-4'], email: 'david.k@email.com', availability: 'Open to offers', tags: ['Product', 'Strategy'],
    activityTimeline: [
      { id: 'a12', type: 'call', description: 'Discussed VP of Product opportunity', date: '4 days ago' },
      { id: 'a13', type: 'pool', description: 'Added to Product Leaders pool', date: '2 weeks ago' },
    ],
  },
  {
    id: 'c7', name: 'Emma Wilson', currentTitle: 'Frontend Developer', skills: ['Vue.js', 'TypeScript', 'CSS', 'Testing'], matchScore: 83, lastContacted: '1 week ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'emma.w@email.com', availability: 'Passive', tags: ['Frontend', 'Vue'],
    activityTimeline: [
      { id: 'a14', type: 'email', description: 'Follow-up on open Frontend Lead position', date: '1 week ago' },
    ],
  },
  {
    id: 'c8', name: 'Carlos Ruiz', currentTitle: 'Data Engineer', skills: ['Spark', 'Python', 'SQL', 'Airflow'], matchScore: 86, lastContacted: '3 days ago', poolIds: ['pool-1', 'pool-4'], email: 'carlos.r@email.com', availability: 'Actively looking', tags: ['Data', 'Engineering'],
    activityTimeline: [
      { id: 'a15', type: 'note', description: 'Strong ETL pipeline experience, great for Data Platform team', date: '3 days ago' },
    ],
  },
  {
    id: 'c9', name: 'Lisa Park', currentTitle: 'Product Designer', skills: ['Figma', 'Sketch', 'User Testing', 'Branding'], matchScore: 90, lastContacted: '2 days ago', poolIds: ['pool-2', 'pool-4'], email: 'lisa.p@email.com', availability: 'Open to offers', tags: ['Design', 'Branding'],
    activityTimeline: [
      { id: 'a16', type: 'email', description: 'Sent offer for Senior Product Designer role', date: '2 days ago' },
      { id: 'a17', type: 'call', description: 'Salary negotiation discussion', date: '5 days ago' },
    ],
  },
  {
    id: 'c10', name: 'Omar Hassan', currentTitle: 'Engineering Manager', skills: ['Leadership', 'React', 'System Design', 'Mentoring'], matchScore: 95, lastContacted: '6 hours ago', poolIds: ['pool-1', 'pool-3', 'pool-4'], email: 'omar.h@email.com', availability: 'Actively looking', tags: ['Leadership', 'Management'],
    activityTimeline: [
      { id: 'a18', type: 'call', description: 'Final round interview for VP Engineering', date: '6 hours ago' },
      { id: 'a19', type: 'email', description: 'Shared company culture deck and benefits', date: '1 day ago' },
      { id: 'a20', type: 'pool', description: 'Added to Product Leaders pool', date: '3 days ago' },
    ],
  },
  {
    id: 'c11', name: 'Sophie Taylor', currentTitle: 'Mobile Developer', skills: ['React Native', 'Swift', 'Kotlin', 'Firebase'], matchScore: 82, lastContacted: '1 week ago', poolIds: ['pool-1', 'pool-2', 'pool-4'], email: 'sophie.t@email.com', availability: 'Passive', tags: ['Mobile', 'Cross-Platform'],
    activityTimeline: [
      { id: 'a21', type: 'email', description: 'Connected on LinkedIn, shared open roles', date: '1 week ago' },
    ],
  },
  {
    id: 'c12', name: 'Ryan Cooper', currentTitle: 'Cloud Architect', skills: ['AWS', 'GCP', 'Microservices', 'Security'], matchScore: 87, lastContacted: '4 days ago', poolIds: ['pool-1', 'pool-4'], email: 'ryan.c@email.com', availability: 'Open to offers', tags: ['Cloud', 'Architecture'],
    activityTimeline: [
      { id: 'a22', type: 'call', description: 'Technical architecture discussion', date: '4 days ago' },
      { id: 'a23', type: 'note', description: '10+ years cloud experience, AWS certified', date: '1 week ago' },
    ],
  },
  {
    id: 'c13', name: 'Fatima Al-Rashid', currentTitle: 'Director of Product', skills: ['Strategy', 'OKRs', 'Team Building', 'Analytics'], matchScore: 96, lastContacted: '1 day ago', poolIds: ['pool-3', 'pool-4'], email: 'fatima.a@email.com', availability: 'Open to offers', tags: ['Leadership', 'Product'],
    activityTimeline: [
      { id: 'a24', type: 'email', description: 'Sent CPO opportunity details', date: '1 day ago' },
      { id: 'a25', type: 'call', description: 'Executive interview round 1', date: '3 days ago' },
    ],
  },
  {
    id: 'c14', name: 'James Liu', currentTitle: 'ML Engineer', skills: ['PyTorch', 'NLP', 'MLOps', 'Python'], matchScore: 84, lastContacted: '5 days ago', poolIds: ['pool-1', 'pool-4'], email: 'james.l@email.com', availability: 'Passive', tags: ['ML', 'AI'],
    activityTimeline: [
      { id: 'a26', type: 'email', description: 'Shared ML team growth plans', date: '5 days ago' },
    ],
  },
  {
    id: 'c15', name: 'Nadia Volkov', currentTitle: 'Head of Design', skills: ['Design Systems', 'Leadership', 'Research', 'Figma'], matchScore: 93, lastContacted: '2 days ago', poolIds: ['pool-2', 'pool-3', 'pool-4'], email: 'nadia.v@email.com', availability: 'Actively looking', tags: ['Design Leadership', 'UX'],
    activityTimeline: [
      { id: 'a27', type: 'call', description: 'VP Design role discussion', date: '2 days ago' },
      { id: 'a28', type: 'pool', description: 'Added to Product Leaders pool', date: '1 week ago' },
      { id: 'a29', type: 'note', description: 'Built design org from 3 to 20 people at current company', date: '2 weeks ago' },
    ],
  },
];

export const recentActivities: RecentActivity[] = [
  { id: 'ra1', description: 'Omar Hassan completed final interview for VP Engineering', time: '6 hours ago', type: 'interview' },
  { id: 'ra2', description: 'Fatima Al-Rashid responded to CPO opportunity', time: '1 day ago', type: 'email' },
  { id: 'ra3', description: 'Lisa Park received offer for Senior Product Designer', time: '2 days ago', type: 'offer' },
  { id: 'ra4', description: '3 candidates added to Senior Engineers pool', time: '3 days ago', type: 'pool' },
  { id: 'ra5', description: 'Nadia Volkov scheduled for VP Design interview', time: '2 days ago', type: 'interview' },
];
