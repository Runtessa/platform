// Candidate discovery, not a semantic equivalence check. Review matches before extracting them.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const reviewed = new Map(require('./duplicate-review.json')
  .flatMap((item) => [item.hash, ...(item.previousHashes || [])].map((hash) => [hash, item])));
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'src', 'scripts'],
  { cwd: root }).toString().split('\0'))]
  .filter((file) => /\.(?:[cm]?js|[jt]sx?)$/.test(file) && fs.existsSync(path.join(root, file)))
  .filter((file) => !/\/public\/(?:babel|lib|monaco)\//.test(file)).sort();
const bodies = new Map();
const inventory = [], diagnostics = [];
const normalize = (text) => {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const tokens = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    tokens.push(scanner.getTokenText());
  }
  return tokens;
};
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  inventory.push({ file, lines: text.split(/\r?\n/).length });
  for (const item of source.parseDiagnostics) diagnostics.push({ file,
    line: source.getLineAndCharacterOfPosition(item.start).line + 1,
    message: ts.flattenDiagnosticMessageText(item.messageText, ' ') });
  const visit = (node) => {
    if (ts.isFunctionLike(node) && node.body) {
      const start = source.getLineAndCharacterOfPosition(node.body.getStart(source)).line + 1;
      const end = source.getLineAndCharacterOfPosition(node.body.end).line + 1;
      const tokens = normalize(node.body.getText(source));
      if (tokens.length >= 80 && end - start >= 9) {
        const hash = crypto.createHash('sha256').update(JSON.stringify(tokens)).digest('hex');
        const name = node.name?.getText(source) || node.parent?.name?.getText(source) || '<anonymous>';
        const group = bodies.get(hash) || { hash, tokens: tokens.length, occurrences: [] };
        group.occurrences.push({ file, name, start, end }); bodies.set(hash, group);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const duplicateGroups = [...bodies.values()].filter((group) => group.occurrences.length > 1)
  .sort((a, b) => b.tokens * (b.occurrences.length - 1) - a.tokens * (a.occurrences.length - 1) || a.hash.localeCompare(b.hash))
  .map((group) => ({ id: reviewed.get(group.hash)?.id || `NEW-${group.hash.slice(0, 10)}`,
    disposition: reviewed.get(group.hash)?.disposition || 'needs-review',
    priority: reviewed.get(group.hash)?.priority || 'unreviewed', ...group }));
const reintroducedGroups = duplicateGroups.filter((group) => group.disposition === 'consolidated').map((group) => group.id);
const result = {
  scope: 'Git-tracked and non-ignored untracked src/scripts JS/TS; excludes public babel/lib/monaco vendors',
  method: 'Exact function-body tokens, ignoring whitespace/comments; identifiers/literals preserved; minimum 80 tokens and 10 lines. Matches need human review. Does not detect all near-duplicates.',
  files: files.length, totalLines: inventory.reduce((sum, item) => sum + item.lines, 0),
  parseDiagnostics: diagnostics, reintroducedGroups, duplicateGroups,
  largestFiles: inventory.sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file)).slice(0, 30),
};
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1) {
  if (!process.argv[outputIndex + 1]) throw Error('--output requires a file path');
  const output = path.resolve(root, process.argv[outputIndex + 1]);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Audited ${result.files} files: ${diagnostics.length} parse errors, ${duplicateGroups.length} duplicate candidates. Wrote ${path.relative(root, output)}.`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
if (diagnostics.length || reintroducedGroups.length) process.exitCode = 1;
