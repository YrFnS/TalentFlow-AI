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
  // === GRADIENT BACKGROUNDS → SOLID ===
  // Teal/emerald gradient buttons → blue-600
  { from: /bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white/g, to: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { from: /bg-gradient-to-r from-teal-600 to-emerald-600 text-white/g, to: 'bg-blue-600 text-white' },
  { from: /bg-gradient-to-r from-teal-600 to-emerald-600/g, to: 'bg-blue-600' },
  { from: /bg-gradient-to-r from-\[#14b8a6\] to-\[#10b981\]/g, to: 'bg-blue-600' },
  
  // Gradient icon backgrounds → solid
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-white/g, to: 'bg-blue-600 text-white' },
  { from: /bg-gradient-to-br from-cyan-500 to-teal-600 text-white/g, to: 'bg-sky-600 text-white' },
  { from: /bg-gradient-to-br from-amber-500 to-orange-600 text-white/g, to: 'bg-amber-600 text-white' },
  { from: /bg-gradient-to-br from-emerald-500 to-cyan-600 text-white/g, to: 'bg-emerald-600 text-white' },
  { from: /bg-gradient-to-br from-teal-500 to-cyan-500 text-white/g, to: 'bg-blue-600 text-white' },
  { from: /bg-gradient-to-br from-cyan-500 to-teal-500 text-white/g, to: 'bg-blue-600 text-white' },
  { from: /bg-gradient-to-br from-violet-500 to-teal-500 text-white/g, to: 'bg-violet-600 text-white' },
  { from: /bg-gradient-to-br from-emerald-500 to-teal-600 text-white/g, to: 'bg-emerald-600 text-white' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-semibold/g, to: 'bg-blue-600 text-white text-xs font-semibold' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm font-semibold/g, to: 'bg-blue-600 text-white text-sm font-semibold' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs/g, to: 'bg-blue-600 text-white text-xs' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-semibold/g, to: 'bg-blue-600 text-lg font-semibold' },
  { from: /bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-medium/g, to: 'bg-blue-600 text-xs font-medium' },
  
  // Teal gradient in style attributes (SVG-like)
  { from: /from-teal-500 to-emerald-600/g, to: 'bg-blue-600' },
  { from: /from-teal-500 to-cyan-500/g, to: 'bg-blue-500' },
  
  // GRADIENT TEXT → SOLID
  { from: /bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent/g, to: 'text-slate-900' },
  { from: /bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent/g, to: 'text-slate-900' },
  { from: /bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent/g, to: 'text-slate-900' },
  
  // GLOW EFFECTS → CLEAN
  { from: /heading-glow /g, to: '' },
  { from: /heading-glow/g, to: '' },
  { from: /glow-teal /g, to: '' },
  { from: /glow-teal/g, to: '' },
  { from: /glow-teal-secondary/g, to: '' },
  { from: /stat-card-shine /g, to: '' },
  { from: /stat-card-shine/g, to: '' },
  { from: /card-tilt /g, to: '' },
  { from: /card-tilt/g, to: '' },
  { from: /animate-pulse-glow/g, to: 'shadow-md' },
  { from: /pricing-ribbon/g, to: 'border-2 border-blue-500' },
  
  // GLASSMORPHISM → CLEAN
  { from: /glass-card-hover /g, to: '' },
  { from: /glass-card-hover/g, to: '' },
  { from: /glass-card /g, to: '' },
  { from: /glass-card/g, to: '' },
  { from: /glass-mockup /g, to: '' },
  { from: /glass-mockup/g, to: '' },
  
  // HOVER LIFT → CLEAN
  { from: /hover-lift /g, to: '' },
  { from: /hover-lift/g, to: '' },
  
  // CARD CLICK RIPPLE → CLEAN
  { from: /card-click-ripple /g, to: '' },
  { from: /card-click-ripple/g, to: '' },
  
  // BACKDROP BLUR → CLEAN
  { from: / backdrop-blur-xl/g, to: '' },
  { from: / backdrop-blur-lg/g, to: '' },
  { from: / backdrop-blur-md/g, to: '' },
  { from: / backdrop-blur-sm/g, to: '' },
  { from: / backdrop-blur-xs/g, to: '' },
  { from: / backdrop-blur/g, to: '' },
  
  // TEAL/EMERALD/CYAN BACKGROUNDS → SLATE/BLUE
  // Solid backgrounds
  { from: /bg-teal-50 dark:bg-teal-950\/50/g, to: 'bg-slate-50' },
  { from: /bg-teal-50 dark:bg-teal-950\/30/g, to: 'bg-slate-50' },
  { from: /bg-teal-50 dark:bg-teal-950\/20/g, to: 'bg-slate-50' },
  { from: /bg-teal-50\/50 dark:bg-teal-950\/20/g, to: 'bg-slate-50' },
  { from: /bg-teal-50\/50/g, to: 'bg-slate-50' },
  { from: /bg-teal-50/g, to: 'bg-slate-50' },
  { from: /bg-teal-100\/80/g, to: 'bg-blue-50' },
  
  // Gradient card backgrounds
  { from: /bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950\/30 dark:to-emerald-950\/30/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-teal-50 to-emerald-50/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950\/40 dark:to-cyan-950\/40/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-teal-50 to-cyan-50/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950\/40 dark:to-cyan-950\/40/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-emerald-50 to-cyan-50/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950\/40 dark:to-teal-950\/40/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-cyan-50 to-teal-50/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-blue-50 to-teal-50/g, to: 'bg-slate-50' },
  { from: /bg-gradient-to-br from-yellow-50 to-teal-50/g, to: 'bg-slate-50' },
  
  // Misc gradient backgrounds
  { from: /from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950\/30 dark:via-emerald-950\/20 dark:to-background/g, to: 'bg-slate-50' },
  { from: /from-teal-50 via-emerald-50 to-cyan-50/g, to: 'bg-slate-50' },
  
  // TEAL/EMERALD/CYAN GRADIENT BLOBS → MUTED
  { from: /bg-teal-400\/8 to-emerald-400\/5/g, to: 'bg-blue-100' },
  { from: /bg-teal-400\/15/g, to: 'bg-blue-50' },
  { from: /from-teal-400\/8/g, to: 'from-blue-100' },
  { from: /from-emerald-400\/7/g, to: 'from-blue-100' },
  { from: /from-cyan-400\/6/g, to: 'from-blue-100' },
  { from: /from-teal-500\/10/g, to: 'from-blue-50' },
  { from: /bg-teal-500\/10/g, to: 'bg-blue-50' },
  { from: /bg-teal-500\/5/g, to: 'bg-blue-50' },
  
  // TEAL/EMERALD/CYAN TEXT → SLATE/BLUE
  { from: /text-teal-600 dark:text-teal-400/g, to: 'text-blue-600' },
  { from: /text-teal-600 dark:text-teal-300/g, to: 'text-blue-600' },
  { from: /text-teal-700 dark:text-teal-300/g, to: 'text-blue-700' },
  { from: /text-teal-700 dark:text-teal-400/g, to: 'text-blue-700' },
  { from: /text-emerald-700 dark:text-emerald-300/g, to: 'text-emerald-700' },
  { from: /text-emerald-500 dark:text-emerald-300/g, to: 'text-emerald-600' },
  { from: /text-teal-600/g, to: 'text-blue-600' },
  { from: /text-teal-700/g, to: 'text-blue-700' },
  { from: /text-teal-800 dark:text-teal-300/g, to: 'text-blue-800' },
  { from: /text-teal-800/g, to: 'text-slate-800' },
  
  // TEAL/EMERALD HOVER → BLUE/SLATE
  { from: /hover:text-teal-600/g, to: 'hover:text-blue-600' },
  { from: /hover:text-teal-700/g, to: 'hover:text-blue-700' },
  { from: /hover:bg-teal-50 dark:hover:bg-teal-950\/50/g, to: 'hover:bg-slate-50' },
  { from: /hover:bg-teal-50 dark:hover:bg-teal-950\/30/g, to: 'hover:bg-slate-50' },
  { from: /hover:bg-teal-50/g, to: 'hover:bg-slate-50' },
  { from: /hover:border-teal-200/g, to: 'hover:border-slate-200' },
  { from: /hover:border-teal-300/g, to: 'hover:border-slate-300' },
  { from: /hover:border-teal-400/g, to: 'hover:border-slate-400' },
  { from: /hover:shadow-teal-500\/25/g, to: 'hover:shadow-md' },
  { from: /hover:shadow-teal-500\/40/g, to: 'hover:shadow-lg' },
  
  // TEAL/EMERALD BADGE BACKGROUNDS → MUTED
  { from: /bg-teal-100 text-teal-800 dark:bg-teal-900\/50 dark:text-teal-300/g, to: 'bg-blue-100 text-blue-800' },
  { from: /bg-teal-100 text-teal-700 dark:bg-teal-900\/50 dark:text-teal-300/g, to: 'bg-blue-100 text-blue-700' },
  { from: /bg-teal-100 text-teal-700/g, to: 'bg-blue-100 text-blue-700' },
  { from: /bg-teal-100 text-teal-800/g, to: 'bg-blue-100 text-blue-800' },
  { from: /bg-cyan-100 text-cyan-700 dark:bg-cyan-900\/30 dark:text-cyan-400/g, to: 'bg-sky-100 text-sky-700' },
  { from: /bg-cyan-100 text-cyan-700/g, to: 'bg-sky-100 text-sky-700' },
  { from: /bg-emerald-100 text-emerald-700 dark:bg-emerald-900\/30 dark:text-emerald-400/g, to: 'bg-emerald-100 text-emerald-700' },
  
  // BAR CHART COLORS → MUTED
  { from: /bg-teal-500\/80/g, to: 'bg-slate-200' },
  { from: /bg-emerald-500\/80/g, to: 'bg-blue-200' },
  { from: /fill-teal-500/g, to: 'fill-blue-500' },
  { from: /stroke-teal-500/g, to: 'stroke-blue-500' },
  
  // TEAL/EMERALD BORDERS → SLATE/BLUE
  { from: /border-teal-200 dark:border-teal-800/g, to: 'border-slate-200' },
  { from: /border-teal-200 dark:border-teal-700/g, to: 'border-slate-200' },
  { from: /border-teal-200/g, to: 'border-slate-200' },
  { from: /border-teal-300 dark:border-teal-700/g, to: 'border-slate-300' },
  { from: /border-teal-300/g, to: 'border-slate-300' },
  { from: /border-\[#14b8a6\]/g, to: 'border-blue-600' },
  
  // TEAL SHADOWS → NEUTRAL
  { from: /shadow-teal-500\/25/g, to: 'shadow-md' },
  { from: /shadow-lg shadow-teal-500\/25/g, to: 'shadow-lg' },
  
  // TEAL ACTIVE/FOCUS → BLUE
  { from: /data-\[state=open\]:border-teal-300 dark:data-\[state=open\]:border-teal-700/g, to: 'data-[state=open]:border-blue-300' },
  { from: /data-\[state=open\]:border-teal-300/g, to: 'data-[state=open]:border-blue-300' },
  { from: /data-\[state=open\]:bg-teal-50\/50 dark:data-\[state=open\]:bg-teal-950\/20/g, to: 'data-[state=open]:bg-blue-50/50' },
  { from: /data-\[state=open\]:bg-teal-50\/50/g, to: 'data-[state=open]:bg-blue-50/50' },
  { from: /focus-visible:outline-teal-500/g, to: 'focus-visible:outline-blue-500' },
  { from: /focus:border-teal-500/g, to: 'focus:border-blue-500' },
  
  // TEAL EXPAND/COLLAPSE
  { from: /data-\[state=open\]:text-teal-700/g, to: 'data-[state=open]:text-blue-700' },
  
  // TEAL FORM ELEMENTS
  { from: /focus-within:border-teal-400/g, to: 'focus-within:border-blue-400' },
  
  // TEAL DIVIDERS / SEPARATORS
  { from: /via-teal-500/g, to: 'via-blue-500' },
  
  // TEAL MISC
  { from: /ring-teal-500/g, to: 'ring-blue-500' },
  { from: /text-teal-500 dark:text-teal-400/g, to: 'text-blue-500' },
  { from: /text-teal-500/g, to: 'text-blue-500' },
  { from: /text-teal-400/g, to: 'text-blue-400' },
  { from: /text-teal-300/g, to: 'text-blue-300' },
  { from: /bg-teal-600 dark:bg-teal-600/g, to: 'bg-blue-600' },
  { from: /bg-teal-600 dark:bg-teal-700/g, to: 'bg-blue-600' },
  { from: /bg-teal-600\/80/g, to: 'bg-blue-600' },
  { from: /bg-teal-600/g, to: 'bg-blue-600' },
  { from: /bg-teal-700/g, to: 'bg-blue-700' },
];

walkDir(SRC, (filePath) => {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;
  
  for (const { from, to } of replacements) {
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

console.log(`\n=== Cleanup Complete ===`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);
