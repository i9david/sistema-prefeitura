const fs = require('fs');
const path = require('path');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const full = path.join(dir, dirent.name);
    if (dirent.name === 'node_modules' || dirent.name === '.git' || dirent.name === 'supabase' || dirent.name === '.next' || dirent.name === 'public') return [];
    if (dirent.isDirectory()) return walk(full);
    if (!exts.has(path.extname(dirent.name))) return [];
    return [full];
  });
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

function extractCodeUsage() {
  const files = walk(process.cwd());
  const tables = {};
  const patterns = [/\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.insert\s*\(/gi, /\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.update\s*\(/gi];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const table = m[1];
        const objText = findObjectLiteral(text, pattern.lastIndex - 1);
        if (!objText) continue;
        const keys = parseKeysFromObject(objText);
        if (!tables[table]) tables[table] = new Set();
        keys.forEach(k => tables[table].add(k));
      }
    }
  }
  return tables;
}

function parseCreateTables(sql) {
  const tables = {};
  const createTableRegex = /create table if not exists public\.([a-z0-9_]+)\s*\(([^;]+?)\);/gis;
  let match;
  while ((match = createTableRegex.exec(sql)) !== null) {
    const table = match[1];
    const body = match[2];
    const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: true };
    tables[table].hasCreate = true;
    for (const line of lines) {
      const col = line.replace(/,$/, '').trim();
      if (/^constraint\s+/i.test(col) || /^(primary key|unique)/i.test(col)) {
        if (/references\s+public\.[a-z0-9_]+/i.test(col)) {
          tables[table].fks.add(col);
        }
        continue;
      }
      const colName = col.split(/\s+/)[0].replace(/"/g, '');
      tables[table].columns[colName] = col;
      if (/references\s+public\.[a-z0-9_]+/i.test(col)) {
        tables[table].fks.add(col);
      }
    }
  }
  return tables;
}

function parseAlterColumns(sql, tables) {
  const regex = /alter table public\.([a-z0-9_]+)\s+add column if not exists\s+([a-z0-9_]+)\s+([^;]+?);/gim;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const [_, table, col, def] = match;
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false };
    if (!tables[table].hasCreate) continue;
    tables[table].columns[col] = `${col} ${def.trim()}`;
    if (/references\s+public\.[a-z0-9_]+/i.test(def)) tables[table].fks.add(`${col} ${def.trim()}`);
  }
}

function parseIndexes(sql, tables) {
  const regex = /create index if not exists ([a-z0-9_]+)\s+on public\.([a-z0-9_]+)\s*\(([^\)]+)\)/gim;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const [, name, table] = match;
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false };
    if (!tables[table].hasCreate) continue;
    tables[table].indexes.add(name);
  }
}

function parseExistingSQL() {
  const dir = 'supabase';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql') && f !== 'schema-completo-centro-cultural.sql');
  const tables = {};
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = parseCreateTables(content);
    for (const [table, def] of Object.entries(parsed)) {
      tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set() };
      Object.assign(tables[table].columns, def.columns);
      def.fks.forEach(f => tables[table].fks.add(f));
    }
    parseAlterColumns(content, tables);
    parseIndexes(content, tables);
  }
  return tables;
}

function parseTargetSchema() {
  const schema = fs.readFileSync(path.join('supabase', 'schema-completo-centro-cultural.sql'), 'utf8');
  const tables = parseCreateTables(schema);
  parseIndexes(schema, tables);
  return tables;
}

function diff(codeUsage, existing, target) {
  const missing = { tables: [], columns: {}, indexes: {}, fks: {} };

  for (const table of Object.keys(codeUsage).sort()) {
    if (!existing[table]) {
      missing.tables.push(table);
      continue;
    }
    const usedCols = codeUsage[table];
    for (const col of usedCols) {
      if (!existing[table].columns[col]) {
        missing.columns[table] = missing.columns[table] || [];
        missing.columns[table].push(col);
      }
    }
  }

  for (const [table, def] of Object.entries(target)) {
    if (!existing[table]) continue;
    for (const idx of def.indexes) {
      if (!existing[table].indexes.has(idx)) {
        missing.indexes[table] = missing.indexes[table] || [];
        missing.indexes[table].push(idx);
      }
    }
    for (const fk of def.fks) {
      const fnorm = fk.replace(/\s+/g, ' ').trim();
      const found = [...existing[table].fks].some(e => e.replace(/\s+/g, ' ').includes(fnorm.split(' ').slice(0, 1)[0]));
      if (!found) {
        missing.fks[table] = missing.fks[table] || [];
        missing.fks[table].push(fk);
      }
    }
  }

  return missing;
}

const codeUsage = extractCodeUsage();
const existing = parseExistingSQL();
const target = parseTargetSchema();
const missing = diff(codeUsage, existing, target);

console.log('MISSING TABLES:', missing.tables.length);
console.log(missing.tables.join('\n'));
console.log('\nMISSING COLUMNS:');
for (const [table, cols] of Object.entries(missing.columns)) {
  console.log(`\n${table}: ${cols.join(', ')}`);
}
console.log('\nMISSING INDEXES:');
for (const [table, idxs] of Object.entries(missing.indexes)) {
  console.log(`\n${table}: ${idxs.join(', ')}`);
}
console.log('\nMISSING FKS:');
for (const [table, fks] of Object.entries(missing.fks)) {
  console.log(`\n${table}: ${fks.join(' | ')}`);
}
