// @ts-nocheck

export type TaskCategory = 'Document' | 'Training' | 'Setup' | 'Introduction' | 'General';
export type OnboardingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface PlanTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
}

export interface OnboardingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  tasks: PlanTask[];
  isActive: boolean;
}

export interface AssignmentTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDay: number;
  isRequired: boolean;
  isCompleted: boolean;
  status: string;
}

export interface OnboardingAssignment {
  id: string;
  employeeName: string;
  employeeEmail: string;
  planName: string;
  planId: string;
  progress: number;
  startDate: string;
  dueDate: string;
  status: OnboardingStatus;
  tasks: AssignmentTask[];
}

export const defaultPlans: OnboardingPlan[] = [
  {
    id: 'plan-1',
    name: 'Standard Onboarding',
    description: 'Comprehensive onboarding for all new hires covering essential setup, documentation, and introductions',
    duration: 14,
    isActive: true,
    tasks: [
      { id: 'pt-1', title: 'Complete employment contract', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-2', title: 'Submit tax forms', category: 'Document', dueDay: 2, isRequired: true },
      { id: 'pt-3', title: 'IT account setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-4', title: 'Email and communication tools', category: 'Setup', dueDay: 2, isRequired: true },
      { id: 'pt-5', title: 'Company orientation', category: 'Training', dueDay: 3, isRequired: true },
      { id: 'pt-6', title: 'Security awareness training', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-7', title: 'Team introduction meeting', category: 'Introduction', dueDay: 2, isRequired: false },
      { id: 'pt-8', title: 'Buddy assignment meet & greet', category: 'Introduction', dueDay: 3, isRequired: false },
    ],
  },
  {
    id: 'plan-2',
    name: 'Executive Onboarding',
    description: 'Extended onboarding program for senior hires with strategic alignment and leadership integration',
    duration: 30,
    isActive: true,
    tasks: [
      { id: 'pt-9', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-10', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-11', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true },
      { id: 'pt-12', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-13', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true },
      { id: 'pt-14', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-15', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true },
      { id: 'pt-16', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true },
      { id: 'pt-17', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false },
      { id: 'pt-18', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true },
      { id: 'pt-19', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true },
      { id: 'pt-20', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true },
    ],
  },
  {
    id: 'plan-3',
    name: 'Engineering Onboarding',
    description: 'Technical onboarding for engineering hires with codebase walkthrough and dev environment setup',
    duration: 21,
    isActive: true,
    tasks: [
      { id: 'pt-21', title: 'Employment contract signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-22', title: 'NDA signing', category: 'Document', dueDay: 1, isRequired: true },
      { id: 'pt-23', title: 'Dev environment setup', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-24', title: 'GitHub access and onboarding repo', category: 'Setup', dueDay: 1, isRequired: true },
      { id: 'pt-25', title: 'Codebase walkthrough', category: 'Training', dueDay: 3, isRequired: true },
      { id: 'pt-26', title: 'CI/CD pipeline overview', category: 'Training', dueDay: 5, isRequired: true },
      { id: 'pt-27', title: 'Security best practices', category: 'Training', dueDay: 7, isRequired: true },
      { id: 'pt-28', title: 'Team standup introduction', category: 'Introduction', dueDay: 2, isRequired: false },
      { id: 'pt-29', title: 'First PR review', category: 'Training', dueDay: 10, isRequired: true },
      { id: 'pt-30', title: 'Architecture deep-dive', category: 'Training', dueDay: 14, isRequired: false },
    ],
  },
];

export const defaultAssignments: OnboardingAssignment[] = [
  {
    id: 'oa-1', employeeName: 'Sarah Chen', employeeEmail: 'sarah.chen@company.com', planName: 'Standard Onboarding', planId: 'plan-1', progress: 75, startDate: '2025-01-15', dueDate: '2025-01-29', status: 'In Progress',
    tasks: [
      { id: 'at-1', title: 'Complete employment contract', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-2', title: 'Submit tax forms', category: 'Document', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-3', title: 'IT account setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-4', title: 'Email and communication tools', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-5', title: 'Company orientation', category: 'Training', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-6', title: 'Security awareness training', category: 'Training', dueDay: 5, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-7', title: 'Team introduction meeting', category: 'Introduction', dueDay: 2, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-8', title: 'Buddy assignment meet & greet', category: 'Introduction', dueDay: 3, isRequired: false, isCompleted: false, status: 'PENDING' },
    ],
  },
  {
    id: 'oa-2', employeeName: 'Marcus Brown', employeeEmail: 'marcus.brown@company.com', planName: 'Executive Onboarding', planId: 'plan-2', progress: 33, startDate: '2025-02-01', dueDate: '2025-03-03', status: 'In Progress',
    tasks: [
      { id: 'at-9', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-10', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-11', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-12', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-13', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-14', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-15', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-16', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-17', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-18', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-19', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-20', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true, isCompleted: false, status: 'PENDING' },
    ],
  },
  {
    id: 'oa-3', employeeName: 'Priya Sharma', employeeEmail: 'priya.sharma@company.com', planName: 'Standard Onboarding', planId: 'plan-1', progress: 100, startDate: '2025-01-01', dueDate: '2025-01-15', status: 'Completed',
    tasks: defaultPlans[0].tasks.map(t => ({ ...t, id: `at-3-${t.id}`, isCompleted: true, status: 'COMPLETED' })),
  },
  {
    id: 'oa-4', employeeName: 'Tom Anderson', employeeEmail: 'tom.anderson@company.com', planName: 'Engineering Onboarding', planId: 'plan-3', progress: 10, startDate: '2025-03-10', dueDate: '2025-03-31', status: 'Pending',
    tasks: [
      { id: 'at-29', title: 'Employment contract signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-30', title: 'NDA signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: false, status: 'PENDING' },
      ...defaultPlans[2].tasks.slice(2).map((t, i) => ({ ...t, id: `at-4-${i}`, isCompleted: false, status: 'PENDING' })),
    ],
  },
  {
    id: 'oa-5', employeeName: 'Aisha Mohamed', employeeEmail: 'aisha.mohamed@company.com', planName: 'Executive Onboarding', planId: 'plan-2', progress: 50, startDate: '2025-01-20', dueDate: '2025-02-19', status: 'Overdue',
    tasks: [
      { id: 'at-37', title: 'Executive employment agreement', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-38', title: 'NDA and non-compete signing', category: 'Document', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-39', title: 'Equity plan enrollment', category: 'Document', dueDay: 3, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-40', title: 'Executive IT setup', category: 'Setup', dueDay: 1, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-41', title: 'Board portal access', category: 'Setup', dueDay: 2, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-42', title: 'Strategic vision alignment session', category: 'Training', dueDay: 5, isRequired: true, isCompleted: true, status: 'COMPLETED' },
      { id: 'at-43', title: 'Leadership team introductions', category: 'Introduction', dueDay: 3, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-44', title: 'One-on-one with CEO', category: 'Introduction', dueDay: 7, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-45', title: 'Department head meetings', category: 'Introduction', dueDay: 10, isRequired: false, isCompleted: false, status: 'PENDING' },
      { id: 'at-46', title: 'Company culture deep-dive', category: 'Training', dueDay: 7, isRequired: true, isCompleted: false, status: 'OVERDUE' },
      { id: 'at-47', title: 'Financial overview session', category: 'Training', dueDay: 14, isRequired: true, isCompleted: false, status: 'PENDING' },
      { id: 'at-48', title: 'Review 90-day plan', category: 'General', dueDay: 30, isRequired: true, isCompleted: false, status: 'PENDING' },
    ],
  },
];

export const mockNewHires = [
  { id: 'nh-1', name: 'Emily Zhang', email: 'emily.zhang@company.com' },
  { id: 'nh-2', name: 'Ryan Cooper', email: 'ryan.cooper@company.com' },
  { id: 'nh-3', name: 'Fatima Al-Rashid', email: 'fatima.alrashid@company.com' },
];
