import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-guard';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security';
import { handleApiError } from '@/lib/security/error-handler';

export async function POST(request: NextRequest) {
  // Auth: Only admins can seed the database
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // Rate limiting
  const clientIp = getClientIp(request.headers);
  const rateResult = checkRateLimit(`seed:${clientIp}:${auth.userId}`, RATE_LIMITS.SEED);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many seed requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    // Check if data already exists AND has jobs
    const existingCompany = await db.company.findFirst();
    if (existingCompany) {
      const jobCount = await db.job.count({ where: { companyId: existingCompany.id } });
      if (jobCount > 0) {
        return NextResponse.json({ message: 'Database already seeded', companyId: existingCompany.id });
      }
      // Company exists but no jobs - continue seeding with existing company
    }

    // Create or use existing company
    let company = existingCompany;
    if (!company) {
      company = await db.company.create({
        data: {
          name: 'TechVision Inc.',
          slug: 'techvision-inc',
          description: 'Leading technology innovation company specializing in AI and cloud solutions.',
          website: 'https://techvision.example.com',
          industry: 'Technology',
          companySize: '51-200',
          location: 'San Francisco, CA',
          verified: true,
        },
      });
    }

    // Create admin user (for admin portal access)
    const adminPassword = await bcrypt.hash('admin123', 12);
    let adminUser = await db.user.findFirst({ where: { email: 'admin@talentflow.ai' } });
    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          email: 'admin@talentflow.ai',
          name: 'Admin User',
          password: adminPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          locale: 'en',
        },
      });
    } else if (!adminUser.password) {
      await db.user.update({ where: { id: adminUser.id }, data: { password: adminPassword } });
    }

    // Check if HR user already exists
    const hrPassword = await bcrypt.hash('hr123456', 12);
    let hrUser = await db.user.findFirst({ where: { email: 'sarah.chen@techvision.com' } });
    if (!hrUser) {
      hrUser = await db.user.create({
        data: {
          email: 'sarah.chen@techvision.com',
          name: 'Sarah Chen',
          password: hrPassword,
          role: 'HR_MANAGER',
          isActive: true,
          locale: 'en',
        },
      });

      // Create company member
      await db.companyMember.create({
        data: {
          userId: hrUser.id,
          companyId: company.id,
          role: 'HR_MANAGER',
          title: 'Head of HR',
        },
      });
    }

    // Create pipeline stages (check if already exist)
    const existingStages = await db.pipelineStage.findMany({ where: { companyId: company.id } });
    const createdStages = [];
    if (existingStages.length === 0) {
      const stages = [
        { name: 'Applied', order: 1, color: '#14b8a6', isDefault: true },
        { name: 'Screening', order: 2, color: '#06b6d4', isDefault: false },
        { name: 'Interview', order: 3, color: '#f59e0b', isDefault: false },
        { name: 'Offer', order: 4, color: '#8b5cf6', isDefault: false },
        { name: 'Hired', order: 5, color: '#10b981', isDefault: false },
        { name: 'Rejected', order: 6, color: '#ef4444', isDefault: false },
      ];
      for (const stage of stages) {
        const s = await db.pipelineStage.create({
          data: { ...stage, companyId: company.id },
        });
        createdStages.push(s);
      }
    } else {
      createdStages.push(...existingStages);
    }

    // Create candidate users and profiles (check if already exist)
    const existingCandidates = await db.candidateProfile.findMany({
      include: { user: true },
    });
    const candidates = [];
    if (existingCandidates.length === 0) {
      const candidateData = [
        { name: 'Alex Johnson', email: 'alex.j@email.com', title: 'Senior Software Engineer', skills: '["React", "TypeScript", "Node.js", "Python", "AWS"]', years: 8, location: 'San Francisco, CA' },
        { name: 'Maria Garcia', email: 'maria.g@email.com', title: 'UX Designer', skills: '["Figma", "User Research", "Prototyping", "Design Systems"]', years: 5, location: 'New York, NY' },
        { name: 'James Wilson', email: 'james.w@email.com', title: 'Data Scientist', skills: '["Python", "TensorFlow", "SQL", "Statistics", "ML"]', years: 6, location: 'Austin, TX' },
        { name: 'Priya Patel', email: 'priya.p@email.com', title: 'Product Manager', skills: '["Agile", "Analytics", "Roadmapping", "Stakeholder Management"]', years: 7, location: 'Seattle, WA' },
        { name: 'David Kim', email: 'david.k@email.com', title: 'DevOps Engineer', skills: '["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS"]', years: 4, location: 'Portland, OR' },
        { name: 'Emma Thompson', email: 'emma.t@email.com', title: 'Frontend Developer', skills: '["React", "Vue.js", "CSS", "JavaScript", "Testing"]', years: 3, location: 'Chicago, IL' },
        { name: 'Omar Hassan', email: 'omar.h@email.com', title: 'Backend Engineer', skills: '["Java", "Spring Boot", "Microservices", "PostgreSQL"]', years: 9, location: 'Denver, CO' },
        { name: 'Lisa Chang', email: 'lisa.c@email.com', title: 'ML Engineer', skills: '["Python", "PyTorch", "NLP", "Computer Vision", "MLOps"]', years: 5, location: 'San Jose, CA' },
        { name: 'Ryan Murphy', email: 'ryan.m@email.com', title: 'Full Stack Developer', skills: '["React", "Node.js", "MongoDB", "GraphQL", "TypeScript"]', years: 6, location: 'Boston, MA' },
        { name: 'Sofia Rodriguez', email: 'sofia.r@email.com', title: 'QA Engineer', skills: '["Selenium", "Cypress", "Jest", "API Testing", "CI/CD"]', years: 4, location: 'Miami, FL' },
        { name: 'Nathan Lee', email: 'nathan.l@email.com', title: 'Security Engineer', skills: '["Cybersecurity", "Penetration Testing", "SIEM", "Compliance"]', years: 7, location: 'Washington, DC' },
        { name: 'Aisha Okafor', email: 'aisha.o@email.com', title: 'Technical Writer', skills: '["Documentation", "API Docs", "Markdown", "Developer Experience"]', years: 3, location: 'Atlanta, GA' },
      ];

      for (const cd of candidateData) {
        const candPassword = await bcrypt.hash('candidate123', 12);
        const user = await db.user.create({
          data: { email: cd.email, name: cd.name, password: candPassword, role: 'CANDIDATE', isActive: true, locale: 'en' },
        });
        const profile = await db.candidateProfile.create({
          data: {
            userId: user.id,
            currentTitle: cd.title,
            skills: cd.skills,
            experienceYears: cd.years,
            location: cd.location,
            bio: `Experienced ${cd.title} with ${cd.years} years of professional experience.`,
            availability: 'open',
          },
        });
        candidates.push(profile);
      }
    } else {
      candidates.push(...existingCandidates);
    }

    // Create jobs
    const jobsData = [
      { title: 'Senior Frontend Engineer', slug: 'senior-frontend-engineer', description: 'We are looking for a Senior Frontend Engineer to join our growing team. You will be responsible for building and maintaining our web applications using modern frameworks and best practices.', jobType: 'FULL_TIME', salaryMin: 140000, salaryMax: 180000, location: 'San Francisco, CA', isRemote: false, experienceMin: 5, experienceMax: 10, skills: '["React", "TypeScript", "CSS", "Testing", "GraphQL"]', openings: 2, status: 'OPEN', requirements: '["5+ years of frontend development experience", "Strong proficiency in React and TypeScript", "Experience with modern CSS frameworks", "Understanding of web performance optimization", "Excellent communication skills"]', benefits: '["Competitive salary and equity", "Health, dental, and vision insurance", "401(k) matching", "Flexible PTO", "Learning budget"]' },
      { title: 'Product Designer', slug: 'product-designer', description: 'Join our design team to create beautiful, intuitive experiences for our users. You will work closely with product managers and engineers to shape the future of our platform.', jobType: 'FULL_TIME', salaryMin: 120000, salaryMax: 160000, location: 'New York, NY', isRemote: true, experienceMin: 3, experienceMax: 7, skills: '["Figma", "User Research", "Prototyping", "Design Systems", "Accessibility"]', openings: 1, status: 'OPEN', requirements: '["3+ years of product design experience", "Proficiency in Figma", "Strong portfolio demonstrating UX/UI skills", "Experience with design systems", "Understanding of accessibility standards"]', benefits: '["Competitive salary", "Remote-friendly", "Design tool subscriptions", "Conference budget", "Wellness stipend"]' },
      { title: 'Data Engineer', slug: 'data-engineer', description: 'Build and maintain our data infrastructure. Design ETL pipelines, optimize data storage, and ensure data quality across the organization.', jobType: 'FULL_TIME', salaryMin: 130000, salaryMax: 170000, location: 'Austin, TX', isRemote: true, experienceMin: 4, experienceMax: 8, skills: '["Python", "Spark", "SQL", "Airflow", "AWS"]', openings: 1, status: 'OPEN', requirements: '["4+ years in data engineering", "Strong SQL and Python skills", "Experience with big data technologies", "Cloud platform expertise (AWS/GCP)", "Data modeling experience"]', benefits: '["Competitive compensation", "Stock options", "Remote-first culture", "Professional development budget", "Health benefits"]' },
      { title: 'DevOps Lead', slug: 'devops-lead', description: 'Lead our DevOps team in building and maintaining our cloud infrastructure. Implement CI/CD pipelines, manage Kubernetes clusters, and ensure system reliability.', jobType: 'FULL_TIME', salaryMin: 150000, salaryMax: 200000, location: 'Seattle, WA', isRemote: false, experienceMin: 6, experienceMax: 12, skills: '["Docker", "Kubernetes", "Terraform", "CI/CD", "AWS"]', openings: 1, status: 'OPEN', requirements: '["6+ years DevOps experience", "Expert in Kubernetes and Docker", "Strong infrastructure-as-code skills", "Monitoring and observability expertise", "Leadership experience"]', benefits: '["Top-tier compensation", "Equity package", "Health and wellness benefits", "Education reimbursement", "Sabbatical program"]' },
      { title: 'ML Research Scientist', slug: 'ml-research-scientist', description: 'Conduct cutting-edge research in machine learning and AI. Publish papers, develop novel algorithms, and collaborate with engineering teams to bring research to production.', jobType: 'FULL_TIME', salaryMin: 160000, salaryMax: 220000, location: 'San Jose, CA', isRemote: false, experienceMin: 3, experienceMax: 8, skills: '["PyTorch", "NLP", "Computer Vision", "Research", "Python"]', openings: 2, status: 'OPEN', requirements: '["PhD in CS or related field", "Publications in top-tier venues", "Strong programming skills", "Experience with deep learning frameworks", "Collaborative mindset"]', benefits: '["Industry-leading compensation", "Research freedom", "Conference travel budget", "GPU credits", "Publication support"]' },
      { title: 'Technical Program Manager', slug: 'technical-program-manager', description: 'Drive cross-functional programs from conception to delivery. Work with engineering, product, and design teams to deliver complex technical projects.', jobType: 'FULL_TIME', salaryMin: 140000, salaryMax: 180000, location: 'Chicago, IL', isRemote: true, experienceMin: 5, experienceMax: 10, skills: '["Agile", "Jira", "Stakeholder Management", "Risk Management", "Communication"]', openings: 1, status: 'DRAFT', requirements: '["5+ years in technical program management", "Strong technical background", "Excellent communication skills", "Experience with Agile methodologies", "Cross-functional team leadership"]', benefits: '["Competitive salary", "Work from anywhere", "Annual team retreats", "Learning and development", "Parental leave"]' },
      { title: 'QA Automation Engineer', slug: 'qa-automation-engineer', description: 'Design and implement automated testing frameworks. Ensure the quality of our products through comprehensive test coverage and CI/CD integration.', jobType: 'CONTRACT', salaryMin: 100000, salaryMax: 140000, location: 'Miami, FL', isRemote: true, experienceMin: 3, experienceMax: 6, skills: '["Selenium", "Cypress", "Jest", "API Testing", "Python"]', openings: 1, status: 'PAUSED', requirements: '["3+ years QA automation experience", "Proficiency in test frameworks", "API testing expertise", "CI/CD integration knowledge", "Performance testing experience"]', benefits: '["Hourly rate", "Flexible hours", "Remote work", "Potential for conversion", "Learning resources"]' },
      { title: 'Backend Engineer - Go', slug: 'backend-engineer-go', description: 'Build high-performance backend services using Go. Design APIs, optimize database queries, and ensure system scalability.', jobType: 'FULL_TIME', salaryMin: 135000, salaryMax: 175000, location: 'Denver, CO', isRemote: false, experienceMin: 4, experienceMax: 8, skills: '["Go", "Microservices", "PostgreSQL", "gRPC", "Docker"]', openings: 2, status: 'CLOSED', requirements: '["4+ years backend development", "Strong Go programming skills", "Microservices architecture experience", "Database design expertise", "API design best practices"]', benefits: '["Competitive salary", "Equity", "Health benefits", "401(k)", "Gym membership"]' },
    ];

    const createdJobs = [];
    for (const jd of jobsData) {
      const job = await db.job.create({
        data: {
          ...jd,
          companyId: company.id,
          createdById: hrUser.id,
          salaryCurrency: 'USD',
          publishedAt: jd.status === 'OPEN' ? new Date() : null,
        },
      });
      createdJobs.push(job);
    }

    // Create applications with various statuses
    const applicationStatuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];
    const applications = [];
    let appIndex = 0;
    for (const job of createdJobs) {
      const numApps = Math.min(3 + Math.floor(Math.random() * 4), candidates.length);
      for (let i = 0; i < numApps && appIndex < candidates.length; i++) {
        const status = applicationStatuses[Math.floor(Math.random() * applicationStatuses.length)];
        const stageIndex = applicationStatuses.indexOf(status);
        const currentStageId = stageIndex < createdStages.length ? createdStages[stageIndex].id : createdStages[0].id;
        const matchScore = Math.round((60 + Math.random() * 40) * 10) / 10;

        const app = await db.application.create({
          data: {
            jobId: job.id,
            candidateId: candidates[appIndex].id,
            status: status as never,
            currentStageId,
            matchScore,
            source: ['direct', 'linkedin', 'referral', 'job-board'][Math.floor(Math.random() * 4)],
            appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        applications.push(app);
        appIndex++;
      }
    }

    // Audit log for seeding
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'database.seed',
        resource: 'database',
        ipAddress: clientIp,
        details: JSON.stringify({
          company: company.name,
          jobs: createdJobs.length,
          candidates: candidates.length,
          applications: applications.length,
          stages: createdStages.length,
        }),
      },
    });

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        company: company.name,
        jobs: createdJobs.length,
        candidates: candidates.length,
        applications: applications.length,
        stages: createdStages.length,
      },
    });
  } catch (error) {
    return handleApiError(error, 'DatabaseSeed');
  }
}
