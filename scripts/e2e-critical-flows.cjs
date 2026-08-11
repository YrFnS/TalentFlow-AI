'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.E2E_BASE_URL || 'https://talent-flow-ai-six.vercel.app').replace(/\/$/, '');
const EXPECTED_COMMIT = process.env.E2E_EXPECTED_COMMIT || '';
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD;
const ARTIFACTS_DIR = path.resolve(process.env.E2E_ARTIFACTS_DIR || 'e2e-artifacts');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const NAVIGATION_TIMEOUT_MS = Number(process.env.E2E_NAVIGATION_TIMEOUT_MS || 35_000);

if (!DEMO_PASSWORD) throw new Error('E2E_DEMO_PASSWORD is required');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  expectedCommit: EXPECTED_COMMIT || null,
  deployment: {},
  publicApis: {},
  careerFlow: {},
  registration: {},
  candidate: {},
  responsive: {},
  diagnostics: [],
  issues: [],
  summary: {},
};

const issueKeys = new Set();

function addIssue(severity, scope, message, details) {
  const key = JSON.stringify([severity, scope, message, details || null]);
  if (issueKeys.has(key)) return;
  issueKeys.add(key);
  report.issues.push({ severity, scope, message, ...(details ? { details } : {}) });
}

function assert(condition, severity, scope, message, details) {
  if (!condition) addIssue(severity, scope, message, details);
  return Boolean(condition);
}

function safeFilename(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'evidence';
}

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${safeFilename(name)}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    return path.relative(ARTIFACTS_DIR, file);
  } catch (error) {
    addIssue('warning', name, 'Screenshot could not be captured', { message: error.message });
    return null;
  }
}

function attachDiagnostics(page) {
  const entries = [];

  page.on('pageerror', (error) => {
    entries.push({ type: 'pageerror', url: page.url(), message: error.message });
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon\.ico/i.test(text)) return;
    entries.push({ type: 'console-error', url: page.url(), message: text });
  });

  page.on('response', (response) => {
    try {
      if (new URL(response.url()).origin !== new URL(BASE_URL).origin) return;
      if (response.status() < 500) return;
      entries.push({
        type: 'http-5xx',
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
      });
    } catch {
      // Ignore malformed URLs from browser internals.
    }
  });

  return entries;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function goto(page, route) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await page.waitForTimeout(900);
  return response;
}

async function loginCandidate(page) {
  await goto(page, '/auth/login');
  await page.locator('#email').fill('candidate@demo.talentflow.ai');
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(
    (url) => url.pathname === '/candidate' || url.pathname.startsWith('/candidate/'),
    { timeout: NAVIGATION_TIMEOUT_MS },
  );
  await page.waitForTimeout(900);

  return page.evaluate(async () => {
    const response = await fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  });
}

async function testDeployment(page) {
  const response = await goto(page, `/?criticalFlow=${Date.now()}`);
  const deployedCommit = response?.headers()['x-deployment-commit'] || null;
  report.deployment = {
    status: response?.status() || null,
    deployedCommit,
  };

  assert(
    !EXPECTED_COMMIT || deployedCommit === EXPECTED_COMMIT,
    'critical',
    'DEPLOYMENT',
    'The browser did not reach the commit selected by CI',
    { expected: EXPECTED_COMMIT, actual: deployedCommit },
  );
}

async function testPublicApis(context) {
  const companyResponse = await context.request.get(
    `${BASE_URL}/api/public/companies/techventures`,
  );
  const companyBody = await parseJsonResponse(companyResponse);
  report.publicApis.company = {
    status: companyResponse.status(),
    body: companyBody,
  };
  assert(
    companyResponse.status() === 200 && companyBody?.slug === 'techventures' && companyBody?.name,
    'critical',
    'PUBLIC_API',
    'Public company lookup did not return TechVentures',
    report.publicApis.company,
  );

  const jobsResponse = await context.request.get(
    `${BASE_URL}/api/public/jobs?slug=techventures`,
  );
  const jobsBody = await parseJsonResponse(jobsResponse);
  report.publicApis.jobs = {
    status: jobsResponse.status(),
    count: Array.isArray(jobsBody) ? jobsBody.length : null,
    firstJobId: Array.isArray(jobsBody) ? jobsBody[0]?.id || null : null,
  };
  assert(
    jobsResponse.status() === 200 && Array.isArray(jobsBody) && jobsBody.length > 0,
    'critical',
    'PUBLIC_API',
    'Public jobs lookup returned no usable jobs',
    report.publicApis.jobs,
  );

  const firstJob = Array.isArray(jobsBody) ? jobsBody[0] : null;
  if (firstJob?.id) {
    const quickApplyResponse = await context.request.post(
      `${BASE_URL}/api/jobs/${firstJob.id}/quick-apply`,
      {
        multipart: {
          name: 'E2E Safety Check',
          email: 'e2e-retired-quick-apply@example.invalid',
          phone: '',
          website: '',
        },
      },
    );
    const quickApplyBody = await parseJsonResponse(quickApplyResponse);
    report.publicApis.retiredQuickApply = {
      status: quickApplyResponse.status(),
      body: quickApplyBody,
    };
    assert(
      quickApplyResponse.status() === 410 &&
        quickApplyBody?.code === 'AUTHENTICATED_APPLICATION_REQUIRED',
      'critical',
      'PUBLIC_API',
      'Unsafe guest quick apply is still active',
      report.publicApis.retiredQuickApply,
    );
  }

  return { company: companyBody, jobs: Array.isArray(jobsBody) ? jobsBody : [] };
}

async function testCareerFlow(page, jobs) {
  const firstJob = jobs[0];
  await goto(page, '/careers/techventures');
  await page.getByText('Open positions', { exact: true }).first().waitFor({ timeout: 15_000 });

  const jobCard = page.locator('[role="button"]').filter({ hasText: firstJob.title }).first();
  const cardFound = (await jobCard.count()) > 0;
  assert(cardFound, 'critical', 'CAREER', 'The seeded job was not rendered on the career page', {
    title: firstJob.title,
  });

  if (!cardFound) {
    report.careerFlow.screenshot = await screenshot(page, 'career-job-missing');
    return;
  }

  await jobCard.click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 });
  await page.getByRole('button', { name: 'Apply for this role', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 });

  const signInButton = page.getByRole('button', { name: 'Sign in and apply', exact: true });
  const createButton = page.getByRole('button', { name: 'Create candidate account', exact: true });
  const fakeFormCount = await page.locator('#app-name, #app-email, input[type="file"]').count();

  report.careerFlow = {
    jobId: firstJob.id,
    jobTitle: firstJob.title,
    signInHandoffVisible: (await signInButton.count()) > 0,
    createAccountHandoffVisible: (await createButton.count()) > 0,
    fakeApplicationFields: fakeFormCount,
    screenshot: await screenshot(page, 'career-authenticated-application-handoff'),
  };

  assert(
    report.careerFlow.signInHandoffVisible && report.careerFlow.createAccountHandoffVisible,
    'critical',
    'CAREER',
    'Career page did not present the authenticated application handoff',
    report.careerFlow,
  );
  assert(
    fakeFormCount === 0,
    'critical',
    'CAREER',
    'The public page still renders the old fake application form',
    { fakeFormCount },
  );

  await signInButton.click();
  await page.waitForURL((url) => url.pathname === '/auth/login', {
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  const callbackUrl = new URL(page.url()).searchParams.get('callbackUrl');
  report.careerFlow.loginCallback = callbackUrl;
  assert(
    callbackUrl === `/candidate/jobs/${firstJob.id}`,
    'high',
    'CAREER',
    'Career-page sign-in lost the selected job callback',
    { expected: `/candidate/jobs/${firstJob.id}`, actual: callbackUrl },
  );
}

async function testRegistration(page, jobId) {
  const callbackPath = `/candidate/jobs/${jobId}`;
  await goto(page, `/auth/register?callbackUrl=${encodeURIComponent(callbackPath)}`);

  const candidateOnlyVisible = await page
    .getByText('Public registration is for candidates only', { exact: true })
    .isVisible()
    .catch(() => false);
  const forbiddenRoleChoices = await page
    .getByText(/Company Account|Admin Account/i)
    .count();
  const loginHref = await page.locator('a[href^="/auth/login"]').last().getAttribute('href');

  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  const invalidFields = {
    name: await page.locator('#name').getAttribute('aria-invalid'),
    email: await page.locator('#email').getAttribute('aria-invalid'),
    password: await page.locator('#password').getAttribute('aria-invalid'),
    confirmPassword: await page.locator('#confirm-password').getAttribute('aria-invalid'),
  };

  let preservedCallback = null;
  if (loginHref) {
    preservedCallback = new URL(loginHref, BASE_URL).searchParams.get('callbackUrl');
  }

  report.registration = {
    candidateOnlyVisible,
    forbiddenRoleChoices,
    loginHref,
    preservedCallback,
    invalidFields,
    screenshot: await screenshot(page, 'candidate-only-registration-validation'),
  };

  assert(
    candidateOnlyVisible && forbiddenRoleChoices === 0,
    'critical',
    'REGISTRATION',
    'Public registration still advertises company or administrator self-signup',
    report.registration,
  );
  assert(
    Object.values(invalidFields).every((value) => value === 'true'),
    'high',
    'REGISTRATION',
    'Empty candidate registration did not mark every required field invalid',
    invalidFields,
  );
  assert(
    preservedCallback === callbackPath,
    'high',
    'REGISTRATION',
    'Registration did not preserve the selected job when linking to sign in',
    { expected: callbackPath, actual: preservedCallback },
  );
}

async function testCandidate(page) {
  const session = await loginCandidate(page);
  report.candidate.session = session;
  assert(
    session.status === 200 && session.body?.user?.role === 'CANDIDATE',
    'critical',
    'CANDIDATE',
    'Candidate credentials did not produce a candidate session',
    session,
  );

  const applications = await page.evaluate(async () => {
    const response = await fetch('/api/candidate/applications', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    return {
      status: response.status,
      body: await response.json().catch(() => null),
    };
  });
  report.candidate.applications = {
    status: applications.status,
    count: Array.isArray(applications.body) ? applications.body.length : null,
  };
  assert(
    applications.status === 200 && Array.isArray(applications.body),
    'critical',
    'CANDIDATE',
    'Candidate applications could not be loaded',
    report.candidate.applications,
  );

  const sessionId = `e2e-role-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const chatbot = await page.evaluate(
    async ({ sessionId }) => {
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const csrfBody = await csrfResponse.json().catch(() => null);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45_000);

      try {
        const response = await fetch('/api/chatbot/candidate', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfBody?.csrfToken || '',
          },
          body: JSON.stringify({
            message: 'What is the status of my latest application?',
            sessionId,
            candidateId: 'this-client-supplied-id-must-be-ignored',
            context: { page: 'candidate-dashboard', source: 'e2e-role-audit' },
            conversationHistory: [],
          }),
          signal: controller.signal,
        });
        return {
          status: response.status,
          body: await response.json().catch(() => null),
        };
      } finally {
        window.clearTimeout(timeout);
      }
    },
    { sessionId },
  );

  report.candidate.chatbot = {
    sessionId,
    status: chatbot.status,
    responseLength:
      typeof chatbot.body?.response === 'string' ? chatbot.body.response.length : 0,
    persisted: chatbot.body?.persisted ?? null,
    degraded: chatbot.body?.degraded ?? null,
    model: chatbot.body?.model ?? null,
    body: chatbot.status === 200 ? undefined : chatbot.body,
  };
  assert(
    chatbot.status === 200 &&
      typeof chatbot.body?.response === 'string' &&
      chatbot.body.response.trim().length > 0 &&
      chatbot.body.persisted === true,
    'critical',
    'CANDIDATE_CHATBOT',
    'Candidate chatbot did not return and persist a grounded response',
    report.candidate.chatbot,
  );

  report.candidate.screenshot = await screenshot(page, 'candidate-dashboard-after-chatbot');
}

async function testResponsive(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const routes = ['/auth/login', '/auth/register', '/careers/techventures'];
  const results = [];

  for (const route of routes) {
    await goto(page, route);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    results.push({ route, ...metrics, overflow: metrics.scrollWidth > metrics.clientWidth + 3 });
  }

  report.responsive.routes = results;
  assert(
    results.every((item) => !item.overflow),
    'high',
    'RESPONSIVE',
    'A public page overflows horizontally on a mobile viewport',
    results,
  );
}

function renderMarkdown() {
  const counts = report.summary.issueCounts || {};
  const lines = [
    '# TalentFlow AI critical-flow browser audit',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Deployed commit: ${report.deployment.deployedCommit || 'unknown'}`,
    `- Public jobs: ${report.publicApis.jobs?.count ?? 'unknown'}`,
    `- Candidate chatbot persisted: ${report.candidate.chatbot?.persisted === true ? 'yes' : 'no'}`,
    `- Chatbot degraded mode: ${report.candidate.chatbot?.degraded === true ? 'yes' : 'no'}`,
    `- Issues: critical ${counts.critical || 0}, high ${counts.high || 0}, warning ${counts.warning || 0}`,
    '',
    '## Checks',
    '',
    `- Public company API: ${report.publicApis.company?.status === 200 ? 'PASS' : 'FAIL'}`,
    `- Public jobs API: ${report.publicApis.jobs?.status === 200 ? 'PASS' : 'FAIL'}`,
    `- Guest quick apply retired: ${report.publicApis.retiredQuickApply?.status === 410 ? 'PASS' : 'FAIL'}`,
    `- Career application handoff: ${report.careerFlow.signInHandoffVisible ? 'PASS' : 'FAIL'}`,
    `- Candidate-only registration: ${report.registration.candidateOnlyVisible ? 'PASS' : 'FAIL'}`,
    `- Candidate session: ${report.candidate.session?.body?.user?.role === 'CANDIDATE' ? 'PASS' : 'FAIL'}`,
    `- Candidate applications API: ${report.candidate.applications?.status === 200 ? 'PASS' : 'FAIL'}`,
    `- Candidate chatbot persistence: ${report.candidate.chatbot?.persisted === true ? 'PASS' : 'FAIL'}`,
    `- Mobile overflow checks: ${report.responsive.routes?.every((item) => !item.overflow) ? 'PASS' : 'FAIL'}`,
    '',
    '## Issues',
    '',
  ];

  if (report.issues.length === 0) {
    lines.push('No critical-flow issues were detected.');
  } else {
    for (const issue of report.issues) {
      lines.push(`- **${issue.severity.toUpperCase()}** · ${issue.scope}: ${issue.message}`);
    }
  }

  lines.push('', `Chatbot cleanup session: \`${report.candidate.chatbot?.sessionId || 'none'}\``);
  return `${lines.join('\n')}\n`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);

  try {
    await testDeployment(page);
    const publicData = await testPublicApis(context);
    if (publicData.jobs.length > 0) {
      await testCareerFlow(page, publicData.jobs);
      await testRegistration(page, publicData.jobs[0].id);
    }

    await context.clearCookies();
    await page.setViewportSize({ width: 1440, height: 900 });
    await testCandidate(page);

    await context.clearCookies();
    await testResponsive(page);
  } finally {
    report.diagnostics = diagnostics;
    await context.close();
    await browser.close();
  }

  for (const entry of report.diagnostics) {
    const cspViolation = /content security policy|violates the following content security policy|refused to (?:execute|apply) inline/i.test(
      entry.message || '',
    );

    if (cspViolation) {
      addIssue('critical', 'CSP', 'Browser console reported a CSP violation', entry);
    } else if (entry.type === 'pageerror' || entry.type === 'http-5xx') {
      addIssue('high', 'BROWSER', 'Browser diagnostic reported an application failure', entry);
    } else {
      addIssue('warning', 'BROWSER', 'Browser console reported an error', entry);
    }
  }

  const issueCounts = report.issues.reduce((counts, issue) => {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    return counts;
  }, {});
  report.summary = { issueCounts };

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'critical-flows.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'critical-flows.md'), renderMarkdown());
  console.log(renderMarkdown());

  if ((issueCounts.critical || 0) > 0 || (issueCounts.high || 0) > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  addIssue('critical', 'RUNNER', 'Critical-flow runner crashed', {
    message: error.stack || error.message,
  });
  report.summary = { runnerCrashed: true };
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'critical-flows.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'critical-flows.md'),
    `# TalentFlow AI critical-flow browser audit\n\nRunner crashed: ${error.message}\n`,
  );
  console.error(error);
  process.exitCode = 1;
});
