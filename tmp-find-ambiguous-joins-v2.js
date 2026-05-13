const fs = require('fs');
const path = require('path');
const root = path.resolve('g:/centro-cultural');
const filePatterns = ['.ts', '.tsx', '.js', '.jsx'];
const ignoreDirs = new Set(['node_modules', '.next', 'out', 'dist', 'public', 'supabase']);
const relPattern = /^\s*([a-z0-9_]+)(!?[a-z0-9_]*)(?::[a-z0-9_]+)?\s*\(/i;
const selectRegex = /\.select\(\s*([`'])([\s\S]*?)\1/g;

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
    let match;
    while ((match = selectRegex.exec(text))) {
      const arg = match[2];
      const lines = arg.split(/\r?\n/);
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        const rel = relPattern.exec(trimmed);
        if (rel) {
          const token = rel[0].trim();
          if (!token.includes('!')) {
            console.log(`${fullPath}:${getLineNumber(text, match.index) + index}: ${token}`);
          }
        }
      });
    }
  }
}
function getLineNumber(text, idx) {
  return text.slice(0, idx).split(/\r?\n/).length;
}
walk(root);
