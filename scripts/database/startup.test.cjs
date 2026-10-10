const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../security/logging-harness.cjs');
const { platformConnectionOptions } = require('@idp/shared/dist/database/connection-options');
const { coreEntities } = require('@idp/shared/dist/database/entities');

test('migration dependencies are validated before SQL while independent catalog installation remains valid', () => {
  const { pendingMigrations } = require('@idp/shared/dist/database/migration-history');
  const { platformMigrations, migrationChecksum } = require('@idp/shared/dist/database/migration-registry');
  const migrations = platformMigrations('core');
  assert.throws(() => pendingMigrations([], [migrations[2]]), /misordered dependencies/);
  const catalog = migrations[1];
  assert.deepEqual(pendingMigrations([{ id: catalog.id, checksum: migrationChecksum(catalog) }], migrations)
    .map((migration) => migration.id), ['0001_platform_users', '0003_platform_core']);
});

test('a dedicated Core URL keeps its database, host, port and credentials separate from IDE settings', () => {
  const url = 'postgresql://core_user:synthetic@core.example.test:6432/platform';
  const options = platformConnectionOptions('catalog', { CORE_DATABASE_URL: url,
    DATABASE_URL: 'postgresql://ide_user:synthetic@ide.example.test/ide',
    DB_NAME: 'ide', DB_HOST: 'ide.example.test', DB_USER: 'ide_user', DB_PASS: 'synthetic', DB_PORT: '5432',
  });
  assert.equal(options.url, url);
  for (const field of ['database', 'host', 'username', 'password', 'port']) assert.equal(options[field], undefined);
  assert.equal(platformConnectionOptions('ide', { DATABASE_URL: url }).port, undefined);
  const overridden = platformConnectionOptions('catalog', { CORE_DATABASE_URL: url, CORE_DB_HOST: 'override.example.test' });
  assert.equal(overridden.host, 'override.example.test');
});

test('every platform startup path ignores old schema-sync flags and delegates to the readiness check', async () => {
  const calls = [];
  class Source { constructor(options) { this.options = options; } }
  const common = {
    'reflect-metadata': {}, typeorm: { DataSource: Source },
    '@idp/shared': { safeErrorMeta: () => ({}), User: 'User' },
    '@idp/shared/dist/database/connection-options': { platformConnectionOptions: (schema) => platformConnectionOptions(schema, {
      DB_TYPE: 'postgres', NODE_ENV: 'development', CORE_DB_SYNC: 'true', DB_NAME: 'synthetic',
    }) },
    '@idp/shared/dist/database/schema-readiness': {
      initializePlatformDataSource: async (source, schema) => { calls.push(schema); return source; },
    },
    '@idp/shared/dist/database/entities': { coreEntities },
    './safeDatabaseLogger': { SafeDatabaseLogger: class {} }, './password': { hashPassword: async () => 'synthetic' },
  };
  const app = load('src/core/core/datasource.ts', common);
  const global = load('src/core/core/globalDatasource.ts', common);
  const ide = load('src/ideNew/src/lib/db.ts', common);
  const core = load('src/ideNew/src/lib/core-db.ts', common);
  const sources = [await app.initializeDataSource(), await global.getCoreGlobalDataSource(), ide.AppDataSource, core.CoreDataSource];
  await ide.ensureSchema(); await core.ensureCoreSchema();
  assert.deepEqual(calls, ['core', 'catalog', 'ide', 'core']);
  for (const source of sources) {
    assert.equal(source.options.synchronize, false);
    assert.equal(source.options.migrationsRun, false);
    assert.equal(source.options.installExtensions, false);
  }
});

test('IDE module import does no database work; first request coalesces initialization', async (t) => {
  delete global.__APP_INIT_PROMISE; t.after(() => delete global.__APP_INIT_PROMISE);
  let reads = 0, writes = 0, release;
  const { ensureAppInitialized } = load('src/ideNew/src/lib/init.ts', {
    './db': { ensureSchema: async () => { reads++; await new Promise((resolve) => { release = resolve; }); },
      ensureAdminUser: async () => { writes++; } },
    './logger': { logger: { info: async () => {} } },
  });
  assert.equal(reads, 0); assert.equal(writes, 0);
  const first = ensureAppInitialized(), second = ensureAppInitialized();
  assert.equal(first, second); assert.equal(reads, 1);
  release(); await first; await ensureAppInitialized();
  assert.equal(writes, 1); assert.equal(reads, 1);
});

test('IDE retries readiness after a failed first request instead of caching failure forever', async (t) => {
  delete global.__APP_INIT_PROMISE; t.after(() => delete global.__APP_INIT_PROMISE);
  let attempts = 0, writes = 0;
  const { ensureAppInitialized } = load('src/ideNew/src/lib/init.ts', {
    './db': { ensureSchema: async () => { if (++attempts === 1) throw Error('Pending migrations'); },
      ensureAdminUser: async () => { writes++; } },
    './logger': { logger: { info: async () => {} } },
  });
  await assert.rejects(ensureAppInitialized(), /Pending migrations/);
  await ensureAppInitialized(); assert.equal(attempts, 2); assert.equal(writes, 1);
});
