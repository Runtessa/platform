const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, run } = require('./runtime-harness.cjs');
const { load } = require('./logging-harness.cjs');

const models = [
  { path: 'Owner.ts', code: `const {Entity, PrimaryGeneratedColumn, Column} = require('typeorm');
    class Owner {} Entity('runtime_owners')(Owner); PrimaryGeneratedColumn()(Owner.prototype, 'id');
    Column({type: 'text'})(Owner.prototype, 'name'); module.exports = {Owner};` },
  { path: 'Note.ts', code: `const {Entity, PrimaryGeneratedColumn, Column, ManyToOne} = require('typeorm');
    const {Owner} = require('./Owner.ts');
    class Note { label() { return 'dynamic-method'; } }
    Entity('runtime_notes')(Note); PrimaryGeneratedColumn()(Note.prototype, 'id');
    Column({type: 'text'})(Note.prototype, 'text'); ManyToOne(() => Owner)(Note.prototype, 'owner');
    module.exports = {Note};` },
];

test('live model imports, TypeORM decorators, relations and class methods remain executable', async () => {
  const result = await fixture({ operation: 'models', models });
  assert.deepEqual(result.tables, ['runtime_notes', 'runtime_owners']);
  assert.equal(result.methodResult, 'dynamic-method');
  assert.ok(result.columns.includes('text'));
  assert.deepEqual(result.relations, ['owner']);
});

test('model top-level code cannot read private service files', async () => {
  await assert.rejects(fixture({ operation: 'models', models: [{ path: 'Attempt.js', code:
    "require('node:fs').readFileSync('/etc/shadow'); module.exports = {};" }] }), /ENOENT|EACCES|denied/i);
});

test('model top-level infinite loop is killed by parent deadline', async () => {
  await assert.rejects(fixture({ operation: 'models', models: [{ path: 'Attempt.js', code: 'while(true){}' }] }, { timeoutMs: 1500 }), /timed out/i);
});

test('IDE migration evaluates invalid model code only in the restricted child and preserves validation status', async () => {
  const { migrateOrmModels } = load('src/ideNew/src/lib/orm-migration.ts', {
    path: require('node:path'), 'node:module': require('node:module'),
  });
  await assert.rejects(migrateOrmModels([{ path: 'invalid.js', code: 'while(true){' }], 'postgres', {}),
    (error) => error.statusCode === 400 && /Failed to load ORM entities/.test(error.message));
});

test('bundling the IDE helper preserves native runtime resolution and child validation', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const ts = require('typescript');
  const webpack = require('next/dist/compiled/webpack/webpack').webpack;
  const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'idpcore-runtime-bundle-'));
  try {
    const source = fs.readFileSync(path.join(__dirname, '../../src/ideNew/src/lib/orm-migration.ts'), 'utf8');
    const javascript = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020,
    } }).outputText;
    const entry = path.join(directory, 'entry.js');
    fs.writeFileSync(entry, javascript);
    await new Promise((resolve, reject) => {
      const compiler = webpack({ mode: 'development', target: 'node', entry,
        output: { path: directory, filename: 'bundle.cjs', library: { type: 'commonjs2' } },
        optimization: { minimize: false },
      });
      compiler.run((error, stats) => compiler.close(() => {
        if (error || stats?.hasErrors()) reject(error || Error(stats.toString({ all: false, errors: true })));
        else resolve();
      }));
    });
    const { migrateOrmModels } = require(path.join(directory, 'bundle.cjs'));
    await assert.rejects(migrateOrmModels([{ path: 'invalid.js', code: 'while(true){' }], 'postgres', {}),
      (error) => error.statusCode === 400 && /Failed to load ORM entities/.test(error.message));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('shared code is fetched as data and executes in the restricted process', async () => {
  const capabilities = async (operation, value) => {
    assert.equal(operation, 'shared-package');
    assert.deepEqual(value, { name: 'live-library', version: 'latest' });
    return { name: 'live-library', version: '1', publishedVersion: '1',
      publishedCompiledCode: { code: 'module.exports = {add: (a, b) => a + b};' } };
  };
  const result = await run(`module.exports = async (request, adapters) => {
    const library = await adapters.shared.require('live-library');
    return {body: library.add(request.body.value, 10)};
  }`, capabilities);
  assert.equal(result.body, 13);
});

test('shared code loops cannot block the main service', async () => {
  await assert.rejects(run(`module.exports = async (_request, adapters) => {
    await adapters.shared.require('loop-library'); return {body: true};
  }`, async () => ({ name: 'loop-library', version: '1', publishedVersion: '1', publishedCompiledCode: { code: 'while(true){}' } })), /timed out/i);
});
