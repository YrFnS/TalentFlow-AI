import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SRC = 'src';
let filesModified = 0;
let totalReplacements = 0;

function walkDir(dir, callback) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.next', 'node_modules', '.git', '.crew'].includes(entry.name)) {
        walkDir(full, callback);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      callback(full);
    }
  }
}

const replacements = [
  // Remaining gradient patterns in class attributes
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm font-semibold/g, to: 'bg-blue-600 text-white text-sm font-semibold' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-medium/g, to: 'bg-blue-600 text-xs font-medium' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-lg/g, to: 'bg-blue-600 text-lg' },
  { from: /bg-gradient-to-br from-emerald-500 to-cyan-500 text-white/g, to: 'bg-emerald-600 text-white' },
  { from: /bg-gradient-to-br from-cyan-500 to-blue-500 text-white/g, to: 'bg-sky-600 text-white' },
  { from: /bg-gradient-to-br from-blue-500 to-cyan-500 text-white/g, to: 'bg-blue-600 text-white' },
  { from: /bg-gradient-to-r from-teal-500 to-emerald-500/g, to: 'bg-blue-500' },
  
  // Inline style gradients (style={{...}})
  { from: /background: linear-gradient\(to right,.*?#14b8a6.*?\)/g, to: 'background-color: #3b82f6' },
  { from: /background: linear-gradient\(to right,.*?#10b981.*?\)/g, to: 'background-color: #10b981' },
  
  // Gradient text remaining
  { from: /bg-gradient-to-r from-\[#14b8a6\] to-\[#10b981\] bg-clip-text text-transparent/g, to: 'text-slate-900' },
  
  // Gradient text in auth pages
  { from: /bg-clip-text text-transparent/g, to: 'text-white' },
  
  // Remaining dark mode patterns in class strings
  / dark:from-teal-950\/30/g,
  / dark:to-emerald-950\/30/g,
  / dark:bg-teal-950\/30/g,
  / dark:bg-teal-950\/20/g,
  / dark:bg-teal-900\/50/g,
  / dark:text-teal-300/g,
  / dark:text-teal-400/g,
  / dark:text-white/g,
  / dark:hover:bg-teal-950\/30/g,
  / dark:hover:bg-white\/5/g,
  / dark:border-teal-700/g,
  / dark:border-white\/10/g,
  / dark:bg-white\/10/g,
  / dark:text-blue-300/g,
  / dark:hover:bg-white\/10/g,
  /dark:bg-gray-900/g,
  /dark:text-gray-100/g,
  /dark:border-gray-700/g,
  /dark:hover:bg-gray-800/g,
  
  // Card glow remaining
  /card-glow /g,
  /card-glow/g,
  
  // Sidebar teal
  /bg-teal-500\/10/g,
  /border-teal-500\/20/g,
  
  // Green/emerald gradient text
  /from-emerald-500 to-teal-500 bg-clip-text text-transparent/g,
  /from-emerald-400 to-teal-500 bg-clip-text text-transparent/g,
];

walkDir(SRC, (filePath) => {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;
  
  for (const item of replacements) {
    const from = item.from || item;
    const to = item.to || '';
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      const matches = content.match(from);
      fileReplacements += matches ? matches.length : 0;
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content);
    filesModified++;
    totalReplacements += fileReplacements;
  }
});

console.log(`\n=== Final Cleanup Complete ===`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);
