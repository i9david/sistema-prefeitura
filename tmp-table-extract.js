const fs = require('fs');
const path = require('path');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const tables = new Set();
function walk(dir) {
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, dirent.name);
    if (dirent.name === 'node_modules' || dirent.name === '.git' || dirent.name === 'supabase' || dirent.name === '.next' || dirent.name === 'public') continue;
    if (dirent.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(dirent.name))) {
      const text = fs.readFileSync(p, 'utf8');
      const re = /\.from\(\s*['\"]([a-zA-Z0-9_]+)['\"]\s*\)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        tables.add(m[1]);
      }
    }
  }
}
walk(process.cwd());
console.log([...tables].sort().join('\n'));
