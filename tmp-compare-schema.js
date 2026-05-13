const fs = require('fs');
const path = require('path');

function readSqlFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.sql'))
    .map(file => ({ file, content: fs.readFileSync(path.join(dir, file), 'utf-8') }));
}

function parseCreateTables(sql) {
  const tables = {};
  const createTableRegex = /create table if not exists public\.([a-z0-9_]+)\s*\(([^;]+?)\);/gis;
  let match;
  while ((match = createTableRegex.exec(sql)) !== null) {
    const [_, table, body] = match;
    const lines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    tables[table] = tables[table] || { columns: {}, fks: [], uniq: [], checks: [], indexes: new Set(), defs: [] };
    for (const line of lines) {
      const col = line.replace(/,$/, '').trim();
      if (/^constraint\s+/i.test(col)) {
        tables[table].defs.push(col);
        if (/foreign key/i.test(col) || /references/i.test(col)) tables[table].fks.push(col);
        if (/unique/i.test(col)) tables[table].uniq.push(col);
        if (/check/i.test(col)) tables[table].checks.push(col);
      } else if (/^(primary key|unique|constraint)/i.test(col)) {
        tables[table].defs.push(col);
        if (/references/i.test(col)) tables[table].fks.push(col);
      } else {
        const colName = col.split(/\s+/)[0].replace(/"/g, '');
        tables[table].columns[colName] = col;
        if (/references\s+public\.[a-z0-9_]+/i.test(col)) {
          tables[table].fks.push(col);
        }
      }
    }
  }
  return tables;
}

function parseAlterColumns(sql, existing) {
  const regex = /alter table public\.([a-z0-9_]+)\s+add column if not exists\s+([a-z0-9_]+)\s+([^;]+?);/gim;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const [_, table, col, def] = match;
    existing[table] = existing[table] || { columns: {}, fks: [], uniq: [], checks: [], indexes: new Set(), defs: [] };
    existing[table].columns[col] = `${col} ${def.trim()}`;
    if (/references\s+public\.[a-z0-9_]+/i.test(def)) {
      existing[table].fks.push(`${col} ${def.trim()}`);
    }
  }
}

function parseIndexes(sql, existing) {
  const idxRegex = /create index if not exists ([a-z0-9_]+)\s+on public\.([a-z0-9_]+)\s*\(([^\)]+)\)/gim;
  let match;
  while ((match = idxRegex.exec(sql)) !== null) {
    const [, name, table, cols] = match;
    existing[table] = existing[table] || { columns: {}, fks: [], uniq: [], checks: [], indexes: new Set(), defs: [] };
    existing[table].indexes.add(name);
  }
}

function mergeTables(target, source) {
  for (const [table, def] of Object.entries(source)) {
    target[table] = target[table] || { columns: {}, fks: [], uniq: [], checks: [], indexes: new Set(), defs: [] };
    Object.assign(target[table].columns, def.columns);
    target[table].fks.push(...def.fks);
    target[table].uniq.push(...def.uniq);
    target[table].checks.push(...def.checks);
    for (const idx of def.indexes) target[table].indexes.add(idx);
  }
}

function parseSchemaFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const tables = parseCreateTables(sql);
  parseIndexes(sql, tables);
  return tables;
}

function parseExistingFiles(dir) {
  const files = readSqlFiles(dir).filter(entry => entry.file !== 'schema-completo-centro-cultural.sql');
  const tables = {};
  for (const { file, content } of files) {
    mergeTables(tables, parseCreateTables(content));
    parseAlterColumns(content, tables);
    parseIndexes(content, tables);
  }
  return tables;
}

function diffSchemas(generated, existing) {
  const missing = {
    tables: [],
    columns: {},
    indexes: {},
    fks: {},
  };

  for (const [table, gen] of Object.entries(generated)) {
    if (!existing[table]) {
      missing.tables.push(table);
      continue;
    }
    for (const [col, def] of Object.entries(gen.columns)) {
      if (!existing[table].columns[col]) {
        missing.columns[table] = missing.columns[table] || [];
        missing.columns[table].push({ column: col, definition: def });
      }
    }
    for (const idx of gen.indexes) {
      if (!existing[table].indexes.has(idx)) {
        missing.indexes[table] = missing.indexes[table] || [];
        missing.indexes[table].push(idx);
      }
    }
    // PK/FK and unique constraints not fully compared due to expression variance; only check foreign key references by column names.
    for (const fk of gen.fks) {
      if (!existing[table].fks.some(existingFk => existingFk.replace(/\s+/g, ' ').includes(fk.split(/\s+/)[0]) || existingFk.includes(fk))) {
        missing.fks[table] = missing.fks[table] || [];
        missing.fks[table].push(fk);
      }
    }
  }

  return missing;
}

function main() {
  const gen = parseSchemaFile('supabase/schema-completo-centro-cultural.sql');
  const existing = parseExistingFiles('supabase');
  const missing = diffSchemas(gen, existing);
  console.log('MISSING TABLES:', missing.tables.length);
  console.log(missing.tables.join('\n'));
  console.log('\nMISSING COLUMNS:');
  for (const [table, cols] of Object.entries(missing.columns)) {
    console.log(`\n${table}:`);
    cols.forEach(c => console.log(`  - ${c.column}: ${c.definition}`));
  }
  console.log('\nMISSING INDEXES:');
  for (const [table, idxs] of Object.entries(missing.indexes)) {
    console.log(`\n${table}:`);
    idxs.forEach(i => console.log(`  - ${i}`));
  }
  console.log('\nMISSING FKS:');
  for (const [table, fks] of Object.entries(missing.fks)) {
    console.log(`\n${table}:`);
    fks.forEach(f => console.log(`  - ${f}`));
  }
}

main();
