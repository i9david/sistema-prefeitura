const fs = require('fs');
const path = require('path');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const p = path.join(dir, dirent.name);
    if (dirent.name === 'node_modules' || dirent.name === '.git' || dirent.name === 'supabase' || dirent.name === '.next' || dirent.name === 'public') return [];
    if (dirent.isDirectory()) return walk(p);
    if (!exts.has(path.extname(dirent.name))) return [];
    return [p];
  });
}
const files = walk(process.cwd());
const term = process.argv[2];
if (!term) {
  console.error('Usage: node tmp-table-action-context.js <table>');
  process.exit(1);
}
const regex = new RegExp(`\\.from\\(\\s*['\\\"]${term}['\\\"]\\s*\\)([\\s\\S]{0,500})`, 'g');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = regex.exec(content))) {
    const pos = m.index;
    const start = Math.max(0, pos - 200);
    const end = Math.min(content.length, pos + m[0].length + 200);
    const snippet = content.slice(start, end);
    console.log('FILE:', file);
    console.log(snippet.replace(/\r/g, ''));
    console.log('---');
  }
}
