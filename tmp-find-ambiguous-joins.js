const fs = require('fs');
const path = require('path');
const root = path.resolve('g:/centro-cultural');
const filePatterns = ['.ts', '.tsx', '.js', '.jsx'];
const ignoreDirs = new Set(['node_modules', '.next', 'out', 'dist', 'public', 'supabase']);
const relRe = /^\s*([a-z0-9_]+)\s*(?:[:][a-z0-9_]+)?\s*\(/i;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!filePatterns.includes(path.extname(entry.name).toLowerCase())) continue;
    const text = fs.readFileSync(fullPath, 'utf8');
    const regex = /\.select\(\s*([`'])([\s\S]*?)\1/g;
    let match;
    while ((match = regex.exec(text))) {
      const arg = match[2];
      if (!arg.includes('(') || arg.includes('!')) continue;
      const lines = arg.split(/\r?\n/);
      const rels = lines.filter((line) => relRe.test(line.trim()));
      if (rels.length > 0) {
        console.log(`${fullPath}:${match.index}`);
        rels.forEach((line) => console.log('  ', line.trim()));
        console.log('');
      }
    }
  }
}

walk(root);
