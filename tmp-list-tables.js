const fs = require('fs');
const path = require('path');
const dir = 'supabase';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
const regex = /create table if not exists public\.([a-z0-9_]+)/gi;
const found = {};
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  let m;
  while ((m = regex.exec(content)) !== null) {
    found[m[1]] = found[m[1]] || new Set();
    found[m[1]].add(file);
  }
}
for (const name of Object.keys(found).sort()) {
  console.log(`${name} -> ${[...found[name]].sort().join(', ')}`);
}
console.log('---');
console.log('total', Object.keys(found).length);
