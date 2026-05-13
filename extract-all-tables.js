#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const tables = new Set();
const files = getAllFiles('app');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.matchAll(/\.from\(['"]([a-z_0-9]+)['"]\)/gi);
  for (const match of matches) {
    tables.add(match[1]);
  }
}

const sorted = Array.from(tables).sort();
console.log('All unique tables referenced in app/:');
console.log('====================================');
sorted.forEach(t => console.log(t));
console.log(`\nTotal: ${sorted.length} tables`);
