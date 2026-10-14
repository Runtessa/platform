require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const { randomBytes } = require('node:crypto');
const { coreEntities, ideEntities, catalogEntities } = require('@idp/shared/dist/database/entities');
const { platformMigrations } = require('@idp/shared/dist/database/migration-registry');
const { runPlatformMigrations } = require('@idp/shared/dist/database/migrate');
const { assertPlatformSchema, initializePlatformDataSource } = require('@idp/shared/dist/database/schema-readiness');
const { nativePostgres } = require('./native-postgres.cjs');

const fixtures = new Map();
const sources = new Set();
const fresh = async (entities = coreEntities) => {
  const database = await nativePostgres();
  const source = new DataSource({ ...database.config, schema: 'public', entities });
  fixtures.set(source, database);
  sources.add(source); await source.initialize(); return source;
};
const view = async (source, entities) => {
  const connection = new DataSource({ ...source.options, entities });
  sources.add(connection); await connection.initialize(); return connection;
};
const rawBaseline = async (source, schema) => {
  for (const migration of platformMigrations(schema).filter(item => item.kind === 'baseline')) for (const sql of migration.sql) await source.query(sql);
};
const hasLedger = async (source) => (await source.query("SELECT to_regclass('public.idp_schema_migrations') AS name"))[0].name !== null;
const assertNoDiff = async (source) => assert.deepEqual((await source.driver.createSchemaBuilder().log()).upQueries, []);
after(async () => {
  for (const source of sources) if (source.isInitialized) await source.destroy().catch(() => {});
  for (const database of fixtures.values()) await database.stop();
});

test('startup checks pending migrations without creating tables or UUID extensions', async () => {
  const source = await fresh();
  await source.destroy();
  const queries = [];
  source.setOptions({ logging: ['query'], logger: {
    logQuery: (sql) => queries.push(sql), logQueryError() {}, logQuerySlow() {},
    logSchemaBuild() {}, logMigration() {}, log() {},
  } });
  const first = initializePlatformDataSource(source, 'core');
  const second = initializePlatformDataSource(source, 'core');
  assert.equal(first, second);
  await assert.rejects(first, (error) => error.statusCode === 503 && /pending/.test(error.message));
  assert.equal(source.isInitialized, false);
  assert.ok(queries.every((sql) => !/\b(CREATE|ALTER|DROP|TRUNCATE)\b/i.test(sql)));
  await source.initialize();
  assert.equal(await hasLedger(source), false);
  assert.deepEqual(await source.query("SELECT extname FROM pg_extension WHERE extname='uuid-ossp'"), []);
  await runPlatformMigrations(source, 'core');
  assert.equal(await initializePlatformDataSource(source, 'core'), source);
});

test('fresh Core and IDE migrations match metadata, share users, preserve rows and repeat safely', async () => {
  const core = await fresh();
  assert.deepEqual(await runPlatformMigrations(core, 'core'), platformMigrations('core').map((migration) => migration.id));
  await core.query("INSERT INTO tenants (hostname) VALUES ('live.example.test')");
  await core.query("INSERT INTO users (email) VALUES ('operator@example.test')");
  const [tenant] = await core.query('SELECT "resourceConfig", "authDbConfig" FROM tenants');
  assert.deepEqual(tenant.resourceConfig, { memory: 512, timeout: 5000 });
  assert.deepEqual(tenant.authDbConfig, { mode: 'shared', secretKey: null });
  await assertNoDiff(core);
  const ide = await view(core, ideEntities);
  assert.deepEqual(await runPlatformMigrations(ide, 'ide'), ['0004_platform_ide']);
  await assertNoDiff(ide);
  await assertPlatformSchema(core, 'core'); await assertPlatformSchema(ide, 'ide');
  assert.deepEqual(await runPlatformMigrations(core, 'core'), []);
  assert.deepEqual(await runPlatformMigrations(ide, 'ide'), []);
  assert.equal((await core.query('SELECT count(*)::int AS count FROM tenants'))[0].count, 1);
  assert.equal((await core.query('SELECT count(*)::int AS count FROM users'))[0].count, 1);
});

test('matching legacy schema is adopted without changing application data or unrelated tables', async () => {
  const source = await fresh(); await rawBaseline(source, 'core');
  await source.query("INSERT INTO tenants (hostname) VALUES ('preserved.example.test')");
  await source.query('CREATE TABLE operator_notes (note text)');
  await source.query("INSERT INTO operator_notes VALUES ('keep')");
  await assert.rejects(runPlatformMigrations(source, 'core'), /Existing tables/);
  assert.equal(await hasLedger(source), false);
  await runPlatformMigrations(source, 'core', true);
  assert.equal((await source.query('SELECT hostname FROM tenants'))[0].hostname, 'preserved.example.test');
  assert.deepEqual(await source.query('SELECT note FROM operator_notes'), [{ note: 'keep' }]);
  assert.equal((await source.query('SELECT count(*)::int AS count FROM idp_schema_migrations WHERE adopted'))[0].count, 3);
});

test('schema differences and partial legacy installs fail without destructive repair or history writes', async () => {
  const source = await fresh(); await rawBaseline(source, 'core');
  await source.query("ALTER TABLE tenants ADD COLUMN legacy_marker text DEFAULT 'keep'");
  await assert.rejects(runPlatformMigrations(source, 'core', true), /does not match.*tenants/);
  assert.equal(await hasLedger(source), false);
  assert.ok((await source.driver.createSchemaBuilder().log()).upQueries.some((query) => query.query.includes('legacy_marker')));
  const [column] = await source.query("SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND column_name='legacy_marker'");
  assert.equal(column.column_name, 'legacy_marker');
  const partial = await fresh();
  for (const sql of platformMigrations('core')[0].sql) await partial.query(sql);
  await assert.rejects(runPlatformMigrations(partial, 'core'), /Existing tables/);
  await assert.rejects(runPlatformMigrations(partial, 'core', true), /does not match/);
  assert.equal(await hasLedger(partial), false);
  assert.equal((await partial.query("SELECT to_regclass('public.tenants') AS name"))[0].name, null);
});

test('checksum tampering, unknown versions and missing dependencies block startup', async () => {
  const source = await fresh(); await runPlatformMigrations(source, 'core');
  await source.query("UPDATE idp_schema_migrations SET checksum='tampered' WHERE id='0001_platform_users'");
  await assert.rejects(assertPlatformSchema(source, 'core'), /checksum mismatch/);
  await assert.rejects(runPlatformMigrations(source, 'core'), /checksum mismatch/);
  const { migrationChecksum } = require('@idp/shared/dist/database/migration-registry');
  await source.query('UPDATE idp_schema_migrations SET checksum=$1 WHERE id=$2',
    [migrationChecksum(platformMigrations('core')[0]), '0001_platform_users']);
  await source.query("INSERT INTO idp_schema_migrations (id, checksum) VALUES ('9999_future', 'unknown')");
  await assert.rejects(assertPlatformSchema(source, 'core'), /unknown to this release/);
  await source.query("DELETE FROM idp_schema_migrations WHERE id IN ('9999_future', '0001_platform_users')");
  await assert.rejects(assertPlatformSchema(source, 'core'), /missing dependencies/);
});

test('DDL failure rolls back all baselines and history, and a subsequent attempt succeeds', async () => {
  const source = await fresh();
  const original = source.createQueryRunner.bind(source);
  source.createQueryRunner = (...args) => {
    const runner = original(...args), query = runner.query.bind(runner);
    runner.query = (sql, ...parameters) => {
      if (/CREATE TABLE.*"orchestration_operations"/.test(sql)) throw Error('Synthetic migration failure');
      return query(sql, ...parameters);
    };
    return runner;
  };
  await assert.rejects(runPlatformMigrations(source, 'core'), /Synthetic migration failure/);
  source.createQueryRunner = original;
  assert.equal(await hasLedger(source), false);
  assert.equal((await source.query("SELECT to_regclass('public.tenants') AS name"))[0].name, null);
  assert.equal((await source.query("SELECT to_regclass('public.users') AS name"))[0].name, null);
  await runPlatformMigrations(source, 'core'); await assertNoDiff(source);
});

test('concurrent installers serialize, and catalog-first installation can later add Core', async () => {
  const source = await fresh(catalogEntities);
  await runPlatformMigrations(source, 'catalog'); await assertNoDiff(source);
  const first = await view(source, coreEntities), second = await view(source, coreEntities);
  const outcomes = await Promise.all([runPlatformMigrations(first, 'core'), runPlatformMigrations(second, 'core')]);
  assert.deepEqual(outcomes.map((applied) => applied.length).sort(), [0, 3]);
  await assertNoDiff(first); await assertPlatformSchema(first, 'core');
});

test('ordinary service connections can check readiness without permission to alter schema', async () => {
  const source = await fresh(); await runPlatformMigrations(source, 'core');
  const {username, password} = await fixtures.get(source).createReader();
  await source.query('GRANT USAGE ON SCHEMA public TO ' + username);
  await source.query('GRANT SELECT ON public.idp_schema_migrations TO ' + username);
  const reader = new DataSource({ ...source.options, username, password }); sources.add(reader);
  await initializePlatformDataSource(reader, 'core');
  await assert.rejects(reader.query('CREATE TABLE forbidden_table (id integer)'), /permission denied/);
});

test('a subsequent registered upgrade preserves existing rows, cannot be faked by adoption and runs once', async () => {
  const source = await fresh(); await runPlatformMigrations(source, 'core');
  await source.query("INSERT INTO tenants (hostname) VALUES ('upgrade.example.test')");
  const registry = require('@idp/shared/dist/database/migration-registry');
  const original = registry.platformMigrations;
  const upgrade = { id: '0005_test_upgrade', kind: 'upgrade', dependencies: ['0003_platform_core'], tables: [],
    sql: ['ALTER TABLE tenants ADD COLUMN release_note varchar NULL'] };
  registry.allPlatformMigrations.push(upgrade);
  registry.platformMigrations = (schema) => schema === 'core' ? [...original(schema), upgrade] : original(schema);
  try {
    await assert.rejects(runPlatformMigrations(source, 'core', true), /Only initial baselines/);
    await assert.rejects(assertPlatformSchema(source, 'core'), /pending/);
    assert.deepEqual(await runPlatformMigrations(source, 'core'), [upgrade.id]);
    assert.deepEqual(await runPlatformMigrations(source, 'core'), []);
    await assertPlatformSchema(source, 'core');
    assert.deepEqual(await source.query('SELECT hostname, release_note FROM tenants'),
      [{ hostname: 'upgrade.example.test', release_note: null }]);
  } finally { registry.platformMigrations = original; registry.allPlatformMigrations.pop(); }
});
