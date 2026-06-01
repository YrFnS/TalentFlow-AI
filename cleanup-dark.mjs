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

// Remove dark: class variants — these are safe to bulk-remove
const darkPatterns = [
  // Common dark mode patterns — remove just the dark: portion
  / dark:from-teal-950\/30 dark:to-emerald-950\/30/g,
  / dark:from-teal-950\/30 dark:via-emerald-950\/20 dark:to-background/g,
  / dark:from-teal-950\/30/g,
  / dark:to-emerald-950\/30/g,
  / dark:via-emerald-950\/20/g,
  / dark:to-background/g,
  / dark:from-teal-500\/5 dark:to-emerald-500\/3/g,
  / dark:from-emerald-500\/4 dark:to-cyan-500\/3/g,
  / dark:from-cyan-500\/3 dark:to-teal-500\/2/g,
  / dark:from-blue-500\/5 dark:to-teal-500\/3/g,
  / dark:bg-teal-950\/50/g,
  / dark:bg-teal-950\/40/g,
  / dark:bg-teal-950\/30/g,
  / dark:bg-teal-950\/20/g,
  / dark:bg-teal-900\/50 dark:text-teal-300/g,
  / dark:bg-teal-900\/50 dark:text-teal-400/g,
  / dark:bg-teal-900\/40/g,
  / dark:bg-teal-900\/30 dark:text-teal-400/g,
  / dark:bg-teal-900\/30/g,
  / dark:bg-teal-900\/20/g,
  / dark:bg-emerald-950\/40/g,
  / dark:bg-emerald-950\/30/g,
  / dark:bg-emerald-900\/30 dark:text-emerald-400/g,
  / dark:bg-cyan-950\/40/g,
  / dark:bg-cyan-950\/30/g,
  / dark:bg-cyan-900\/30 dark:text-cyan-400/g,
  / dark:bg-violet-900\/30 dark:text-violet-400/g,
  / dark:bg-amber-900\/30 dark:text-amber-400/g,
  / dark:bg-red-900\/30 dark:text-red-400/g,
  / dark:bg-blue-900\/30 dark:text-blue-400/g,
  / dark:bg-neutral-100/g,
  / dark:bg-neutral-900/g,
  / dark:bg-neutral-800/g,
  / dark:text-teal-300/g,
  / dark:text-teal-400/g,
  / dark:text-emerald-400/g,
  / dark:text-cyan-400/g,
  / dark:text-cyan-300/g,
  / dark:text-violet-400/g,
  / dark:text-amber-400/g,
  / dark:text-amber-300/g,
  / dark:text-red-400/g,
  / dark:text-red-300/g,
  / dark:text-blue-400/g,
  / dark:text-blue-300/g,
  / dark:text-neutral-100/g,
  / dark:text-neutral-300/g,
  / dark:text-neutral-400/g,
  / dark:text-neutral-800/g,
  / dark:text-white/g,
  / dark:border-teal-700/g,
  / dark:border-teal-800/g,
  / dark:border-neutral-700/g,
  / dark:border-neutral-800/g,
  / dark:hover:bg-teal-950\/50/g,
  / dark:hover:bg-teal-950\/30/g,
  / dark:hover:bg-teal-950\/20/g,
  / dark:hover:text-teal-700/g,
  / dark:hover:text-teal-600/g,
  / dark:hover:border-teal-600/g,
  / dark:hover:border-teal-700/g,
  / dark:data-\[state=open\]:border-teal-700/g,
  / dark:data-\[state=open\]:bg-teal-950\/20/g,
  / dark:focus-visible:outline-teal-500/g,
  / dark:focus:border-teal-500/g,
  / dark:from-teal-600 dark:to-emerald-600/g,
  / dark:shadow-teal-500\/20/g,
  / dark:text-\[#14b8a6\]/g,
  / dark:border-neutral-900/g,
  / dark:bg-background/g,
  / dark:text-foreground/g,
  / dark:text-muted-foreground/g,
  / dark:bg-muted/g,
  / dark:bg-card/g,
  / dark:border-border/g,
  / dark:hover:bg-accent/g,
  / dark:hover:text-accent-foreground/g,
  / dark:data-\[state=active\]:bg-background/g,
  / dark:data-\[state=active\]:text-foreground/g,
  / dark:group-hover:text-teal-400/g,
  / dark:checked:bg-teal-600/g,
  / dark:checked:border-teal-600/g,
];

walkDir(SRC, (filePath) => {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;
  
  for (const pattern of darkPatterns) {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      const matches = content.match(pattern);
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

console.log(`\n=== Dark Mode Cleanup Complete ===`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);
