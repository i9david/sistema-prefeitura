const ts = require('typescript');
const fs = require('fs');
const source = fs.readFileSync('app/casa-artesao/produtos/page.tsx', 'utf8');
const sourceFile = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = sourceFile.parseDiagnostics;
console.log('diagnostics', diagnostics.length);
for (const d of diagnostics) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start);
  console.log(d.code, d.messageText, 'line', line + 1, 'char', character + 1);
  console.log(source.split(/\r?\n/)[line]);
}
