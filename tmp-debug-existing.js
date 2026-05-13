const fs = require('fs');
const path = require('path');
function parseCreateTables(sql) {
  const tables = {};
  const regex = /create table if not exists public\.([a-z0-9_]+)\s*\(([^;]+?)\);/gis;
  let m;
  while ((m = regex.exec(sql)) !== null) {
    const table = m[1];
    tables[table] = { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: true };
  }
  return tables;
}
function parseIndexes(sql, tables) {
  const regex = /create index if not exists ([a-z0-9_]+)\s+on public\.([a-z0-9_]+)\s*\(([^\)]+)\)/gim;
  let m;
  while ((m = regex.exec(sql)) !== null) {
    const [, idx, table] = m;
    tables[table] = tables[table] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false };
    if (!tables[table].hasCreate) continue;
    tables[table].indexes.add(idx);
  }
}
function parseExisting() {
  const tables = {};
  const files = fs.readdirSync('supabase').filter(f => f.endsWith('.sql') && f !== 'schema-completo-centro-cultural.sql');
  for (const file of files) {
    const txt = fs.readFileSync(path.join('supabase', file), 'utf8');
    const local = parseCreateTables(txt);
    parseIndexes(txt, local);
    for (const [name, def] of Object.entries(local)) {
      tables[name] = tables[name] || { columns: {}, indexes: new Set(), fks: new Set(), hasCreate: false };
      if (def.hasCreate) tables[name].hasCreate = true;
      def.indexes.forEach(i => tables[name].indexes.add(i));
    }
  }
  return tables;
}
function parseTarget() {
  const txt = fs.readFileSync(path.join('supabase', 'schema-completo-centro-cultural.sql'), 'utf8');
  const tables = parseCreateTables(txt);
  parseIndexes(txt, tables);
  return tables;
}
const existing = parseExisting();
const target = parseTarget();
console.log('existing.alunos.hasCreate', existing.alunos && existing.alunos.hasCreate);
console.log('existing.alunos.indexes', existing.alunos && [...existing.alunos.indexes]);
console.log('target.alunos.indexes', target.alunos && [...target.alunos.indexes]);
console.log('existing.visitantes', existing.visitantes && { hasCreate: existing.visitantes.hasCreate, indexes: [...existing.visitantes.indexes || []], columns: Object.keys(existing.visitantes.columns || {}) });
console.log('existing.visitante_visitas', existing.visitante_visitas && { hasCreate: existing.visitante_visitas.hasCreate, indexes: [...existing.visitante_visitas.indexes || []], columns: Object.keys(existing.visitante_visitas.columns || {}) });
