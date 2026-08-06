import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

const LINTABLE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/i;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function isCommit(ref) {
  if (!ref || /^0+$/.test(ref)) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}^{commit}`], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

let base = process.env.BASE_SHA || process.argv[2] || '';
const head = process.env.HEAD_SHA || process.argv[3] || 'HEAD';

if (!isCommit(base)) {
  try {
    base = git(['rev-parse', 'HEAD^']);
  } catch {
    base = head;
  }
}

const changed = git([
  'diff',
  '--name-only',
  '--diff-filter=ACMR',
  base,
  head,
])
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => LINTABLE_EXTENSION.test(file) && existsSync(file));

if (changed.length === 0) {
  console.log(`No lintable files changed between ${base} and ${head}.`);
  process.exit(0);
}

console.log(`Linting ${changed.length} changed file(s) between ${base} and ${head}.`);

const command = process.platform === 'win32' ? 'bunx.cmd' : 'bunx';
const result = spawnSync(command, ['eslint', ...changed], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
