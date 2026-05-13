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
const tables = {};
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /\.from\(\s*['\"]([a-zA-Z0-9_]+)['\"]\s*\)([\s\S]*?)(?:\.insert\(|\.update\()/g;
  let m;
  while ((m = regex.exec(content))) {
    const table = m[1];
    const block = m[2];
    const keys = [...block.matchAll(/([a-zA-Z0-9_]+)\s*:\s*/g)].map(x => x[1]);
    if (!tables[table]) tables[table] = new Set();
    for (const key of keys) tables[table].add(key);
  }
}
for (const table of Object.keys(tables).sort()) {
  console.log(table + ': ' + [...tables[table]].sort().join(', '));
}
