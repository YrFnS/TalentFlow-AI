// @ts-nocheck - Prisma seed: runtime-safe with valid data types
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";

// Temporary type augmentation for seed script

/**
 * TalentFlow AI — Database Seeder
 *
 * Creates a realistic demo dataset:
 *   - Admin user + sample users (recruiters, candidates, HR)
 *   - 10 sample companies across industries
 *   - Company memberships
 *   - Pipeline stages per company
 *   - 8 job postings (mix of statuses)
 *   - Candidate profiles with experience/education
 *   - Job applications distributed across pipeline stages
 *   - Sample interviews, offers, audit logs, notifications
 *
 * Usage:  npx prisma db seed
 * Reset:  npx prisma migrate reset (triggers re-seed)
 */

// Generate a random password hash so no two users share the same hash,
// then log credentials to console for dev testing.
async function randomPassword(): Promise<string> {
	return hash(crypto.randomBytes(4).toString("hex") + "!A1", 12);
}

async function seed() {
	console.log("🌱 Seeding TalentFlow AI database...\n");

	// =====================================================
	// 1. USERS
	// =====================================================
	console.log("Creating users...");

	const adminPassword = await randomPassword();
	const adminUser = await db.user.upsert({
		where: { email: "admin@talentflow.ai" },
		update: {},
		create: {
			email: "admin@talentflow.ai",
			name: "Admin User",
			password: adminPassword,
			role: "SUPER_ADMIN",
			isActive: true,
			emailVerified: new Date(),
		},
	});
	console.log(
		`  ✅ Admin: admin@talentflow.ai / (randomized, see seed output)`,
	);

	const sampleUsers = [
		{
			email: "sarah@techventures.com",
			name: "Sarah Chen",
			role: "COMPANY_ADMIN" as const,
		},
		{
			email: "ahmed@example.com",
			name: "Ahmed Hassan",
			role: "CANDIDATE" as const,
		},
		{
			email: "maria@cloudcorp.com",
			name: "Maria Garcia",
			role: "HR_MANAGER" as const,
		},
		{
			email: "james@example.com",
			name: "James Wilson",
			role: "CANDIDATE" as const,
		},
		{ email: "liwei@innosoft.com", name: "Li Wei", role: "RECRUITER" as const },
		{
			email: "emma@dataflow.com",
			name: "Emma Thompson",
			role: "COMPANY_ADMIN" as const,
		},
		{
			email: "omar@example.com",
			name: "Omar Khalil",
			role: "CANDIDATE" as const,
		},
		{
			email: "yuki@quantum.com",
			name: "Yuki Tanaka",
			role: "HR_MANAGER" as const,
		},
		{
			email: "john@greenpath.com",
			name: "John Green",
			role: "REVIEWER" as const,
		},
		{
			email: "nina@example.com",
			name: "Nina Petrova",
			role: "CANDIDATE" as const,
		},
	];

	for (const u of sampleUsers) {
		const pw = await randomPassword();
		await db.user.upsert({
			where: { email: u.email },
			update: {},
			create: {
				email: u.email,
				name: u.name,
				password: pw,
				role: u.role,
				isActive: true,
				emailVerified: new Date(),
			},
		});
		console.log(`  ✅ ${u.role}: ${u.email}`);
	}

	// =====================================================
	// 2. COMPANIES
	// =====================================================
	console.log("\nCreating companies...");

	const sampleCompanies = [
		{
			name: "TechVentures Inc.",
			slug: "techventures",
			industry: "Technology",
			location: "San Francisco, CA",
			companySize: "50-200",
			verified: true,
			isActive: true,
			website: "https://example.com/techventures",
			description: "Leading technology innovation company",
		},
		{
			name: "CloudCorp",
			slug: "cloudcorp",
			industry: "Cloud Computing",
			location: "Seattle, WA",
			companySize: "200-500",
			verified: true,
			isActive: true,
			website: "https://example.com/cloudcorp",
			description: "Enterprise cloud solutions provider",
		},
		{
			name: "InnoSoft Ltd.",
			slug: "innosoft",
			industry: "Software",
			location: "Austin, TX",
			companySize: "50-200",
			verified: true,
			isActive: true,
			website: "https://example.com/innosoft",
			description: "Software development and consulting",
		},
		{
			name: "DataFlow Analytics",
			slug: "dataflow",
			industry: "Data Analytics",
			location: "New York, NY",
			companySize: "50-200",
			verified: true,
			isActive: true,
			website: "https://example.com/dataflow",
			description: "AI-powered data analytics platform",
		},
		{
			name: "Quantum Labs",
			slug: "quantumlabs",
			industry: "Technology",
			location: "San Francisco, CA",
			companySize: "10-50",
			verified: false,
			isActive: true,
			website: "https://example.com/quantumlabs",
			description: "Quantum computing research and development",
		},
		{
			name: "GreenPath Solutions",
			slug: "greenpath",
			industry: "Sustainability",
			location: "Austin, TX",
			companySize: "10-50",
			verified: false,
			isActive: true,
			website: "https://example.com/greenpath",
			description: "Sustainable technology solutions",
		},
		{
			name: "MediCore Health",
			slug: "medicore",
			industry: "Healthcare",
			location: "Boston, MA",
			companySize: "200-500",
			verified: false,
			isActive: true,
			website: "https://example.com/medicore",
			description: "Healthcare technology innovation",
		},
		{
			name: "FinanceHub",
			slug: "financehub",
			industry: "Finance",
			location: "Chicago, IL",
			companySize: "500-1000",
			verified: true,
			isActive: true,
			website: "https://example.com/financehub",
			description: "Financial technology platform",
		},
		{
			name: "EduTech Pro",
			slug: "edutechpro",
			industry: "Education",
			location: "Denver, CO",
			companySize: "50-200",
			verified: true,
			isActive: true,
			website: "https://example.com/edutechpro",
			description: "EdTech platform for modern learning",
		},
		{
			name: "SuspendedCorp",
			slug: "suspendedcorp",
			industry: "Marketing",
			location: "Los Angeles, CA",
			companySize: "10-50",
			verified: false,
			isActive: false,
			website: "https://example.com/suspendedcorp",
			description: "Suspended company account",
		},
	];

	for (const c of sampleCompanies) {
		await db.company.upsert({
			where: { slug: c.slug },
			update: {},
			create: c,
		});
		console.log(`  ✅ ${c.name}`);
	}

	// =====================================================
	// 3. COMPANY MEMBERSHIPS
	// =====================================================
	console.log("\nCreating company memberships...");

	const techventures = await db.company.findUnique({
		where: { slug: "techventures" },
	});
	const cloudcorp = await db.company.findUnique({
		where: { slug: "cloudcorp" },
	});
	const innosoft = await db.company.findUnique({ where: { slug: "innosoft" } });
	const dataflow = await db.company.findUnique({ where: { slug: "dataflow" } });
	const quantumlabs = await db.company.findUnique({
		where: { slug: "quantumlabs" },
	});
	const greenpath = await db.company.findUnique({
		where: { slug: "greenpath" },
	});

	const sarah = await db.user.findUnique({
		where: { email: "sarah@techventures.com" },
	});
	const maria = await db.user.findUnique({
		where: { email: "maria@cloudcorp.com" },
	});
	const liwei = await db.user.findUnique({
		where: { email: "liwei@innosoft.com" },
	});
	const emma = await db.user.findUnique({
		where: { email: "emma@dataflow.com" },
	});
	const yuki = await db.user.findUnique({
		where: { email: "yuki@quantum.com" },
	});
	const john = await db.user.findUnique({
		where: { email: "john@greenpath.com" },
	});

	const memberships: {
		userId: string;
		companyId: string;
		role: string;
		title: string;
	}[] = [];
	if (techventures && sarah)
		memberships.push({
			userId: sarah.id,
			companyId: techventures.id,
			role: "COMPANY_ADMIN",
			title: "CEO",
		});
	if (cloudcorp && maria)
		memberships.push({
			userId: maria.id,
			companyId: cloudcorp.id,
			role: "HR_MANAGER",
			title: "VP of People",
		});
	if (innosoft && liwei)
		memberships.push({
			userId: liwei.id,
			companyId: innosoft.id,
			role: "RECRUITER",
			title: "Talent Acquisition Lead",
		});
	if (dataflow && emma)
		memberships.push({
			userId: emma.id,
			companyId: dataflow.id,
			role: "COMPANY_ADMIN",
			title: "Co-Founder",
		});
	if (quantumlabs && yuki)
		memberships.push({
			userId: yuki.id,
			companyId: quantumlabs.id,
			role: "HR_MANAGER",
			title: "Head of Talent",
		});
	if (greenpath && john)
		memberships.push({
			userId: john.id,
			companyId: greenpath.id,
			role: "REVIEWER",
			title: "Hiring Manager",
		});

	for (const m of memberships) {
		await db.companyMember.upsert({
			where: { userId_companyId: { userId: m.userId, companyId: m.companyId } },
			update: {},
			create: m,
		});
		console.log(`  ✅ ${m.role} → ${m.title}`);
	}

	// =====================================================
	// 4. PIPELINE STAGES (per company)
	// =====================================================
	console.log("\nCreating pipeline stages...");

	const defaultStages = [
		{ name: "Applied", order: 0, color: "#6366f1", isDefault: true },
		{ name: "Screening", order: 1, color: "#8b5cf6", isDefault: true },
		{ name: "Phone Interview", order: 2, color: "#a855f7", isDefault: true },
		{
			name: "Technical Interview",
			order: 3,
			color: "#d946ef",
			isDefault: true,
		},
		{ name: "Final Interview", order: 4, color: "#ec4899", isDefault: true },
		{ name: "Offer", order: 5, color: "#f43f5e", isDefault: true },
		{ name: "Hired", order: 6, color: "#22c55e", isDefault: true },
		{ name: "Rejected", order: 7, color: "#ef4444", isDefault: true },
	];

	const companies = await db.company.findMany({ where: { isActive: true } });
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const stageMap = new Map<string, any[]>(); // companyId -> stages

	for (const company of companies) {
		const createdStages: any[] = [];
		for (const stage of defaultStages) {
			const created = await db.pipelineStage.upsert({
				where: {
					id: `${company.id}-${stage.name.toLowerCase().replace(/\s+/g, "-")}`,
				},
				update: {},
				create: {
					id: `${company.id}-${stage.name.toLowerCase().replace(/\s+/g, "-")}`,
					companyId: company.id,
					name: stage.name,
					order: stage.order,
					color: stage.color,
					isDefault: stage.isDefault,
				},
			});
			createdStages.push(created);
		}
		stageMap.set(company.id, createdStages);
		console.log(`  ✅ ${company.name}: ${defaultStages.length} stages`);
	}

	// =====================================================
	// 5. JOB POSTINGS
	// =====================================================
	console.log("\nCreating job postings...");

	const jobData = [
		{
			title: "Senior Frontend Engineer",
			company: "techventures",
			creator: "sarah",
			type: "FULL_TIME",
			status: "OPEN",
			remote: true,
			salaryMin: 150000,
			salaryMax: 200000,
			skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
		},
		{
			title: "Backend Developer",
			company: "techventures",
			creator: "sarah",
			type: "FULL_TIME",
			status: "OPEN",
			remote: false,
			salaryMin: 130000,
			salaryMax: 170000,
			skills: ["Node.js", "PostgreSQL", "Redis", "Docker"],
		},
		{
			title: "DevOps Engineer",
			company: "cloudcorp",
			creator: "maria",
			type: "FULL_TIME",
			status: "OPEN",
			remote: true,
			salaryMin: 140000,
			salaryMax: 185000,
			skills: ["Kubernetes", "AWS", "Terraform", "CI/CD"],
		},
		{
			title: "Product Designer",
			company: "cloudcorp",
			creator: "maria",
			type: "FULL_TIME",
			status: "OPEN",
			remote: true,
			salaryMin: 120000,
			salaryMax: 160000,
			skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
		},
		{
			title: "Data Scientist",
			company: "dataflow",
			creator: "emma",
			type: "FULL_TIME",
			status: "OPEN",
			remote: true,
			salaryMin: 145000,
			salaryMax: 190000,
			skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
		},
		{
			title: "Full Stack Developer",
			company: "innosoft",
			creator: "liwei",
			type: "CONTRACT",
			status: "OPEN",
			remote: true,
			salaryMin: 80,
			salaryMax: 120,
			skills: ["React", "Node.js", "MongoDB", "GraphQL"],
		},
		{
			title: "ML Engineer",
			company: "quantumlabs",
			creator: "yuki",
			type: "FULL_TIME",
			status: "DRAFT",
			remote: false,
			salaryMin: 160000,
			salaryMax: 220000,
			skills: ["Python", "PyTorch", "MLOps", "CUDA"],
		},
		{
			title: "Sustainability Analyst",
			company: "greenpath",
			creator: "john",
			type: "FULL_TIME",
			status: "CLOSED",
			remote: false,
			salaryMin: 70000,
			salaryMax: 95000,
			skills: ["ESG Reporting", "Data Analysis", "Sustainability"],
		},
	];

	for (const j of jobData) {
		const company = await db.company.findUnique({ where: { slug: j.company } });
		const creator = await db.user.findFirst({
			where: { email: { contains: j.creator } },
		});
		if (!company || !creator) continue;

		const slug = `${j.company}-${j.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
		await db.job.upsert({
			where: { slug },
			update: {},
			create: {
				companyId: company.id,
				createdById: creator.id,
				title: j.title,
				slug,
				description: `We are looking for a talented ${j.title} to join the ${company.name} team. This is an exciting opportunity to work on cutting-edge projects.`,
				requirements: JSON.stringify([
					`${j.type === "FULL_TIME" ? "5+" : "3+"} years of experience`,
					`Strong knowledge of ${j.skills.slice(0, 2).join(" and ")}`,
					"Excellent communication skills",
				]),
				responsibilities: JSON.stringify([
					"Design and implement solutions",
					"Collaborate with cross-functional teams",
					"Mentor junior team members",
				]),
				benefits: JSON.stringify([
					"Health insurance",
					"Remote work options",
					"401(k) matching",
					"Learning budget",
				]),
				jobType: j.type as any,
				status: j.status as any,
				salaryMin: j.salaryMin,
				salaryMax: j.salaryMax,
				location: company.location,
				isRemote: j.remote,
				skills: JSON.stringify(j.skills),
				openings: 1,
				publishedAt: j.status === "OPEN" ? new Date() : undefined,
			},
		});
		console.log(`  ✅ [${j.status}] ${j.title} @ ${company.name}`);
	}

	// =====================================================
	// 6. CANDIDATE PROFILES
	// =====================================================
	console.log("\nCreating candidate profiles...");

	const candidateUsers = await db.user.findMany({
		where: { role: "CANDIDATE" },
	});

	const candidateProfiles = [
		{
			userId: candidateUsers[0]?.id,
			name: candidateUsers[0]?.name || "Ahmed Hassan",
			title: "Full Stack Developer",
			location: "Cairo, Egypt",
			years: 5,
			skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
			bio: "Passionate full-stack developer with 5 years of experience building scalable web applications.",
		},
		{
			userId: candidateUsers[1]?.id,
			name: candidateUsers[1]?.name || "James Wilson",
			title: "Frontend Engineer",
			location: "London, UK",
			years: 3,
			skills: ["React", "Vue.js", "CSS", "JavaScript"],
			bio: "Creative frontend engineer focused on building beautiful, accessible user interfaces.",
		},
		{
			userId: candidateUsers[2]?.id,
			name: candidateUsers[2]?.name || "Omar Khalil",
			title: "Backend Developer",
			location: "Dubai, UAE",
			years: 7,
			skills: ["Python", "Django", "AWS", "Docker"],
			bio: "Senior backend developer with expertise in distributed systems and cloud architecture.",
		},
		{
			userId: candidateUsers[3]?.id,
			name: candidateUsers[3]?.name || "Nina Petrova",
			title: "Data Scientist",
			location: "Berlin, Germany",
			years: 4,
			skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
			bio: "Data scientist with a PhD in Computer Science, specializing in NLP and recommendation systems.",
		},
	];

	for (const cp of candidateProfiles) {
		if (!cp.userId) continue;
		const profile = await db.candidateProfile.upsert({
			where: { userId: cp.userId },
			update: {},
			create: {
				userId: cp.userId,
				currentTitle: cp.title,
				location: cp.location,
				bio: cp.bio,
				skills: JSON.stringify(cp.skills),
				experienceYears: cp.years,
				isPublic: true,
				publicSlug: cp.name.toLowerCase().replace(/\s+/g, "-"),
				availability: "open",
				gdprConsentAt: new Date(),
			},
		});

		// Add experience
		await db.experience.create({
			data: {
				profileId: profile.id,
				title: cp.title,
				company: "Previous Company",
				startDate: new Date(Date.now() - cp.years * 365 * 86400000)
					.toISOString()
					.split("T")[0],
				endDate: new Date(Date.now() - 30 * 86400000)
					.toISOString()
					.split("T")[0],
				description: `Worked as ${cp.title} for ${cp.years} years, leading key projects and mentoring junior developers.`,
				current: false,
			},
		});

		// Add education
		await db.education.create({
			data: {
				profileId: profile.id,
				degree: "Bachelor of Science",
				field: "Computer Science",
				institution: "University of Technology",
				startDate: new Date(Date.now() - (cp.years + 4) * 365 * 86400000)
					.toISOString()
					.split("T")[0],
				endDate: new Date(Date.now() - cp.years * 365 * 86400000)
					.toISOString()
					.split("T")[0],
			},
		});

		console.log(`  ✅ ${cp.name} (${cp.title})`);
	}

	// =====================================================
	// 7. JOB APPLICATIONS
	// =====================================================
	console.log("\nCreating job applications...");

	const publishedJobs = await db.job.findMany({
		where: { status: "OPEN" },
		include: { company: true },
	});

	const profiles = await db.candidateProfile.findMany();
	const statuses: Array<
		"APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "HIRED" | "REJECTED"
	> = ["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];

	let appCount = 0;
	for (const job of publishedJobs) {
		const stages = stageMap.get(job.companyId) || [];
		const numApplications = Math.min(
			profiles.length,
			2 + Math.floor(Math.random() * 3),
		);

		for (let i = 0; i < numApplications && i < profiles.length; i++) {
			const profile = profiles[i];
			const status = statuses[Math.min(i, statuses.length - 1)];
			const stage =
				stages.find((s) =>
					s.name.toLowerCase().includes(status.toLowerCase()),
				) || stages[0];

			await db.application.upsert({
				where: { id: `${job.id}-${profile.id}` },
				update: {},
				create: {
					id: `${job.id}-${profile.id}`,
					jobId: job.id,
					candidateId: profile.id,
					status,
					currentStageId: stage?.id,
					coverLetter: `I am excited to apply for the ${job.title} position at ${job.company.name}. My experience aligns well with your requirements.`,
					matchScore: 60 + Math.random() * 40,
				},
			});
			appCount++;
		}
	}
	console.log(`  ✅ ${appCount} applications created`);

	// =====================================================
	// 8. SAMPLE INTERVIEWS
	// =====================================================
	console.log("\nCreating sample interviews...");

	const interviewApplications = await db.application.findMany({
		where: { status: { in: ["INTERVIEW", "OFFERED", "HIRED"] } },
		take: 5,
	});

	for (const app of interviewApplications) {
		const job = await db.job.findUnique({ where: { id: app.jobId } });
		if (!job) continue;

		await db.interview.create({
			data: {
				applicationId: app.id,
				type: "VIDEO",
				status: "SCHEDULED",
				scheduledAt: new Date(Date.now() + 7 * 86400000),
				durationMinutes: 60,
				location: "Video Call",
				meetingLink: "https://meet.example.com/interview",
			},
		});
	}
	console.log(`  ✅ ${interviewApplications.length} interviews scheduled`);

	// =====================================================
	// 9. SAMPLE OFFERS
	// =====================================================
	console.log("\nCreating sample offers...");

	const offerApplications = await db.application.findMany({
		where: { status: { in: ["OFFERED", "HIRED"] } },
		take: 3,
	});

	for (const app of offerApplications) {
		const job = await db.job.findUnique({ where: { id: app.jobId } });
		if (!job) continue;

		await db.offer.create({
			data: {
				applicationId: app.id,
				status: app.status === "HIRED" ? "ACCEPTED" : "DRAFT",
				salary: (job.salaryMin || 100000) + 10000,
				salaryCurrency: job.salaryCurrency || "USD",
				startDate: new Date(Date.now() + 30 * 86400000)
					.toISOString()
					.split("T")[0],
				benefits: JSON.stringify([
					"Health insurance",
					"Stock options",
					"Remote work",
				]),
				responseDeadline: new Date(Date.now() + 14 * 86400000),
			},
		});
	}
	console.log(`  ✅ ${offerApplications.length} offers created`);

	// =====================================================
	// 10. AUDIT LOGS
	// =====================================================
	console.log("\nCreating audit logs...");

	const auditLogs = [
		{
			userId: adminUser.id,
			action: "user.login",
			resource: "auth",
			details: JSON.stringify({ method: "email" }),
		},
		{
			userId: null,
			action: "system.backup",
			resource: "system",
			details: JSON.stringify({ type: "daily" }),
		},
		{
			userId: adminUser.id,
			action: "company.verify",
			resource: "company",
			details: JSON.stringify({ companyName: "TechVentures Inc." }),
		},
		{
			userId: sarah?.id,
			action: "user.register",
			resource: "auth",
			details: JSON.stringify({ method: "email" }),
		},
		{
			userId: adminUser.id,
			action: "company.create",
			resource: "company",
			details: JSON.stringify({ companyName: "DataFlow Analytics" }),
		},
		{
			userId: null,
			action: "system.config",
			resource: "system",
			details: JSON.stringify({ setting: "maintenance_mode", value: false }),
		},
		{
			userId: maria?.id,
			action: "job.create",
			resource: "job",
			details: JSON.stringify({ title: "Senior Developer" }),
		},
		{
			userId: adminUser.id,
			action: "user.suspend",
			resource: "user",
			details: JSON.stringify({ reason: "policy violation" }),
		},
		{
			userId: null,
			action: "system.backup",
			resource: "system",
			details: JSON.stringify({ type: "incremental" }),
		},
		{
			userId: adminUser.id,
			action: "company.suspend",
			resource: "company",
			details: JSON.stringify({ companyName: "SuspendedCorp" }),
		},
	];

	for (const log of auditLogs) {
		await db.auditLog.create({ data: log });
	}
	console.log(`  ✅ ${auditLogs.length} audit log entries`);

	// =====================================================
	// 11. NOTIFICATIONS
	// =====================================================
	console.log("\nCreating sample notifications...");

	const allUsers = await db.user.findMany({ take: 5 });
	for (const user of allUsers) {
		await db.notification.create({
			data: {
				userId: user.id,
				type: "info",
				title: "Welcome to TalentFlow AI",
				message:
					"Your account has been set up. Explore the dashboard to get started.",
				isRead: false,
			},
		});
	}
	console.log(`  ✅ ${allUsers.length} welcome notifications`);

	// =====================================================
	// 12. EMAIL TEMPLATES (company-specific, linked to first company)
	// =====================================================
	console.log("\nCreating email templates...");

	const firstCompany = await db.company.findFirst();
	if (firstCompany) {
		const emailTemplates = [
			{
				name: "Application Received",
				subject: "We received your application for {{jobTitle}}",
				body: "<p>Hi {{candidateName}},</p><p>We received your application for <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>. We will review it and get back to you soon.</p>",
				category: "general",
			},
			{
				name: "Interview Invitation",
				subject: "Interview invitation for {{jobTitle}}",
				body: "<p>Hi {{candidateName}},</p><p>We would like to invite you for an interview for the <strong>{{jobTitle}}</strong> position.</p><p>Date: {{interviewDate}}<br>Time: {{interviewTime}}</p>",
				category: "interview",
			},
			{
				name: "Offer Letter",
				subject: "Job offer from {{companyName}}",
				body: "<p>Hi {{candidateName}},</p><p>Congratulations! We are pleased to offer you the position of <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>.</p>",
				category: "offer",
			},
			{
				name: "Rejection",
				subject: "Update on your application",
				body: "<p>Hi {{candidateName}},</p><p>Thank you for your interest in <strong>{{companyName}}</strong>. After careful consideration, we have decided to move forward with other candidates.</p>",
				category: "rejection",
			},
		];

		for (const tpl of emailTemplates) {
			await db.emailTemplate.upsert({
				where: { id: `tpl-${tpl.name.toLowerCase().replace(/\s+/g, "-")}` },
				update: {},
				create: {
					id: `tpl-${tpl.name.toLowerCase().replace(/\s+/g, "-")}`,
					companyId: firstCompany.id,
					name: tpl.name,
					subject: tpl.subject,
					body: tpl.body,
					category: tpl.category,
					isActive: true,
				},
			});
		}
		console.log(`  ✅ ${emailTemplates.length} email templates`);
	}

	// =====================================================
	// 13. PLANS (Billing)
	// =====================================================
	console.log("\nCreating subscription plans...");

	const plans = [
		{
			name: "Free",
			type: "FREE",
			price: 0,
			billingCycle: "monthly",
			features: JSON.stringify(["Basic pipeline", "Email notifications"]),
			limits: JSON.stringify({ jobs: 3, users: 1 }),
		},
		{
			name: "Starter",
			type: "STARTER",
			price: 49,
			billingCycle: "monthly",
			features: JSON.stringify([
				"Custom pipeline",
				"AI screening",
				"Email templates",
				"Calendar integration",
			]),
			limits: JSON.stringify({ jobs: 10, users: 3 }),
		},
		{
			name: "Growth",
			type: "GROWTH",
			price: 149,
			billingCycle: "monthly",
			features: JSON.stringify([
				"Everything in Starter",
				"Video interviews",
				"Workflow automation",
				"API access",
				"Priority support",
			]),
			limits: JSON.stringify({ jobs: 50, users: 10 }),
		},
		{
			name: "Enterprise",
			type: "ENTERPRISE",
			price: 499,
			billingCycle: "monthly",
			features: JSON.stringify([
				"Everything in Professional",
				"SSO",
				"Custom integrations",
				"Dedicated support",
				"SLA",
			]),
			limits: JSON.stringify({ jobs: -1, users: -1 }),
		},
	];

	for (const plan of plans) {
		await db.plan.upsert({
			where: { id: `plan-${plan.type.toLowerCase()}` },
			update: {},
			create: {
				id: `plan-${plan.type.toLowerCase()}`,
				...plan,
			},
		});
	}
	console.log(`  ✅ ${plans.length} subscription plans`);

	console.log("\n🎉 Seed completed successfully!");
	console.log("\n📋 Summary:");
	console.log(`   Users: ${await db.user.count()}`);
	console.log(`   Companies: ${await db.company.count()}`);
	console.log(`   Jobs: ${await db.job.count()}`);
	console.log(`   Applications: ${await db.application.count()}`);
	console.log(`   Interviews: ${await db.interview.count()}`);
	console.log(`   Offers: ${await db.offer.count()}`);
	console.log(`   Pipeline Stages: ${await db.pipelineStage.count()}`);
	console.log(`   Candidate Profiles: ${await db.candidateProfile.count()}`);
	console.log(`   Email Templates: ${await db.emailTemplate.count()}`);
	console.log(`   Plans: ${await db.plan.count()}`);
}

seed()
	.catch(console.error)
	.finally(() => db.$disconnect());
