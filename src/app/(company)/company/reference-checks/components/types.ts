// @ts-nocheck
export type ReferenceCheckStatus = 'Pending' | 'Sent' | 'Completed' | 'Expired' | 'Declined';

export interface ReferenceCheckQuestion {
  id: string;
  question: string;
  response?: string;
}

export interface ReferenceCheckItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidateCurrentTitle: string;
  referenceName: string;
  referenceEmail: string;
  referencePhone: string;
  referenceTitle: string;
  referenceCompany: string;
  relationship: string;
  questions: ReferenceCheckQuestion[];
  responses?: ReferenceCheckQuestion[];
  rating: number | null;
  status: ReferenceCheckStatus;
  sentDate: string;
  completedDate: string;
  expiresAt: string;
  token: string;
}

export interface MockApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: string;
}

export const defaultQuestions = [
  'How would you describe their work ethic?',
  'What are their key strengths?',
  'Areas for improvement?',
  'Would you rehire them?',
  'How do they handle pressure?',
];

export const mockApplications: MockApplication[] = [
  { id: 'app-1', candidateName: 'Sarah Chen', jobTitle: 'Senior Frontend Engineer', status: 'HIRED' },
  { id: 'app-2', candidateName: 'Marcus Brown', jobTitle: 'Product Designer', status: 'OFFERED' },
  { id: 'app-3', candidateName: 'Priya Sharma', jobTitle: 'Backend Developer', status: 'HIRED' },
  { id: 'app-4', candidateName: 'Aisha Mohamed', jobTitle: 'Data Analyst', status: 'OFFERED' },
  { id: 'app-5', candidateName: 'David Kim', jobTitle: 'DevOps Engineer', status: 'HIRED' },
];

export const mockReferenceChecks: ReferenceCheckItem[] = [
  {
    id: 'rc-1',
    applicationId: 'app-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@email.com',
    candidateCurrentTitle: 'Frontend Developer',
    referenceName: 'Tom Anderson',
    referenceEmail: 'tom.a@techcorp.com',
    referencePhone: '+1-555-0101',
    referenceTitle: 'Engineering Manager',
    referenceCompany: 'TechCorp',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Exceptional work ethic. Always delivers on time and goes above expectations.',
        'Strong technical skills, excellent communicator, great team player.',
        'Could improve on delegating tasks — tends to take on too much herself.',
        'Absolutely, without hesitation. She is a top performer.',
        'Handles pressure extremely well. Stays calm and focused during crunch periods.',
      ][i],
    })),
    rating: 5,
    status: 'Completed',
    sentDate: '2025-01-15',
    completedDate: '2025-01-18',
    expiresAt: '2025-01-29',
    token: 'token-rc-1',
  },
  {
    id: 'rc-2',
    applicationId: 'app-2',
    candidateName: 'Marcus Brown',
    candidateEmail: 'marcus.b@email.com',
    candidateCurrentTitle: 'UX Designer',
    referenceName: 'Linda Park',
    referenceEmail: 'linda.p@designstudio.com',
    referencePhone: '+1-555-0102',
    referenceTitle: 'Creative Director',
    referenceCompany: 'DesignStudio',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Very dedicated and passionate about design. Meets deadlines consistently.',
        'Creative thinking, user empathy, and strong visual design skills.',
        'Sometimes struggles with stakeholder management in contentious feedback sessions.',
        'Yes, I would rehire Marcus. A valuable team member.',
        'Performs well under pressure, though can be a bit perfectionist when rushed.',
      ][i],
    })),
    rating: 4,
    status: 'Completed',
    sentDate: '2025-01-10',
    completedDate: '2025-01-14',
    expiresAt: '2025-01-24',
    token: 'token-rc-2',
  },
  {
    id: 'rc-3',
    applicationId: 'app-3',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.s@email.com',
    candidateCurrentTitle: 'Software Engineer',
    referenceName: 'James Wilson',
    referenceEmail: 'james.w@dataflow.io',
    referencePhone: '+1-555-0103',
    referenceTitle: 'Senior Engineer',
    referenceCompany: 'DataFlow',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    responses: defaultQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      response: [
        'Solid work ethic. Reliable and consistent performer.',
        'Backend architecture, problem-solving, and mentoring junior developers.',
        'Could take more initiative in proposing new ideas beyond assigned tasks.',
        'Yes, she would be a great addition to any engineering team.',
        'Stays composed under pressure and helps the team stay on track.',
      ][i],
    })),
    rating: 4,
    status: 'Completed',
    sentDate: '2025-01-08',
    completedDate: '2025-01-12',
    expiresAt: '2025-01-22',
    token: 'token-rc-3',
  },
  {
    id: 'rc-4',
    applicationId: 'app-1',
    candidateName: 'Sarah Chen',
    candidateEmail: 'sarah.chen@email.com',
    candidateCurrentTitle: 'Frontend Developer',
    referenceName: 'Emily Zhang',
    referenceEmail: 'emily.z@startupxyz.com',
    referencePhone: '+1-555-0104',
    referenceTitle: 'Product Manager',
    referenceCompany: 'StartupXYZ',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Pending',
    sentDate: '',
    completedDate: '',
    expiresAt: '2025-03-10',
    token: 'token-rc-4',
  },
  {
    id: 'rc-5',
    applicationId: 'app-4',
    candidateName: 'Aisha Mohamed',
    candidateEmail: 'aisha.m@email.com',
    candidateCurrentTitle: 'Data Analyst',
    referenceName: 'Robert Lee',
    referenceEmail: 'robert.l@bigdata.co',
    referencePhone: '+1-555-0105',
    referenceTitle: 'VP of Analytics',
    referenceCompany: 'BigData Co',
    relationship: 'Manager',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Pending',
    sentDate: '',
    completedDate: '',
    expiresAt: '2025-03-12',
    token: 'token-rc-5',
  },
  {
    id: 'rc-6',
    applicationId: 'app-5',
    candidateName: 'David Kim',
    candidateEmail: 'david.k@email.com',
    candidateCurrentTitle: 'DevOps Engineer',
    referenceName: 'Sophie Taylor',
    referenceEmail: 'sophie.t@cloudnine.dev',
    referencePhone: '+1-555-0106',
    referenceTitle: 'CTO',
    referenceCompany: 'CloudNine',
    relationship: 'Direct Report',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Sent',
    sentDate: '2025-02-20',
    completedDate: '',
    expiresAt: '2025-03-06',
    token: 'token-rc-6',
  },
  {
    id: 'rc-7',
    applicationId: 'app-2',
    candidateName: 'Marcus Brown',
    candidateEmail: 'marcus.b@email.com',
    candidateCurrentTitle: 'UX Designer',
    referenceName: 'Carlos Ruiz',
    referenceEmail: 'carlos.r@pixelcraft.com',
    referencePhone: '+1-555-0107',
    referenceTitle: 'Lead Designer',
    referenceCompany: 'PixelCraft',
    relationship: 'Colleague',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Sent',
    sentDate: '2025-02-18',
    completedDate: '',
    expiresAt: '2025-03-04',
    token: 'token-rc-7',
  },
  {
    id: 'rc-8',
    applicationId: 'app-3',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.s@email.com',
    candidateCurrentTitle: 'Software Engineer',
    referenceName: 'Fatima Al-Rashid',
    referenceEmail: 'fatima.ar@oldcorp.com',
    referencePhone: '+1-555-0108',
    referenceTitle: 'HR Director',
    referenceCompany: 'OldCorp',
    relationship: 'Other',
    questions: defaultQuestions.map((q, i) => ({ id: `q-${i + 1}`, question: q })),
    rating: null,
    status: 'Expired',
    sentDate: '2024-12-01',
    completedDate: '',
    expiresAt: '2024-12-15',
    token: 'token-rc-8',
  },
];
