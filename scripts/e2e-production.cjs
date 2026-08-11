'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.E2E_BASE_URL || 'https://talent-flow-ai-six.vercel.app').replace(/\/$/, '');
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD;
const ARTIFACTS_DIR = path.resolve(process.env.E2E_ARTIFACTS_DIR || 'e2e-artifacts');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const NAVIGATION_TIMEOUT_MS = Number(process.env.E2E_NAVIGATION_TIMEOUT_MS || 35_000);
const SETTLE_DELAY_MS = Number(process.env.E2E_SETTLE_DELAY_MS || 1_250);

if (!DEMO_PASSWORD) {
  throw new Error('E2E_DEMO_PASSWORD is required');
}

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const ROLE_CASES = [
  {
    role: 'SUPER_ADMIN',
    email: 'super.admin@demo.talentflow.ai',
    root: '/admin',
    routes: ['/admin', '/admin/users', '/admin/companies', '/admin/audit-logs', '/admin/health'],
    deniedRoutes: [],
  },
  {
    role: 'ADMIN',
    email: 'admin@demo.talentflow.ai',
    root: '/admin',
    routes: ['/admin', '/admin/users', '/admin/companies', '/admin/audit-logs', '/admin/security'],
    deniedRoutes: [],
  },
  {
    role: 'MODERATOR',
    email: 'moderator@demo.talentflow.ai',
    root: '/admin',
    routes: ['/admin', '/admin/users', '/admin/companies', '/admin/audit-logs'],
    deniedRoutes: ['/candidate'],
  },
  {
    role: 'COMPANY_ADMIN',
    email: 'company.admin@demo.talentflow.ai',
    root: '/company',
    companyExpected: true,
    routes: ['/company', '/company/jobs', '/company/applications', '/company/team', '/company/billing'],
    deniedRoutes: ['/admin', '/candidate'],
  },
  {
    role: 'HR_MANAGER',
    email: 'hr.manager@demo.talentflow.ai',
    root: '/company',
    companyExpected: true,
    routes: ['/company', '/company/jobs', '/company/applications', '/company/candidates', '/company/interviews'],
    deniedRoutes: ['/admin', '/candidate'],
  },
  {
    role: 'RECRUITER',
    email: 'recruiter@demo.talentflow.ai',
    root: '/company',
    companyExpected: true,
    routes: ['/company', '/company/jobs', '/company/applications', '/company/candidates', '/company/pipeline'],
    deniedRoutes: ['/admin', '/candidate'],
  },
  {
    role: 'REVIEWER',
    email: 'reviewer@demo.talentflow.ai',
    root: '/company',
    companyExpected: true,
    routes: ['/company', '/company/applications', '/company/candidates', '/company/interviews', '/company/reviews'],
    deniedRoutes: ['/admin', '/candidate'],
  },
  {
    role: 'CANDIDATE',
    email: 'candidate@demo.talentflow.ai',
    root: '/candidate',
    routes: ['/candidate', '/candidate/jobs', '/candidate/applications', '/candidate/profile', '/candidate/notifications'],
    deniedRoutes: ['/admin', '/company'],
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  environment: {
    node: process.version,
    ci: Boolean(process.env.CI),
  },
  public: {},
  roles: [],
  negativeAuth: {},
  issues: [],
  summary: {},
};

const seenIssues = new Set();

function sanitizeFilename(value) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'page';
}

function addIssue(severity, scope, message, details = undefined) {
  const key = JSON.stringify([severity, scope, message, details || null]);
  if (seenIssues.has(key)) return;
  seenIssues.add(key);
  report.issues.push({ severity, scope, message, ...(details ? { details } : {}) });
}

function isNotFoundBody(text) {
  return /(?:^|\n)\s*404\s*(?:\n|$)/i.test(text)
    || /page not found/i.test(text)
    || /this page could not be found/i.test(text)
    || /we (?:could not|couldn't) find (?:that|this|the) page/i.test(text);
}

function isAccessDeniedBody(text) {
  return /403\s*-\s*access denied/i.test(text)
    || /you (?:do not|don't) have permission to access this page/i.test(text);
}

function isErrorBoundaryBody(text) {
  return /application error: a client-side exception/i.test(text)
    || /internal server error/i.test(text)
    || /something went wrong(?:\.|!|\n|$)/i.test(text)
    || /unexpected application error/i.test(text);
}

function sameOrigin(url) {
  try {
    return new URL(url).origin === new URL(BASE_URL).origin;
  } catch {
    return false;
  }
}

function attachDiagnostics(page) {
  const entries = [];

  page.on('pageerror', (error) => {
    entries.push({ type: 'pageerror', message: error.message, url: page.url() });
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon\.ico/i.test(text)) return;
    if (/failed to load resource: the server responded with a status of [45]\d\d/i.test(text)) return;
    const location = message.location();
    entries.push({
      type: 'console-error',
      message: text,
      pageUrl: page.url(),
      url: location.url || page.url(),
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber,
    });
  });

  page.on('response', (response) => {
    if (!sameOrigin(response.url())) return;
    if (response.status() < 400) return;
    entries.push({
      type: response.status() >= 500 ? 'http-5xx' : 'http-4xx',
      status: response.status(),
      method: response.request().method(),
      resourceType: response.request().resourceType(),
      url: response.url(),
    });
  });

  page.on('requestfailed', (request) => {
    if (!sameOrigin(request.url())) return;
    const failure = request.failure()?.errorText || 'request failed';
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failure)) return;
    entries.push({
      type: 'request-failed',
      method: request.method(),
      message: failure,
      url: request.url(),
    });
  });

  return {
    mark() {
      return entries.length;
    },
    since(index) {
      return entries.slice(index);
    },
    all() {
      return [...entries];
    },
  };
}

async function safeScreenshot(page, label, fullPage = true) {
  const file = path.join(SCREENSHOTS_DIR, `${sanitizeFilename(label)}.png`);
  try {
    await page.screenshot({ path: file, fullPage, animations: 'disabled' });
    return path.relative(ARTIFACTS_DIR, file);
  } catch (error) {
    addIssue('warning', label, 'Unable to capture screenshot', { message: error.message });
    return null;
  }
}

async function getPageState(page, navigationResponse) {
  let bodyText = '';
  try {
    bodyText = await page.locator('body').innerText({ timeout: 7_500 });
  } catch {
    // The caller will flag a blank page below.
  }

  let metrics = { scrollWidth: 0, clientWidth: 0, scrollHeight: 0, clientHeight: 0 };
  try {
    metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
  } catch {
    // Navigation may have failed before a document was available.
  }

  return {
    status: navigationResponse?.status() ?? null,
    finalUrl: page.url(),
    finalPath: (() => {
      try {
        return new URL(page.url()).pathname;
      } catch {
        return page.url();
      }
    })(),
    title: await page.title().catch(() => ''),
    bodyLength: bodyText.trim().length,
    bodySample: bodyText.trim().slice(0, 500),
    notFound: isNotFoundBody(bodyText),
    accessDeniedBody: isAccessDeniedBody(bodyText),
    errorBoundary: isErrorBoundaryBody(bodyText),
    horizontalOverflow: metrics.scrollWidth > metrics.clientWidth + 3,
    metrics,
  };
}

async function navigate(page, route, diagnostics, scope, options = {}) {
  const mark = diagnostics.mark();
  let response = null;
  let navigationError = null;

  try {
    response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.waitForTimeout(SETTLE_DELAY_MS);
  } catch (error) {
    navigationError = error.message;
  }

  const state = await getPageState(page, response);
  const diagnosticEntries = diagnostics.since(mark);
  const result = {
    route,
    ...state,
    diagnostics: diagnosticEntries,
    ...(navigationError ? { navigationError } : {}),
  };

  if (navigationError) {
    addIssue('high', scope, `Navigation failed for ${route}`, { message: navigationError });
  }

  if (state.status !== null && state.status >= 500) {
    addIssue('critical', scope, `Document returned HTTP ${state.status} for ${route}`);
  }

  if (state.errorBoundary) {
    addIssue('critical', scope, `Application error boundary rendered for ${route}`, {
      bodySample: state.bodySample,
    });
  }

  if (state.bodyLength < 25) {
    addIssue('high', scope, `Page rendered almost no content for ${route}`, {
      bodyLength: state.bodyLength,
    });
  }

  const denied = Boolean(
    options.expectDenied && (
      state.accessDeniedBody
      || state.notFound
      || state.status === 401
      || state.status === 403
      || state.status === 404
      || state.finalPath.startsWith('/auth/login')
      || state.finalPath === '/not-found'
    )
  );

  if (state.horizontalOverflow && !denied) {
    addIssue('warning', scope, `Horizontal overflow detected for ${route}`, state.metrics);
  }

  for (const entry of diagnosticEntries) {
    const expectedDeniedDocument = denied
      && entry.type === 'http-4xx'
      && [401, 403, 404].includes(entry.status)
      && entry.resourceType === 'document';
    if (expectedDeniedDocument) continue;

    if (entry.type === 'pageerror' || entry.type === 'http-5xx') {
      addIssue('high', scope, `${entry.type} while loading ${route}`, entry);
    } else if (entry.type === 'http-4xx' || entry.type === 'console-error' || entry.type === 'request-failed') {
      addIssue('warning', scope, `${entry.type} while loading ${route}`, entry);
    }
  }

  if (options.expectedPath) {
    const expected = options.expectedPath;
    const matches = state.finalPath === expected || state.finalPath.startsWith(`${expected}/`);
    if (!matches) {
      addIssue('high', scope, `Unexpected redirect while loading ${route}`, {
        expectedPath: expected,
        finalPath: state.finalPath,
      });
    }
    if (state.notFound) {
      addIssue('high', scope, `Authorized route rendered a not-found page: ${route}`);
    }
    if (state.finalPath.startsWith('/auth/login')) {
      addIssue('critical', scope, `Authenticated user was redirected back to login from ${route}`);
    }
  }

  if (options.expectDenied) {
    result.accessDenied = denied;
    if (!denied) {
      addIssue('critical', scope, `Role could access a forbidden portal route: ${route}`, {
        finalPath: state.finalPath,
        status: state.status,
        title: state.title,
        bodySample: state.bodySample,
      });
    }
  }

  if (options.screenshot) {
    result.screenshot = await safeScreenshot(page, `${scope}-${route}`);
  }

  return result;
}

async function fetchSession(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status, body };
  });
}

async function login(page, diagnostics, roleCase) {
  const scope = roleCase.role;
  const loginResult = await navigate(page, '/auth/login', diagnostics, scope);
  loginResult.formPresent = false;

  try {
    await page.locator('#email').waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('#password').waitFor({ state: 'visible', timeout: 10_000 });
    loginResult.formPresent = true;
  } catch (error) {
    addIssue('critical', scope, 'Login form fields were not available', { message: error.message });
    loginResult.screenshot = await safeScreenshot(page, `${scope}-login-form-missing`);
    return loginResult;
  }

  await page.fill('#email', roleCase.email);
  await page.fill('#password', DEMO_PASSWORD);

  const mark = diagnostics.mark();
  await page.locator('button[type="submit"]').click();

  try {
    await page.waitForURL(
      (url) => {
        const pathname = url.pathname;
        return pathname === roleCase.root || pathname.startsWith(`${roleCase.root}/`);
      },
      { timeout: NAVIGATION_TIMEOUT_MS },
    );
    await page.waitForTimeout(SETTLE_DELAY_MS);
  } catch (error) {
    loginResult.loginError = error.message;
    loginResult.finalUrl = page.url();
    loginResult.bodySample = (await page.locator('body').innerText().catch(() => '')).slice(0, 700);
    loginResult.diagnostics = diagnostics.since(mark);
    loginResult.screenshot = await safeScreenshot(page, `${scope}-login-failed`);
    addIssue('critical', scope, 'Credential login did not reach the expected portal', {
      email: roleCase.email,
      expectedRoot: roleCase.root,
      finalUrl: loginResult.finalUrl,
      bodySample: loginResult.bodySample,
    });
    return loginResult;
  }

  loginResult.finalUrl = page.url();
  loginResult.diagnostics = diagnostics.since(mark);
  loginResult.screenshot = await safeScreenshot(page, `${scope}-landing`);

  try {
    loginResult.session = await fetchSession(page);
  } catch (error) {
    addIssue('critical', scope, 'Unable to load the authenticated session', { message: error.message });
    return loginResult;
  }

  const user = loginResult.session?.body?.user;
  if (loginResult.session.status !== 200 || !user) {
    addIssue('critical', scope, 'Authenticated session endpoint returned no user', {
      status: loginResult.session.status,
      body: loginResult.session.body,
    });
    return loginResult;
  }

  if (user.email !== roleCase.email) {
    addIssue('critical', scope, 'Session belongs to the wrong email address', {
      expected: roleCase.email,
      actual: user.email,
    });
  }

  if (user.role !== roleCase.role) {
    addIssue('critical', scope, 'Session contains the wrong role', {
      expected: roleCase.role,
      actual: user.role,
    });
  }

  if (roleCase.companyExpected && !user.companyId) {
    addIssue('critical', scope, 'Company role session is missing companyId', {
      email: roleCase.email,
      role: roleCase.role,
    });
  }

  return loginResult;
}

async function runPublicSmoke(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  const result = { routes: [], interactions: {}, diagnostics: [] };

  result.routes.push(await navigate(page, '/', diagnostics, 'PUBLIC', { screenshot: true }));
  result.routes.push(await navigate(page, '/auth/login', diagnostics, 'PUBLIC', { screenshot: true }));
  result.routes.push(await navigate(page, '/auth/register', diagnostics, 'PUBLIC'));
  result.routes.push(await navigate(page, '/careers/techventures', diagnostics, 'PUBLIC', { screenshot: true }));

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
  await page.waitForTimeout(500);

  try {
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(250);
    const emailInvalid = await page.locator('#email').getAttribute('aria-invalid');
    const passwordInvalid = await page.locator('#password').getAttribute('aria-invalid');
    result.interactions.emptyValidation = {
      emailInvalid,
      passwordInvalid,
      passed: emailInvalid === 'true' && passwordInvalid === 'true',
    };
    if (!result.interactions.emptyValidation.passed) {
      addIssue('medium', 'PUBLIC', 'Empty login form did not mark both credential fields invalid', {
        emailInvalid,
        passwordInvalid,
      });
    }
  } catch (error) {
    result.interactions.emptyValidation = { passed: false, error: error.message };
    addIssue('high', 'PUBLIC', 'Could not exercise login form validation', { message: error.message });
  }

  try {
    await page.fill('#password', 'visible-password-check');
    const toggle = page.getByRole('button', { name: /show password/i });
    await toggle.click();
    const typeAfterShow = await page.locator('#password').getAttribute('type');
    await page.getByRole('button', { name: /hide password/i }).click();
    const typeAfterHide = await page.locator('#password').getAttribute('type');
    result.interactions.passwordVisibility = {
      typeAfterShow,
      typeAfterHide,
      passed: typeAfterShow === 'text' && typeAfterHide === 'password',
    };
    if (!result.interactions.passwordVisibility.passed) {
      addIssue('medium', 'PUBLIC', 'Password visibility toggle did not switch input type correctly');
    }
  } catch (error) {
    result.interactions.passwordVisibility = { passed: false, error: error.message };
    addIssue('warning', 'PUBLIC', 'Could not exercise password visibility toggle', { message: error.message });
  }

  try {
    await page.getByRole('button', { name: /change language/i }).click();
    await page.getByRole('menuitem', { name: 'العربية' }).click();
    await page.waitForTimeout(250);
    const dir = await page.locator('html').getAttribute('dir');
    const pageDir = await page.locator('body > div').first().getAttribute('dir').catch(() => null);
    result.interactions.arabicDirection = {
      htmlDir: dir,
      pageDir,
      passed: dir === 'rtl' || pageDir === 'rtl',
    };
    if (!result.interactions.arabicDirection.passed) {
      addIssue('medium', 'PUBLIC', 'Arabic locale did not switch the page direction to RTL', {
        htmlDir: dir,
        pageDir,
      });
    }
  } catch (error) {
    result.interactions.arabicDirection = { passed: false, error: error.message };
    addIssue('warning', 'PUBLIC', 'Could not exercise Arabic locale switch', { message: error.message });
  }

  result.diagnostics = diagnostics.all();
  await context.close();
  return result;
}

async function runInactiveUserCheck(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  const result = { email: 'inactive@demo.talentflow.ai' };

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
  await page.fill('#email', result.email);
  await page.fill('#password', DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2_000);

  result.finalUrl = page.url();
  result.session = await fetchSession(page).catch((error) => ({ error: error.message }));
  result.bodySample = (await page.locator('body').innerText().catch(() => '')).slice(0, 600);
  result.screenshot = await safeScreenshot(page, 'inactive-user-login');
  result.diagnostics = diagnostics.all();
  result.passed = result.finalUrl.includes('/auth/login') && !result.session?.body?.user;

  if (!result.passed) {
    addIssue('critical', 'AUTH', 'Inactive user was able to establish an authenticated session', {
      finalUrl: result.finalUrl,
      session: result.session,
    });
  }

  await context.close();
  return result;
}

async function runRole(browser, roleCase) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  const result = {
    role: roleCase.role,
    email: roleCase.email,
    login: null,
    routes: [],
    deniedRoutes: [],
    interaction: null,
  };

  result.login = await login(page, diagnostics, roleCase);
  const authenticated = Boolean(result.login?.session?.body?.user);

  if (authenticated) {
    for (const route of roleCase.routes) {
      result.routes.push(await navigate(page, route, diagnostics, roleCase.role, {
        expectedPath: route,
        screenshot: route === roleCase.root,
      }));
    }

    for (const route of roleCase.deniedRoutes) {
      result.deniedRoutes.push(await navigate(page, route, diagnostics, `${roleCase.role}-ACCESS`, {
        expectDenied: true,
        screenshot: true,
      }));
    }

    if (roleCase.role === 'CANDIDATE') {
      try {
        await page.goto(`${BASE_URL}/candidate/jobs`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
        await page.waitForTimeout(SETTLE_DELAY_MS);
        const jobLink = page.locator('a[href^="/candidate/jobs/"]').first();
        if (await jobLink.count()) {
          const href = await jobLink.getAttribute('href');
          if (href) {
            const detail = await navigate(page, href, diagnostics, roleCase.role, { expectedPath: href, screenshot: true });
            result.interaction = { type: 'open-job-detail', href, detail };
          }
        } else {
          result.interaction = { type: 'open-job-detail', skipped: true, reason: 'No candidate job detail link was rendered' };
          addIssue('warning', roleCase.role, 'Candidate jobs page rendered no navigable job detail link');
        }
      } catch (error) {
        result.interaction = { type: 'open-job-detail', error: error.message };
        addIssue('medium', roleCase.role, 'Could not open a candidate job detail from the jobs list', { message: error.message });
      }
    }
  }

  result.diagnostics = diagnostics.all();
  await context.close();
  return result;
}

function buildMarkdown() {
  const counts = report.summary.issueCounts || {};
  const lines = [
    '# TalentFlow AI production E2E role audit',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Roles attempted: ${report.summary.rolesAttempted}`,
    `- Roles authenticated: ${report.summary.rolesAuthenticated}`,
    `- Authorized routes checked: ${report.summary.authorizedRoutesChecked}`,
    `- Forbidden routes checked: ${report.summary.deniedRoutesChecked}`,
    `- Issues: critical ${counts.critical || 0}, high ${counts.high || 0}, medium ${counts.medium || 0}, warning ${counts.warning || 0}`,
    '',
    '## Role results',
    '',
    '| Role | Login | Session role | Routes healthy | Access checks |',
    '|---|---:|---:|---:|---:|',
  ];

  for (const role of report.roles) {
    const loginOk = Boolean(role.login?.session?.body?.user);
    const sessionRole = role.login?.session?.body?.user?.role || '—';
    const healthyRoutes = role.routes.filter((route) =>
      !route.navigationError
      && !route.notFound
      && !route.errorBoundary
      && !route.finalPath.startsWith('/auth/login')
      && (route.status === null || route.status < 500),
    ).length;
    const accessPassed = role.deniedRoutes.filter((route) => route.accessDenied).length;
    lines.push(`| ${role.role} | ${loginOk ? 'PASS' : 'FAIL'} | ${sessionRole} | ${healthyRoutes}/${role.routes.length} | ${accessPassed}/${role.deniedRoutes.length} |`);
  }

  lines.push('', '## Issues', '');
  if (report.issues.length === 0) {
    lines.push('No issues were detected by this browser matrix.');
  } else {
    for (const issue of report.issues) {
      lines.push(`- **${issue.severity.toUpperCase()}** · ${issue.scope}: ${issue.message}`);
    }
  }

  lines.push('', '## Artifacts', '', '- `report.json` contains full route, session, console, network, and layout details.', '- `screenshots/` contains landing, failure, access-control, and public-page evidence.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    report.public = await runPublicSmoke(browser);
    report.negativeAuth.inactiveUser = await runInactiveUserCheck(browser);

    for (const roleCase of ROLE_CASES) {
      // Keep role sessions isolated so access-control results cannot be polluted by cookies.
      // eslint-disable-next-line no-await-in-loop
      report.roles.push(await runRole(browser, roleCase));
    }
  } finally {
    await browser.close();
  }

  const issueCounts = report.issues.reduce((accumulator, issue) => {
    accumulator[issue.severity] = (accumulator[issue.severity] || 0) + 1;
    return accumulator;
  }, {});

  report.summary = {
    rolesAttempted: report.roles.length,
    rolesAuthenticated: report.roles.filter((role) => Boolean(role.login?.session?.body?.user)).length,
    authorizedRoutesChecked: report.roles.reduce((sum, role) => sum + role.routes.length, 0),
    deniedRoutesChecked: report.roles.reduce((sum, role) => sum + role.deniedRoutes.length, 0),
    issueCounts,
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'report.md'), buildMarkdown());

  console.log(buildMarkdown());

  if ((issueCounts.critical || 0) > 0 || (issueCounts.high || 0) > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  addIssue('critical', 'RUNNER', 'E2E runner crashed', { message: error.stack || error.message });
  report.summary = { runnerCrashed: true };
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'report.md'), `# TalentFlow AI production E2E role audit\n\nRunner crashed: ${error.message}\n`);
  console.error(error);
  process.exitCode = 1;
});
