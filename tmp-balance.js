const fs = require('fs');
const source = fs.readFileSync('app/casa-artesao/produtos/page.tsx', 'utf8');
const stack = [];
let inSingle = false, inDouble = false, inTemplate = false, inComment = false, inLineComment = false, escape = false;
const pairs = { '(': ')', '{': '}', '[': ']' };
for (let i = 0; i < source.length; i++) {
  const ch = source[i];
  const prev = source[i-1];
  if (inComment) {
    if (!inLineComment && ch === '*' && source[i+1] === '/') { inComment = false; i++; continue; }
    if (inLineComment && ch === '\n') { inComment = false; continue; }
    continue;
  }
  if (escape) { escape = false; continue; }
  if (inSingle) {
    if (ch === "'" ) inSingle = false;
    else if (ch === '\\') escape = true;
    continue;
  }
  if (inDouble) {
    if (ch === '"') inDouble = false;
    else if (ch === '\\') escape = true;
    continue;
  }
  if (inTemplate) {
    if (ch === '`') inTemplate = false;
    else if (ch === '\\') escape = true;
    continue;
  }
  if (ch === '/' && source[i+1] === '*') { inComment = true; i++; continue; }
  if (ch === '/' && source[i+1] === '/') { inComment = true; inLineComment = true; i++; continue; }
  if (ch === "'") { inSingle = true; continue; }
  if (ch === '"') { inDouble = true; continue; }
  if (ch === '`') { inTemplate = true; continue; }
  if (ch === '(' || ch === '{' || ch === '[') { stack.push({ ch, pos: i }); continue; }
  if (ch === ')' || ch === '}' || ch === ']') {
    const top = stack.pop();
    if (!top) { console.log('unmatched closing', ch, 'at', i); break; }
    if (pairs[top.ch] !== ch) { console.log('mismatch', top, 'with', ch, 'at', i); break; }
  }
}
console.log('stack remaining', stack.map(x=>x.ch + '@'+x.pos).slice(0,20));
