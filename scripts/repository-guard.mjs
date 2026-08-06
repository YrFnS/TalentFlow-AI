import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SOURCE_ROOT = fileURLToPath(new URL('../src/', import.meta.url));
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const FORBIDDEN = [
  {
    pattern: /\b(?:fetch|apiFetch)\s*\(\s*['"`]\/api\/seed(?:['"`?])/,
    display: '/api/seed',
    reason: 'runtime pages must not trigger database seeding',
  },
  {
    pattern: 'demo_company',
    reason: 'hardcoded demo tenant identifiers are forbidden',
  },
  {
    pattern: 'demo-company',
    reason: 'hardcoded demo tenant identifiers are forbidden',
  },
  {
    pattern: 'app-demo',
    reason: 'hardcoded demo application identifiers are forbidden',
  },
  {
    pattern: 'cs_sim_',
    reason: 'simulated Stripe checkout identifiers are forbidden',
  },
  {
    pattern: 'bps_sim_',
    reason: 'simulated Stripe portal identifiers are forbidden',
  },
  {
    pattern: /console\.(?:log|info|debug).*?(?:reset token|reset url|rawToken)/i,
    display: 'password-reset token logging',
    reason: 'password-reset secrets must never be written to application logs',
  },
  { pattern: 'admin123', reason: 'known demo credentials are forbidden' },
  { pattern: 'hr123456', reason: 'known demo credentials are forbidden' },
  {
    pattern: 'candidate123',
    reason: 'known demo credentials are forbidden',
  },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }

  return files;
}

function lineMatches(line, pattern) {
  return pattern instanceof RegExp ? pattern.test(line) : line.includes(pattern);
}

const files = await walk(SOURCE_ROOT);
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rule of FORBIDDEN) {
    lines.forEach((line, index) => {
      if (lineMatches(line, rule.pattern)) {
        violations.push({
          file: relative(ROOT, file),
          line: index + 1,
          pattern: rule.display || String(rule.pattern),
          reason: rule.reason,
        });
      }
    });
  }
}

if (violations.length > 0) {
  console.error('Repository regression guard failed:\n');
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} contains "${violation.pattern}" — ${violation.reason}`,
    );
  }
  process.exit(1);
}

console.log(`Repository regression guard passed (${files.length} source files checked).`);
