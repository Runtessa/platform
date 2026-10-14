require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DataSource } = require('typeorm');
const { nativePostgres: disposablePostgres } = require('./native-postgres.cjs');
const { coreEntities } = require('@idp/shared/dist/database/entities');
const exec = promisify(execFile);
let database, source, directory, envFile;
const cli = (command, target = 'core') => exec(process.execPath,
  [require.resolve('@idp/shared/dist/database/cli'), command, '--target', target, '--env-file', envFile],
  { env: { PATH: process.env.PATH }, timeout: 30000 });
before(async () => {
  database = await disposablePostgres();
  source = new DataSource({ ...database.config, entities: coreEntities }); await source.initialize();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'idpcore-schema-cli-'));
  envFile = path.join(directory, 'test.env');
  fs.writeFileSync(envFile, `DB_HOST=127.0.0.1\nDB_PORT=${database.config.port}\nDB_USER=${database.config.username}\nDB_PASS=${database.config.password}\nDB_NAME=${database.config.database}\nCORE_DB_SYNC=true\n`, { mode: 0o600 });
});
after(async () => {
  if (source?.isInitialized) await source.destroy().catch(() => {});
  if (database) await database.stop();
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

test('status, plan and diff are read-only and omit credentials', async () => {
  for (const command of ['status', 'plan', 'diff']) {
    const result = await cli(command);
    assert.equal(result.stderr, '');
    assert.ok(!result.stdout.includes(database.config.password));
    assert.ok(!result.stdout.includes('postgresql://'));
    if (command !== 'status') assert.match(result.stdout, /CREATE TABLE/);
    assert.equal((await source.query("SELECT to_regclass('public.users') AS name"))[0].name, null);
    assert.equal((await source.query("SELECT to_regclass('public.idp_schema_migrations') AS name"))[0].name, null);
  }
});

test('explicit CLI migration works with a packaged native entrypoint and repeats safely', async () => {
  const result = await cli('migrate');
  assert.equal(JSON.parse(result.stdout).applied.length, 4);
  assert.deepEqual(JSON.parse((await cli('migrate')).stdout).applied, []);
  const status = JSON.parse((await cli('status')).stdout);
  assert.ok(status.migrations.every((migration) => migration.applied));
  assert.doesNotMatch((await cli('diff')).stdout, /ALTER TABLE|CREATE TABLE|DROP TABLE/);
});

test('invalid command targets fail before database work and connection errors do not expose credentials', async () => {
  await assert.rejects(cli('migrate', '__proto__'), (error) => /Invalid.*target/.test(error.stderr));
  fs.writeFileSync(envFile, fs.readFileSync(envFile, 'utf8')
    .replace('DB_HOST=127.0.0.1', `DB_HOST=${path.join(directory, 'missing-socket')}`));
  await assert.rejects(cli('status'), (error) => {
    assert.ok(!error.stderr.includes(database.config.password));
    assert.match(error.stderr, /Database command failed/); return true;
  });
});
