const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.resolve('g:/centro-cultural/supabase/schema-completo-centro-cultural.sql'), 'utf8');
const lines = text.split(/\r?\n/);
let currentTable = null;
const refs = {};
for (const line of lines) {
  const createMatch = line.match(/^create table if not exists\s+public\.([a-z0-9_]+) /i);
  if (createMatch) {
    currentTable = createMatch[1];
    continue;
  }
  const refMatch = line.match(/references public\.([a-z0-9_]+)\(/i);
  if (refMatch && currentTable) {
    const target = refMatch[1];
    const keyMatch = line.match(/\s*([a-z0-9_]+)\s+[a-z0-9_]+/i);
    const sourceCol = keyMatch ? keyMatch[1] : null;
    if (!sourceCol) continue;
    const pair = `${currentTable} -> ${target}`;
    refs[pair] = refs[pair] || [];
    refs[pair].push({source: sourceCol, line: line.trim()});
  }
}
for (const pair of Object.keys(refs).sort()) {
  const arr = refs[pair];
  if (arr.length>1) {
    console.log(pair, arr.length);
    arr.forEach((item) => console.log('  ', item.source, item.line));
  }
}
