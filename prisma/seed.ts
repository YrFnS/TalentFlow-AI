import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@talentflow.ai' },
    update: {},
    create: {
      email: 'admin@talentflow.ai',
      name: 'Admin User',
      password: await hash('admin123', 12),
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // Create sample users
  const sampleUsers = [
    { email: 'sarah@techventures.com', name: 'Sarah Chen', role: 'COMPANY_ADMIN' as const },
    { email: 'ahmed@example.com', name: 'Ahmed Hassan', role: 'CANDIDATE' as const },
    { email: 'maria@cloudcorp.com', name: 'Maria Garcia', role: 'HR_MANAGER' as const },
    { email: 'james@example.com', name: 'James Wilson', role: 'CANDIDATE' as const },
    { email: 'liwei@innosoft.com', name: 'Li Wei', role: 'RECRUITER' as const },
    { email: 'emma@dataflow.com', name: 'Emma Thompson', role: 'COMPANY_ADMIN' as const },
    { email: 'omar@example.com', name: 'Omar Khalil', role: 'CANDIDATE' as const },
    { email: 'yuki@quantum.com', name: 'Yuki Tanaka', role: 'HR_MANAGER' as const },
    { email: 'john@greenpath.com', name: 'John Green', role: 'REVIEWER' as const },
    { email: 'nina@example.com', name: 'Nina Petrova', role: 'CANDIDATE' as const },
  ];

  for (const u of sampleUsers) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: await hash('password123', 12),
        role: u.role,
        isActive: true,
        emailVerified: new Date(),
      },
    });
  }

  // Create sample companies
  const sampleCompanies = [
    { name: 'TechVentures Inc.', slug: 'techventures', industry: 'Technology', location: 'San Francisco, CA', companySize: '50-200', verified: true, isActive: true, website: 'https://techventures.com', description: 'Leading technology innovation company' },
    { name: 'CloudCorp', slug: 'cloudcorp', industry: 'Cloud Computing', location: 'Seattle, WA', companySize: '200-500', verified: true, isActive: true, website: 'https://cloudcorp.io', description: 'Enterprise cloud solutions provider' },
    { name: 'InnoSoft Ltd.', slug: 'innosoft', industry: 'Software', location: 'Austin, TX', companySize: '50-200', verified: true, isActive: true, website: 'https://innosoft.dev', description: 'Software development and consulting' },
    { name: 'DataFlow Analytics', slug: 'dataflow', industry: 'Data Analytics', location: 'New York, NY', companySize: '50-200', verified: true, isActive: true, website: 'https://dataflow.ai', description: 'AI-powered data analytics platform' },
    { name: 'Quantum Labs', slug: 'quantumlabs', industry: 'Technology', location: 'San Francisco, CA', companySize: '10-50', verified: false, isActive: true, website: 'https://quantumlabs.com', description: 'Quantum computing research and development' },
    { name: 'GreenPath Solutions', slug: 'greenpath', industry: 'Sustainability', location: 'Austin, TX', companySize: '10-50', verified: false, isActive: true, website: 'https://greenpath.eco', description: 'Sustainable technology solutions' },
    { name: 'MediCore Health', slug: 'medicore', industry: 'Healthcare', location: 'Boston, MA', companySize: '200-500', verified: false, isActive: true, website: 'https://medicore.health', description: 'Healthcare technology innovation' },
    { name: 'FinanceHub', slug: 'financehub', industry: 'Finance', location: 'Chicago, IL', companySize: '500-1000', verified: true, isActive: true, website: 'https://financehub.com', description: 'Financial technology platform' },
    { name: 'EduTech Pro', slug: 'edutechpro', industry: 'Education', location: 'Denver, CO', companySize: '50-200', verified: true, isActive: true, website: 'https://edutech.pro', description: 'EdTech platform for modern learning' },
    { name: 'SuspendedCorp', slug: 'suspendedcorp', industry: 'Marketing', location: 'Los Angeles, CA', companySize: '10-50', verified: false, isActive: false, website: 'https://suspendedcorp.com', description: 'Suspended company account' },
  ];

  for (const c of sampleCompanies) {
    await db.company.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Add company members
  const techventures = await db.company.findUnique({ where: { slug: 'techventures' } });
  const cloudcorp = await db.company.findUnique({ where: { slug: 'cloudcorp' } });
  const sarah = await db.user.findUnique({ where: { email: 'sarah@techventures.com' } });
  const maria = await db.user.findUnique({ where: { email: 'maria@cloudcorp.com' } });

  if (techventures && sarah) {
    await db.companyMember.upsert({
      where: { userId_companyId: { userId: sarah.id, companyId: techventures.id } },
      update: {},
      create: { userId: sarah.id, companyId: techventures.id, role: 'COMPANY_ADMIN', title: 'CEO' },
    });
  }

  if (cloudcorp && maria) {
    await db.companyMember.upsert({
      where: { userId_companyId: { userId: maria.id, companyId: cloudcorp.id } },
      update: {},
      create: { userId: maria.id, companyId: cloudcorp.id, role: 'HR_MANAGER', title: 'VP of People' },
    });
  }

  // Create sample audit logs
  const auditLogs = [
    { userId: adminUser.id, action: 'user.login', resource: 'auth', details: JSON.stringify({ method: 'email' }) },
    { userId: null, action: 'system.backup', resource: 'system', details: JSON.stringify({ type: 'daily' }) },
    { userId: adminUser.id, action: 'company.verify', resource: 'company', details: JSON.stringify({ companyName: 'TechVentures Inc.' }) },
    { userId: sarah?.id, action: 'user.register', resource: 'auth', details: JSON.stringify({ method: 'email' }) },
    { userId: adminUser.id, action: 'company.create', resource: 'company', details: JSON.stringify({ companyName: 'DataFlow Analytics' }) },
    { userId: null, action: 'system.config', resource: 'system', details: JSON.stringify({ setting: 'maintenance_mode', value: false }) },
    { userId: maria?.id, action: 'job.create', resource: 'job', details: JSON.stringify({ title: 'Senior Developer' }) },
    { userId: adminUser.id, action: 'user.suspend', resource: 'user', details: JSON.stringify({ reason: 'policy violation' }) },
    { userId: null, action: 'system.backup', resource: 'system', details: JSON.stringify({ type: 'incremental' }) },
    { userId: adminUser.id, action: 'company.suspend', resource: 'company', details: JSON.stringify({ companyName: 'SuspendedCorp' }) },
  ];

  for (const log of auditLogs) {
    await db.auditLog.create({ data: log });
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
