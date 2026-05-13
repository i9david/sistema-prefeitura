const fs = require('fs');
const path = require('path');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'supabase' || entry.name === '.next' || entry.name === 'public') continue;
    if (entry.isDirectory()) files = files.concat(walk(p));
    else if (exts.has(path.extname(entry.name))) files.push(p);
  }
  return files;
}

function findObjectLiteral(text, start) {
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let objStart = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        return text.slice(objStart, i + 1);
      }
    }
  }
  return null;
}

function parseKeysFromObject(objText) {
  const keys = new Set();
  const lines = objText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const match = trimmed.match(/^['"]?([a-zA-Z0-9_]+)['"]?\s*:/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function extractTableColumns(file) {
  const content = fs.readFileSync(file, 'utf8');
  const results = {};
  const patterns = [/\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.insert\s*\(/gi, /\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.update\s*\(/gi];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      const table = m[1];
      const objText = findObjectLiteral(content, pattern.lastIndex - 1);
      if (!objText) continue;
      const keys = parseKeysFromObject(objText);
      if (!results[table]) results[table] = new Set();
      keys.forEach(k => results[table].add(k));
    }
  }
  return results;
}

const files = walk(process.cwd());
const tables = {};
for (const file of files) {
  const usage = extractTableColumns(file);
  for (const [table, keys] of Object.entries(usage)) {
    if (!tables[table]) tables[table] = new Set();
    keys.forEach(k => tables[table].add(k));
  }
}
for (const table of Object.keys(tables).sort()) {
  console.log(table + ': ' + [...tables[table]].sort().join(', '));
}
