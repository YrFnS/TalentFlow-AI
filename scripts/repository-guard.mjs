import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import process from 'node:process';

const ROOT = new URL('../', import.meta.url);
const SOURCE_ROOT = new URL('../src/', import.meta.url);
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const FORBIDDEN = [
  { pattern: '/api/seed', reason: 'runtime pages must not trigger database seeding' },
  { pattern: 'demo_company', reason: 'hardcoded demo tenant identifiers are forbidden' },
  { pattern: 'app-demo', reason: 'hardcoded demo application identifiers are forbidden' },
  { pattern: 'cs_sim_', reason: 'simulated Stripe checkout identifiers are forbidden' },
  { pattern: 'bps_sim_', reason: 'simulated Stripe portal identifiers are forbidden' },
  { pattern: 'admin123', reason: 'known demo credentials are forbidden' },
  { pattern: 'hr123456', reason: 'known demo credentials are forbidden' },
  { pattern: 'candidate123', reason: 'known demo credentials are forbidden' },
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

const files = await walk(SOURCE_ROOT.pathname);
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rule of FORBIDDEN) {
    lines.forEach((line, index) => {
      if (line.includes(rule.pattern)) {
        violations.push({
          file: relative(ROOT.pathname, file),
          line: index + 1,
          pattern: rule.pattern,
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
