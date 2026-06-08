// @ts-nocheck
export interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string;
  limits: string | null;
  isActive: boolean;
  subscriberCount: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface SubscriptionData {
  id: string;
  planId: string;
  planName: string;
  planType: string;
  status: string;
  billingCycle: string;
  price: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  usage: {
    jobs: { current: number; limit: number };
    applications: { current: number; limit: number };
    aiCredits: { current: number; limit: number };
  };
}

export const defaultPlans: Plan[] = [
  {
    id: 'plan_free', name: 'Free', type: 'FREE', price: 0, currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['1 Job Posting', '10 Applications', '5 AI Credits', 'Basic Support']),
    limits: JSON.stringify({ jobs: 1, applications: 10, aiCredits: 5 }),
    isActive: true, subscriberCount: 0,
  },
  {
    id: 'plan_starter', name: 'Starter', type: 'STARTER', price: 29, currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['5 Job Postings', '100 Applications', '50 AI Credits', 'Email Support', 'Custom Pipeline']),
    limits: JSON.stringify({ jobs: 5, applications: 100, aiCredits: 50 }),
    isActive: true, subscriberCount: 0,
  },
  {
    id: 'plan_growth', name: 'Growth', type: 'GROWTH', price: 79, currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['25 Job Postings', '500 Applications', '200 AI Credits', 'Priority Support', 'Custom Workflows', 'Analytics Dashboard']),
    limits: JSON.stringify({ jobs: 25, applications: 500, aiCredits: 200 }),
    isActive: true, subscriberCount: 0,
  },
  {
    id: 'plan_enterprise', name: 'Enterprise', type: 'ENTERPRISE', price: 199, currency: 'USD',
    billingCycle: 'monthly',
    features: JSON.stringify(['Unlimited Jobs', 'Unlimited Applications', '1000 AI Credits', 'Priority Support', 'SSO Integration', 'Custom Integrations', 'SLA Guarantee']),
    limits: JSON.stringify({ jobs: -1, applications: -1, aiCredits: 1000 }),
    isActive: true, subscriberCount: 0,
  },
];
