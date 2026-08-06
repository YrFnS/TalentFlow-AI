import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "TalentFlowDemo!2026";
const stamp = Date.now().toString(36);
const models = new Map(Prisma.dmmf.datamodel.models.map((model) => [model.name, model]));
const enums = new Map(Prisma.dmmf.datamodel.enums.map((item) => [item.name, item.values]));
const delegate = (name) => db[name[0].toLowerCase() + name.slice(1)];

function scalarValue(model, field) {
  const key = `${model.name}-${field.name}-${stamp}`.toLowerCase();
  if (field.kind === "enum") return enums.get(field.type)?.[0]?.name ?? enums.get(field.type)?.[0];
  if (field.type === "String") {
    if (/email|\bto\b|\bfrom\b/i.test(field.name)) return `${key}@example.com`;
    if (/url|link/i.test(field.name)) return `https://example.com/${key}`;
    if (/token|secret|key/i.test(field.name)) return `demo-${key}`;
    if (/json|config|criteria|questions|answers|features|limits|steps|results|metrics|recommendations|messages|skills|benefits|conditions|requirements|responsibilities|aliases|mentions|tags|events|fields|dataRange|dateRange|adverseImpact|protectedAttributes|excludeFromScoring|matchedCandidates|enabledFeatures|leadCaptureFields|stageIds/i.test(field.name)) return "[]";
    if (/status/i.test(field.name)) return "ACTIVE";
    if (/type|category|source/i.test(field.name)) return "GENERAL";
    if (/slug/i.test(field.name)) return key;
    if (/currency/i.test(field.name)) return "USD";
    if (/date|time/i.test(field.name)) return "2026-08-06";
    return `Demo ${model.name} ${field.name}`;
  }
  if (field.type === "Int") return /order|index/i.test(field.name) ? 0 : 1;
  if (field.type === "BigInt") return 1n;
  if (field.type === "Float" || field.type === "Decimal") return 1;
  if (field.type === "Boolean") return !/disabled|declined|cancelled|expired|failed|deleted/i.test(field.name);
  if (field.type === "DateTime") return /expir|deadline|end|due/i.test(field.name) ? new Date("2027-08-06T12:00:00Z") : new Date("2026-08-06T12:00:00Z");
  if (field.type === "Bytes") return Buffer.from("demo");
  if (field.type === "Json") return {};
  return null;
}

async function buildData(model, overrides = {}) {
  const data = { ...overrides };
  for (const relation of model.fields.filter((field) => field.kind === "object" && field.isRequired && field.relationFromFields?.length)) {
    if (relation.relationFromFields.every((name) => data[name] !== undefined)) continue;
    const target = await delegate(relation.type).findFirst({ select: Object.fromEntries(relation.relationToFields.map((name) => [name, true])) });
    if (!target) throw new Error(`Missing ${relation.type} for ${model.name}.${relation.name}`);
    relation.relationFromFields.forEach((name, index) => { data[name] = target[relation.relationToFields[index]]; });
  }
  for (const field of model.fields.filter((item) => item.kind !== "object" && item.isRequired && !item.hasDefaultValue && !item.isUpdatedAt)) {
    if (data[field.name] === undefined) data[field.name] = scalarValue(model, field);
  }
  return data;
}

async function ensureEveryTable() {
  const pending = [...models.values()];
  const failures = new Map();
  while (pending.length) {
    let progressed = false;
    for (let index = pending.length - 1; index >= 0; index--) {
      const model = pending[index];
      const client = delegate(model.name);
      try {
        if (await client.count() === 0) await client.create({ data: await buildData(model) });
        pending.splice(index, 1);
        failures.delete(model.name);
        progressed = true;
      } catch (error) {
        failures.set(model.name, error instanceof Error ? error.message : String(error));
      }
    }
    if (!progressed) break;
  }
  if (pending.length) throw new Error(`Could not seed: ${pending.map((model) => `${model.name} (${failures.get(model.name)})`).join(", ")}`);
}

async function seedCoverage() {
  const password = await hash(DEMO_PASSWORD, 12);
  const roles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "COMPANY_ADMIN", "HR_MANAGER", "RECRUITER", "REVIEWER", "CANDIDATE"];
  for (const role of roles) {
    await db.user.upsert({
      where: { email: `${role.toLowerCase().replaceAll("_", ".")}@demo.talentflow.ai` },
      update: { password, role, isActive: true, emailVerified: new Date("2026-08-06T12:00:00Z") },
      create: { email: `${role.toLowerCase().replaceAll("_", ".")}@demo.talentflow.ai`, name: `Demo ${role.replaceAll("_", " ")}`, password, role, isActive: true, emailVerified: new Date("2026-08-06T12:00:00Z") },
    });
  }
  await db.user.create({ data: { email: "inactive@demo.talentflow.ai", name: "Inactive Demo User", password, role: "CANDIDATE", isActive: false } }).catch(() => {});

  const company = await db.company.findFirst({ where: { isActive: true } });
  const creator = await db.user.findFirst({ where: { role: "COMPANY_ADMIN" } });
  if (!company || !creator) throw new Error("Base company/user seed missing");

  for (const [index, status] of ["DRAFT", "OPEN", "PAUSED", "CLOSED", "ARCHIVED"].entries()) {
    await db.job.upsert({
      where: { slug: `demo-${status.toLowerCase()}-job` },
      update: { status },
      create: { companyId: company.id, createdById: creator.id, title: `Demo ${status} Job`, slug: `demo-${status.toLowerCase()}-job`, description: `Coherent ${status.toLowerCase()} job fixture`, status, jobType: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"][index], salaryMin: 50000, salaryMax: 120000, openings: index + 1 },
    });
  }
  await db.job.create({ data: { companyId: company.id, createdById: creator.id, title: "Demo Hybrid Job", slug: "demo-hybrid-job", description: "Hybrid edge-case fixture", status: "OPEN", jobType: "HYBRID", isRemote: true, salaryMin: 90000, salaryMax: 90000, openings: 1 } }).catch(() => {});

  const stage = await db.pipelineStage.findFirst({ where: { companyId: company.id } });
  const statuses = ["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN"];
  const applications = [];
  for (const status of statuses) {
    const email = `candidate.${status.toLowerCase()}@demo.talentflow.ai`;
    const user = await db.user.upsert({ where: { email }, update: { password, isActive: true }, create: { email, name: `Demo ${status} Candidate`, password, role: "CANDIDATE", isActive: true, emailVerified: new Date("2026-08-06T12:00:00Z") } });
    const profile = await db.candidateProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, currentTitle: "Software Engineer", skills: "[\"TypeScript\",\"React\"]", experienceYears: status === "APPLIED" ? 0 : 5, availability: status === "HIRED" ? "unavailable" : "open", isPublic: status !== "WITHDRAWN", publicSlug: `demo-${status.toLowerCase()}-candidate` } });
    const job = await db.job.findUnique({ where: { slug: status === "WITHDRAWN" ? "demo-hybrid-job" : "demo-open-job" } });
    const application = await db.application.upsert({ where: { jobId_candidateId: { jobId: job.id, candidateId: profile.id } }, update: { status }, create: { jobId: job.id, candidateId: profile.id, status, currentStageId: stage?.id, coverLetter: status === "WITHDRAWN" ? "" : `Application fixture in ${status}`, matchScore: status === "REJECTED" ? 0 : status === "HIRED" ? 100 : 75 } });
    applications.push(application);
  }

  for (const [index, status] of ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].entries()) {
    await db.interview.create({ data: { applicationId: applications[index % applications.length].id, type: ["PHONE", "VIDEO", "ON_SITE", "ASYNC_VIDEO"][index], status, scheduledAt: new Date(`2026-08-${10 + index}T12:00:00Z`), durationMinutes: index === 0 ? 15 : 60, rating: status === "COMPLETED" ? 5 : null } });
  }
  for (const [index, status] of ["DRAFT", "PENDING", "SENT", "ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"].entries()) {
    await db.offer.create({ data: { applicationId: applications[index % applications.length].id, status, salary: index === 0 ? 0 : 100000 + index * 5000, startDate: "2026-09-01", signingStatus: status === "ACCEPTED" ? "COMPLETED" : status, responseDeadline: new Date("2026-09-01T12:00:00Z") } });
  }

  await db.account.upsert({ where: { provider_providerAccountId: { provider: "demo", providerAccountId: "demo-super-admin" } }, update: {}, create: { userId: creator.id, type: "credentials", provider: "demo", providerAccountId: "demo-super-admin" } });
  await db.session.upsert({ where: { sessionToken: "expired-demo-session" }, update: {}, create: { sessionToken: "expired-demo-session", userId: creator.id, expires: new Date("2020-01-01T00:00:00Z") } });
  await db.verificationToken.upsert({ where: { identifier_token: { identifier: "expired@demo.talentflow.ai", token: "expired-demo-token" } }, update: {}, create: { identifier: "expired@demo.talentflow.ai", token: "expired-demo-token", expires: new Date("2020-01-01T00:00:00Z") } });

  await ensureEveryTable();
  console.log(`✅ Complete seed coverage: ${models.size} Prisma models populated`);
  console.log(`✅ Demo roles: ${roles.length}; core application states: ${statuses.length}`);
}

seedCoverage().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
