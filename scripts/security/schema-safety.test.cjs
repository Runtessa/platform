require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const { nativePostgres } = require('../database/native-postgres.cjs');
const { runRestrictedProcess, runtimeDependencyRoots } = require('@idp/shared/dist/runtime/restricted-process');
const { isAdditiveSchemaQuery } = require('@idp/shared/dist/runtime/orm-migration-policy');
let database, source;
const model = (table, columns = { text: { type: 'text' } }) => [{ path: `${table}.js`, code: `
  const { Entity, PrimaryGeneratedColumn, Column } = require('typeorm');
  class Note {} Entity(${JSON.stringify(table)})(Note); PrimaryGeneratedColumn()(Note.prototype, 'id');
  ${Object.entries(columns).map(([name, options]) => `Column(${JSON.stringify(options)})(Note.prototype, ${JSON.stringify(name)});`).join('\n')}
  module.exports = { Note };` }];
const migrate = (models, options = {}) => runRestrictedProcess({
  entrypoint: require.resolve('@idp/shared/dist/runtime/ormMigrationProcess.js'),
  readOnlyRoots: runtimeDependencyRoots(), timeoutMs: 30000, memoryMb: 256,
  input: { models, adapter: 'postgres', config: { ...database.config, poolSize: 1, extra: { max: 1 }, dropSchema: true, migrationsRun: true, cache: true }, ...options },
});
before(async () => {
  database = await nativePostgres();
  source = new DataSource({ ...database.config, entities: [] }); await source.initialize();
  await source.query("CREATE TABLE operator_marker (value text); INSERT INTO operator_marker VALUES ('preserved')");
});
after(async () => { if (source?.isInitialized) await source.destroy(); if (database) await database.stop(); });

test('schema policy accepts additions and quoted values, denies removals and multiple statements', () => {
  for (const sql of [
    'CREATE TABLE "notes" (id SERIAL PRIMARY KEY, text text)',
    'ALTER TABLE "public"."notes" ADD "extra" text',
    'ALTER TABLE "notes" ADD CONSTRAINT "fk" FOREIGN KEY ("id") REFERENCES "other"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    'ALTER TABLE "notes" ADD "DROP" text DEFAULT \'DROP; DELETE\'',
  ]) assert.equal(isAdditiveSchemaQuery(sql), true, sql);
  for (const sql of [
    'ALTER TABLE "notes" DROP COLUMN "text"', 'ALTER TABLE "notes" ALTER COLUMN "text" TYPE integer',
    'ALTER TABLE "notes" RENAME COLUMN "text" TO "label"', 'CREATE TABLE "new" (id int); DROP TABLE "notes"',
    'ALTER TABLE "notes" ADD "extra" text /* hidden SQL */', 'DELETE FROM "notes"',
  ]) assert.equal(isAdditiveSchemaQuery(sql), false, sql);
});

test('plan does not write; first installation applies safely, records history and repeats', async () => {
  const models = model('safety_notes');
  const preview = await migrate(models, { action: 'plan' });
  assert.equal(preview.plan.safe, true); assert.equal(preview.applied, false);
  assert.equal((await source.query("SELECT to_regclass('safety_notes') AS name"))[0].name, null);
  assert.equal((await source.query('SELECT to_regclass(\'"query-result-cache"\') AS name'))[0].name, null);
  const result = await migrate(models, { expectedPlanHash: preview.plan.hash });
  assert.equal(result.ok, true); assert.equal(result.applied, true); assert.equal(result.transactional, true);
  assert.equal((await source.query('SELECT count(*)::int AS count FROM runtessa_model_migrations'))[0].count, 1);
  assert.deepEqual(await source.query('SELECT value FROM operator_marker'), [{ value: 'preserved' }]);
  assert.equal((await migrate(models)).plan.statements.length, 0);
  await source.query("INSERT INTO safety_notes (text) VALUES ('keep this row')");
});

test('nullable additions preserve data; column removal and type change apply no statements', async () => {
  const columns = { text: { type: 'text' }, extra: { type: 'text', nullable: true } };
  await migrate(model('safety_notes', columns));
  const before = await source.query('SELECT * FROM safety_notes');
  assert.equal(before[0].extra, null);
  for (const unsafe of [model('safety_notes', { extra: columns.extra }), model('safety_notes', { ...columns, text: { type: 'integer' } })]) {
    const plan = await migrate(unsafe, { action: 'plan' }); assert.equal(plan.plan.safe, false);
    await assert.rejects(migrate(unsafe), (error) => error.statusCode === 409);
    assert.deepEqual(await source.query('SELECT * FROM safety_notes'), before);
  }
});

test('a reviewed schema plan becomes stale when another update applies it', async () => {
  const models = model('safety_notes', { text: { type: 'text' }, extra: { type: 'text', nullable: true }, reviewed: { type: 'text', nullable: true } });
  const preview = await migrate(models, { action: 'plan' });
  await migrate(models);
  await assert.rejects(migrate(models, { expectedPlanHash: preview.plan.hash }), /plan changed/);
});

test('DDL failure rolls back prior additions and history in the same PostgreSQL transaction', async () => {
  await migrate(model('safety_rollback'));
  await source.query("INSERT INTO safety_rollback (text) VALUES ('keep')");
  const count = (await source.query('SELECT count(*)::int AS count FROM runtessa_model_migrations'))[0].count;
  await assert.rejects(migrate(model('safety_rollback', {
    text: { type: 'text' }, added_first: { type: 'text', nullable: true }, required: { type: 'text', nullable: false },
  })));
  assert.deepEqual((await source.query("SELECT column_name FROM information_schema.columns WHERE table_name='safety_rollback' ORDER BY ordinal_position")).map((row) => row.column_name), ['id', 'text']);
  assert.equal((await source.query('SELECT count(*)::int AS count FROM runtessa_model_migrations'))[0].count, count);
  assert.equal((await source.query('SELECT text FROM safety_rollback'))[0].text, 'keep');
});

test('concurrent schema updates serialize and apply a new table once', async () => {
  const results = await Promise.all([migrate(model('safety_parallel')), migrate(model('safety_parallel'))]);
  assert.ok(results.every((result) => result.ok));
  assert.equal(results.filter((result) => result.plan.statements.length > 0).length, 1);
});
