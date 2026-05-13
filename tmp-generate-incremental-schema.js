const fs = require('fs');
const path = require('path');
const targetSqlPath = path.join('supabase', 'schema-completo-centro-cultural.sql');
const supabaseDir = path.join('supabase');

function parseCreateTables(sql) {
  const tables = {};
  const regex = /create table if not exists public\.([a-z0-9_]+)\s*\(([^;]+?)\);/gis;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const table = match[1];
    const body = match[2].trim();
    const lines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: true, body: null };
    tables[table].hasCreate = true;
    tables[table].body = body;
    for (const line of lines) {
      const col = line.replace(/,$/, '').trim();
      if (/^constraint\s+/i.test(col) || /^(primary key|unique)/i.test(col)) {
        if (/references\s+public\.[a-z0-9_]+/i.test(col)) {
          tables[table].fks.add(col);
        }
        continue;
      }
      const [colName] = col.split(/\s+/);
      tables[table].columns[colName.replace(/"/g, '')] = col;
      if (/references\s+public\.[a-z0-9_]+/i.test(col)) {
        tables[table].fks.add(col);
      }
    }
  }
  return tables;
}

function parseAlterStatements(sql, tables) {
  const addColumnRegex = /alter table public\.([a-z0-9_]+)\s+add column if not exists\s+([a-z0-9_]+)\s+([^;]+?);/gim;
  let match;
  while ((match = addColumnRegex.exec(sql)) !== null) {
    const table = match[1];
    const col = match[2];
    const def = match[3].trim();
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false, hasAlter: false, body: null };
    tables[table].hasAlter = true;
    tables[table].columns[col] = `${col} ${def}`;
    if (/references\s+public\.[a-z0-9_]+/i.test(def)) {
      tables[table].fks.add(`${col} ${def}`);
    }
  }
}

function parseIndexes(sql, tables) {
  const regex = /create index if not exists ([a-z0-9_]+)\s+on public\.([a-z0-9_]+)\s*\(([^\)]+)\)/gim;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const index = match[1];
    const table = match[2];
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false, hasAlter: false, body: null };
    tables[table].indexes.add(index);
  }
}

function parseExistingSQL() {
  const files = fs.readdirSync(supabaseDir).filter(f => f.endsWith('.sql') && f !== path.basename(targetSqlPath));
  const tables = {};
  files.forEach(file => {
    const sql = fs.readFileSync(path.join(supabaseDir, file), 'utf8');
    const parsed = parseCreateTables(sql);
    for (const [table, def] of Object.entries(parsed)) {
      tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false, hasAlter: false, body: null };
      tables[table].hasCreate = true;
      tables[table].body = def.body;
      Object.assign(tables[table].columns, def.columns);
      def.fks.forEach(fk => tables[table].fks.add(fk));
    }
    parseAlterStatements(sql, tables);
    parseIndexes(sql, tables);
  });
  return tables;
}

function parseTargetSchema() {
  const sql = fs.readFileSync(targetSqlPath, 'utf8');
  const tables = parseCreateTables(sql);
  parseIndexes(sql, tables);
  return tables;
}

function keyNormalized(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function buildMissingPatch(codeUsage, existing, target) {
  const sqlParts = [];
  const touchedTables = new Set();
  const missingTables = [];

  const existingTableNames = new Set(Object.keys(existing));
  for (const table of Object.keys(codeUsage).sort()) {
    const exists = existingTableNames.has(table);
    if (!exists) {
      missingTables.push(table);
    }
  }

  for (const table of missingTables) {
    const def = target[table];
    if (!def) continue;
    sqlParts.push(`-- Create missing table ${table}`);
    sqlParts.push(`create table if not exists public.${table} (
${def.body.split(/\r?\n/).map(line => `  ${line.trim()}`).join('\n')}
);`);
    if (def.indexes.size) {
      for (const idx of def.indexes) {
        sqlParts.push(`create index if not exists ${idx} on public.${table} (${extractIndexColumns(target, table, idx)});`);
      }
    }
    touchedTables.add(table);
  }

  for (const table of Object.keys(target).sort()) {
    const def = target[table];
    const exists = existingTableNames.has(table);
    if (!exists) continue;
    const existingDef = existing[table];
    const missingCols = [];
    for (const [col, colDef] of Object.entries(def.columns)) {
      if (!existingDef.columns[col]) {
        missingCols.push({ col, colDef });
      }
    }
    if (missingCols.length) {
      sqlParts.push(`-- Add missing columns to ${table}`);
      for (const { col, colDef } of missingCols) {
        sqlParts.push(`alter table public.${table} add column if not exists ${colDef};`);
      }
      touchedTables.add(table);
    }
    const missingIdx = [...def.indexes].filter(idx => !existingDef.indexes.has(idx));
    if (missingIdx.length) {
      sqlParts.push(`-- Create missing indexes for ${table}`);
      for (const idx of missingIdx) {
        sqlParts.push(`create index if not exists ${idx} on public.${table} (${extractIndexColumns(target, table, idx)});`);
      }
      touchedTables.add(table);
    }
    const missingFks = [...def.fks].filter(fk => {
      const norm = keyNormalized(fk);
      return ![...existingDef.fks].some(existingFk => keyNormalized(existingFk).includes(norm.split(' ')[0]));
    });
    const missingFkDefs = missingFks
      .map(fk => parseFkDefinition(table, fk))
      .filter(Boolean)
      .filter(def => existingDef.columns[def.columns.split(',')[0].trim()]);
    if (missingFkDefs.length) {
      sqlParts.push(`-- Add missing foreign keys for ${table}`);
      for (const def of missingFkDefs) {
        sqlParts.push(
          `alter table public.${table} add constraint if not exists ${def.name} foreign key (${def.columns}) ${def.reference};`
        );
      }
      touchedTables.add(table);
    }
  }

  if (!sqlParts.length) {
    return '-- No incremental schema changes detected.';
  }
  return sqlParts.join('\n') + '\n';
}

function parseFkDefinition(table, fk) {
  const constraintMatch = fk.match(/constraint\s+([a-z0-9_]+)\s+foreign key\s*\(([^)]+)\)\s*(references.*)/i);
  if (constraintMatch) {
    return {
      name: constraintMatch[1],
      columns: constraintMatch[2].trim(),
      reference: constraintMatch[3].trim(),
    };
  }

  const colMatch = fk.match(/^\s*([a-z0-9_]+)\s+[a-z0-9_]+[^]*references\s+public\.([a-z0-9_]+)\s*\(([^)]+)\)(.*)$/i);
  if (colMatch) {
    const name = `${table}_${colMatch[1]}_fkey`;
    const reference = `references public.${colMatch[2]}(${colMatch[3]})${colMatch[4] || ''}`.trim();
    return {
      name,
      columns: colMatch[1],
      reference,
    };
  }

  return null;
}

function extractIndexColumns(target, table, idxName) {
  const lines = fs.readFileSync(targetSqlPath, 'utf8').split(/\r?\n/);
  const regex = new RegExp(`create index if not exists ${idxName}\\s+on public\\.${table}\\s*\\(([^\\)]+)\\)`, 'i');
  for (const line of lines) {
    const m = line.match(regex);
    if (m) return m[1].trim();
  }
  return '1';
}

function extractCodeUsage() {
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const tables = {};
  const patterns = [/\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.insert\s*\(/gi, /\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.update\s*\(/gi];
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
      const full = path.join(dir, dirent.name);
      if (dirent.name === 'node_modules' || dirent.name === '.git' || dirent.name === 'supabase' || dirent.name === '.next' || dirent.name === 'public') return [];
      if (dirent.isDirectory()) return walk(full);
      if (!exts.has(path.extname(dirent.name))) return [];
      return [full];
    });
  }
  for (const file of walk(process.cwd())) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const table = m[1];
        const objStart = pattern.lastIndex - 1;
        const objText = findObjectLiteral(text, objStart);
        if (!objText) continue;
        const keys = parseKeysFromObject(objText);
        tables[table] = tables[table] || new Set();
        keys.forEach(k => tables[table].add(k));
      }
    }
  }
  return tables;
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
  for (const line of objText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const match = trimmed.match(/^['"]?([a-zA-Z0-9_]+)['"]?\s*:/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

const codeUsage = extractCodeUsage();
const existing = parseExistingSQL();
const target = parseTargetSchema();
const patch = buildMissingPatch(codeUsage, existing, target);
fs.writeFileSync(path.join(supabaseDir, 'schema-incremental-centro-cultural.sql'), patch);
console.log('Generated supabase/schema-incremental-centro-cultural.sql');
console.log(patch);
